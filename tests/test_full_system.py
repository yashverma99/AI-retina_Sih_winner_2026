import unittest
import io
import json
import tempfile
from pathlib import Path
from PIL import Image

class TestRetinaAISystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        from backend.app import app
        from backend.database import init_database
        from backend.auth import create_admin

        cls.app = app
        cls.client = app.test_client()

        # Initialize DB and admin
        init_database()
        create_admin()

        # Create a small valid test JPEG image in memory
        img = Image.new("RGB", (100, 100), color=(180, 50, 30))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        cls.valid_image_bytes = buf.getvalue()

    def test_01_health_check(self):
        """Test GET / returns 200 and success status."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get("status"), "success")
        self.assertIn("RetinaAI", data.get("message", ""))

    def test_02_login_valid_admin(self):
        """Test POST /login with demo admin credentials."""
        response = self.client.post("/login", json={
            "email": "admin@retinaai.com",
            "password": "admin123"
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("user", {}).get("email"), "admin@retinaai.com")

    def test_03_login_invalid_credentials(self):
        """Test POST /login with wrong password returns 401."""
        response = self.client.post("/login", json={
            "email": "admin@retinaai.com",
            "password": "wrongpassword"
        })
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertFalse(data.get("success"))

    def test_04_login_missing_fields(self):
        """Test POST /login with missing email or password returns 400."""
        response = self.client.post("/login", json={})
        self.assertEqual(response.status_code, 400)

        response2 = self.client.post("/login", json={"email": "admin@retinaai.com"})
        self.assertEqual(response2.status_code, 400)

    def test_05_signup_and_login_flow(self):
        """Test POST /signup creates new user and allows login."""
        import uuid
        unique_email = f"dr_{uuid.uuid4().hex[:6]}@hospital.org"
        signup_res = self.client.post("/signup", json={
            "name": "Dr. Test Specialist",
            "email": unique_email,
            "password": "securepassword123",
            "confirm_password": "securepassword123"
        })
        self.assertEqual(signup_res.status_code, 201)
        data = signup_res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("user", {}).get("email"), unique_email)

        # Duplicate signup should return 409 Conflict
        dup_res = self.client.post("/signup", json={
            "name": "Dr. Duplicate",
            "email": unique_email,
            "password": "securepassword123",
            "confirm_password": "securepassword123"
        })
        self.assertEqual(dup_res.status_code, 409)

        # Test login with newly created user
        login_res = self.client.post("/login", json={
            "email": unique_email,
            "password": "securepassword123"
        })
        self.assertEqual(login_res.status_code, 200)

    def test_06_signup_validation(self):
        """Test POST /signup validation for mismatched passwords and short passwords."""
        # Mismatched passwords
        res1 = self.client.post("/signup", json={
            "name": "Dr. Test",
            "email": "test_mismatch@hospital.org",
            "password": "password123",
            "confirm_password": "different123"
        })
        self.assertEqual(res1.status_code, 400)

        # Short password (< 6 chars)
        res2 = self.client.post("/signup", json={
            "name": "Dr. Test",
            "email": "test_short@hospital.org",
            "password": "123",
            "confirm_password": "123"
        })
        self.assertEqual(res2.status_code, 400)

    def test_07_patient_lifecycle(self):
        """Test patient creation, retrieval, and listing."""
        import uuid
        custom_id = f"PAT-TEST-{uuid.uuid4().hex[:4].upper()}"

        # Create patient
        create_res = self.client.post("/patients", json={
            "patient_id": custom_id,
            "name": "Ramesh Gupta",
            "age": 58,
            "gender": "Male",
            "phone": "+91 9876543210"
        })
        self.assertEqual(create_res.status_code, 201)
        created_data = create_res.get_json()
        self.assertTrue(created_data.get("success"))
        assigned_id = created_data["patient"]["patient_id"]
        self.assertTrue(assigned_id.startswith("PAT-"))

        # Fetch patient by ID
        get_res = self.client.get(f"/patients/{assigned_id}")
        self.assertEqual(get_res.status_code, 200)
        patient_data = get_res.get_json()
        self.assertEqual(patient_data["patient"]["name"], "Ramesh Gupta")

        # Non-existent patient
        not_found_res = self.client.get("/patients/NON_EXISTENT_ID_999")
        self.assertEqual(not_found_res.status_code, 404)

        # List patients
        list_res = self.client.get("/patients")
        self.assertEqual(list_res.status_code, 200)
        patients_list = list_res.get_json().get("patients", [])
        self.assertTrue(any(p["patient_id"] == assigned_id for p in patients_list))

    def test_08_screening_lifecycle(self):
        """Test screening creation, listing, and single screening retrieval."""
        # Create patient first
        pat_res = self.client.post("/patients", json={
            "name": "Sunita Sharma",
            "age": 62,
            "gender": "Female"
        })
        self.assertEqual(pat_res.status_code, 201)
        pat_id = pat_res.get_json()["patient"]["patient_id"]

        # Save screening for this patient
        scr_res = self.client.post("/screenings", json={
            "patient_id": pat_id,
            "image_path": "uploads/screenings/test_folder/original.jpg",
            "grade": 2,
            "diagnosis": "Moderate Diabetic Retinopathy",
            "confidence": 88.5,
            "referable_probability": 91.2,
            "referable": True,
            "gradcam_path": "uploads/screenings/test_folder/gradcam.jpg"
        })
        self.assertEqual(scr_res.status_code, 201)
        scr_data = scr_res.get_json()
        self.assertTrue(scr_data.get("success"))
        screening_id = scr_data["screening"]["id"]

        # Fetch patient's screenings
        pat_scr_res = self.client.get(f"/screenings/{pat_id}")
        self.assertEqual(pat_scr_res.status_code, 200)
        self.assertGreaterEqual(len(pat_scr_res.get_json().get("screenings", [])), 1)

        # Fetch single screening by screening_id
        single_scr_res = self.client.get(f"/screening/{screening_id}")
        self.assertEqual(single_scr_res.status_code, 200)
        self.assertEqual(single_scr_res.get_json()["screening"]["id"], screening_id)

        # Fetch all screenings
        all_scr_res = self.client.get("/screenings")
        self.assertEqual(all_scr_res.status_code, 200)
        self.assertIn("screenings", all_scr_res.get_json())

    def test_09_dashboard_stats_and_analytics(self):
        """Test /dashboard/stats and /analytics aggregations."""
        stats_res = self.client.get("/dashboard/stats")
        self.assertEqual(stats_res.status_code, 200)
        stats_data = stats_res.get_json().get("stats", {})
        self.assertIn("total_patients", stats_data)
        self.assertIn("total_screenings", stats_data)
        self.assertIn("total_referrals", stats_data)

        analytics_res = self.client.get("/analytics")
        self.assertEqual(analytics_res.status_code, 200)
        analytics_data = analytics_res.get_json().get("analytics", {})
        self.assertIn("total_patients", analytics_data)
        self.assertIn("grade_distribution", analytics_data)
        self.assertIn("monthly_activity", analytics_data)

    def test_10_image_enhancement(self):
        """Test POST /enhance with valid image and invalid payload."""
        # Valid image
        res = self.client.post(
            "/enhance",
            data={"image": (io.BytesIO(self.valid_image_bytes), "retina.jpg")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertTrue(len(data.get("image", "")) > 100)

        # Missing image
        res_no_img = self.client.post("/enhance", data={})
        self.assertEqual(res_no_img.status_code, 400)

        # Corrupted / invalid file
        res_corrupt = self.client.post(
            "/enhance",
            data={"image": (io.BytesIO(b"not an image data"), "corrupt.jpg")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res_corrupt.status_code, 400)

    def test_11_prediction_endpoint(self):
        """Test POST /predict returns 5-class prediction and confidence."""
        res = self.client.post(
            "/predict",
            data={"image": (io.BytesIO(self.valid_image_bytes), "retina.jpg")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn(data.get("grade"), [0, 1, 2, 3, 4])
        self.assertIn("diagnosis", data)
        self.assertIn("confidence", data)
        self.assertIn("referable_probability", data)
        self.assertEqual(len(data.get("probabilities", [])), 5)

        # Missing image
        res_missing = self.client.post("/predict", data={})
        self.assertEqual(res_missing.status_code, 400)

    def test_12_gradcam_endpoint(self):
        """Test POST /gradcam generates explainability map safely."""
        res = self.client.post(
            "/gradcam",
            data={
                "image": (io.BytesIO(self.valid_image_bytes), "retina.jpg"),
                "patient_id": "PAT-TEST-GRAD"
            },
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("gradcam_image", data)
        self.assertIn("image_path", data)
        self.assertIn("gradcam_path", data)

    def test_13_high_resolution_image_safety(self):
        """Test that a large high-resolution image does not crash the server."""
        # Create a larger 1600x1200 image
        large_img = Image.new("RGB", (1600, 1200), color=(100, 40, 30))
        buf = io.BytesIO()
        large_img.save(buf, format="JPEG", quality=85)
        large_bytes = buf.getvalue()

        # Predict with large image
        pred_res = self.client.post(
            "/predict",
            data={"image": (io.BytesIO(large_bytes), "large_retina.jpg")},
            content_type="multipart/form-data"
        )
        self.assertEqual(pred_res.status_code, 200)

        # Grad-CAM with large image
        grad_res = self.client.post(
            "/gradcam",
            data={"image": (io.BytesIO(large_bytes), "large_retina.jpg")},
            content_type="multipart/form-data"
        )
        self.assertEqual(grad_res.status_code, 200)

    def test_14_path_traversal_protection(self):
        """Test that path traversal attempts in /uploads are blocked or safely return 404."""
        # Try accessing outside upload directory
        res = self.client.get("/uploads/../../backend/app.py")
        self.assertIn(res.status_code, [400, 404])

        res2 = self.client.get("/uploads/..%2F..%2Fbackend%2Fapp.py")
        self.assertIn(res2.status_code, [400, 404])

    def test_15_sql_injection_resilience(self):
        """Test that SQL injection strings are safely treated as literal text."""
        sqli_email = "' OR 1=1 --"
        res = self.client.post("/login", json={
            "email": sqli_email,
            "password": "password"
        })
        self.assertEqual(res.status_code, 401)

        # SQL injection in patient search / query
        sqli_id = "PAT-0001' UNION SELECT 1,2,3,4,5,6,7 --"
        res_pat = self.client.get(f"/patients/{sqli_id}")
        self.assertEqual(res_pat.status_code, 404)

    def test_16_oversized_payload_protection(self):
        """Test that payloads exceeding MAX_CONTENT_LENGTH (16MB) return 413."""
        huge_data = b"0" * (17 * 1024 * 1024)
        res = self.client.post(
            "/predict",
            data={"image": (io.BytesIO(huge_data), "huge.jpg")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 413)
        self.assertEqual(res.get_json().get("success"), False)

if __name__ == "__main__":
    unittest.main()
