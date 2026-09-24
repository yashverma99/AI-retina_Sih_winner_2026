from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import torch
import torch.nn.functional as F

from PIL import Image, ImageEnhance
from torchvision import transforms

from io import BytesIO
import base64
from pathlib import Path
from datetime import datetime
import uuid
import numpy as np

from backend.model import model, device, model_loaded

from backend.database import init_database, get_connection
from backend.auth import hash_password, verify_password, create_admin


# =========================================================
# APP CONFIG
# =========================================================

app = Flask(__name__)
CORS(app)

# Limit uploads to 16MB to protect against memory exhaustion DoS
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        "success": False,
        "message": "File too large. Maximum allowed size is 16 MB."
    }), 413


init_database()
create_admin()


# =========================================================
# STORAGE CONFIG
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

import tempfile

UPLOAD_DIR = Path(tempfile.gettempdir()) / "retinaai_uploads"
SCREENING_DIR = UPLOAD_DIR / "screenings"

SCREENING_DIR.mkdir(
    parents=True,
    exist_ok=True
)

print("Image storage:", SCREENING_DIR)


# =========================================================
# IMAGE PREPROCESSING
# =========================================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def validate_fundus_image(image):
    """
    Lightweight fundus-image quality gate.

    This is NOT a medical-grade fundus classifier.
    It is designed to reject obvious non-retinal/random images
    before sending them to the DR classification model.
    """

    try:
        image = image.convert("RGB")

        width, height = image.size

        # -------------------------------------------------
        # 1. Basic resolution check
        # -------------------------------------------------

        if width < 160 or height < 160:
            return (
                False,
                "Image resolution is too low. "
                "Please upload a clearer retinal fundus image."
            )

        # -------------------------------------------------
        # 2. Extreme aspect-ratio rejection
        # -------------------------------------------------

        aspect_ratio = max(width, height) / min(width, height)

        if aspect_ratio > 1.8:
            return (
                False,
                "Invalid image shape. "
                "Please upload a retinal fundus image."
            )

        # -------------------------------------------------
        # 3. Convert to NumPy
        # -------------------------------------------------

        small = image.copy()
        small.thumbnail((256, 256))

        arr = np.asarray(small).astype(np.float32)

        gray = (
            0.299 * arr[:, :, 0]
            + 0.587 * arr[:, :, 1]
            + 0.114 * arr[:, :, 2]
        )

        # -------------------------------------------------
        # 4. Check brightness distribution
        # -------------------------------------------------

        mean_brightness = float(gray.mean())
        brightness_std = float(gray.std())

        if mean_brightness < 25:
            return (
                False,
                "Image is too dark. "
                "Please upload a properly illuminated retinal fundus image."
            )

        if mean_brightness > 245:
            return (
                False,
                "Image is overexposed. "
                "Please upload a retinal fundus image."
            )

        # -------------------------------------------------
        # 5. Fundus images usually contain a concentrated
        #    retinal field surrounded by darker regions.
        # -------------------------------------------------

        h, w = gray.shape

        center_y = h // 2
        center_x = w // 2

        radius = int(min(h, w) * 0.42)

        y, x = np.ogrid[:h, :w]

        center_mask = (
            (x - center_x) ** 2
            + (y - center_y) ** 2
            <= radius ** 2
        )

        center_pixels = gray[center_mask]

        if len(center_pixels) == 0:
            return (
                False,
                "Unable to detect a retinal image region."
            )

        center_mean = float(center_pixels.mean())

        # -------------------------------------------------
        # 6. Compare central retinal region with image
        # -------------------------------------------------

        if center_mean < 35:
            return (
                False,
                "No clear retinal region detected. "
                "Please upload a retinal fundus image."
            )

        # -------------------------------------------------
        # 7. Basic color characteristics
        # -------------------------------------------------

        red = arr[:, :, 0]
        green = arr[:, :, 1]
        blue = arr[:, :, 2]

        red_mean = float(red.mean())
        green_mean = float(green.mean())
        blue_mean = float(blue.mean())

        # Fundus photographs generally have a warm/red
        # retinal appearance. This is intentionally a soft check.
        warm_ratio = (
            red_mean + 1.0
        ) / (
            green_mean + blue_mean + 2.0
        )

        if warm_ratio < 0.55:
            return (
                False,
                "The uploaded image does not appear to be "
                "a retinal fundus photograph."
            )

        # -------------------------------------------------
        # 8. Texture check
        # -------------------------------------------------

        if brightness_std < 10:
            return (
                False,
                "Image contains insufficient retinal detail. "
                "Please upload a clearer fundus image."
            )

        return True, "Fundus image quality check passed."

    except Exception as e:
        print("Fundus validation error:", e)

        return (
            False,
            "Unable to validate the uploaded image."
        )


def prepare_image(file):
    image = Image.open(file).convert("RGB")

    if max(image.size) > 800:
        image.thumbnail((800, 800))

    tensor = transform(image).unsqueeze(0)

    return image, tensor.to(device)


def image_to_base64(image):
    buffer = BytesIO()

    image.save(
        buffer,
        format="JPEG"
    )

    encoded = base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")

    return encoded


def save_image(image, folder, filename):
    folder = Path(folder)

    folder.mkdir(
        parents=True,
        exist_ok=True
    )

    file_path = folder / filename

    image.save(
        file_path,
        format="JPEG",
        quality=95
    )

    return file_path


def create_screening_folder():
    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    unique_id = uuid.uuid4().hex[:8]

    folder_name = f"{timestamp}_{unique_id}"

    folder = SCREENING_DIR / folder_name

    folder.mkdir(
        parents=True,
        exist_ok=True
    )

    return folder, folder_name


# =========================================================
# HOME
# =========================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "success",
        "message": "RetinaAI backend is running!"
    })


# =========================================================
# LOGIN
# =========================================================

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request"
        }), 400

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    try:
        conn = get_connection()

        user = conn.execute(
            """
            SELECT
                id,
                name,
                email,
                password_hash,
                role
            FROM users
            WHERE email = ?
            """,
            (email,)
        ).fetchone()

        conn.close()

        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        if not verify_password(
            password,
            user["password_hash"]
        ):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        })

    except Exception as e:
        print("Login error:", e)

        return jsonify({
            "success": False,
            "message": "Login failed"
        }), 500


# =========================================================
# SIGNUP
# =========================================================

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Invalid request"
        }), 400

    name = data.get(
        "name",
        ""
    ).strip()

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    confirm_password = data.get(
        "confirm_password",
        ""
    )

    if not name:
        return jsonify({
            "success": False,
            "message": "Name is required"
        }), 400

    if not email:
        return jsonify({
            "success": False,
            "message": "Email is required"
        }), 400

    if "@" not in email or "." not in email:
        return jsonify({
            "success": False,
            "message": "Please enter a valid email address"
        }), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters"
        }), 400

    if password != confirm_password:
        return jsonify({
            "success": False,
            "message": "Passwords do not match"
        }), 400

    try:
        conn = get_connection()

        existing_user = conn.execute(
            """
            SELECT id
            FROM users
            WHERE email = ?
            """,
            (email,)
        ).fetchone()

        if existing_user:
            conn.close()

            return jsonify({
                "success": False,
                "message": "An account with this email already exists"
            }), 409

        password_hash = hash_password(password)

        cursor = conn.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                password_hash,
                role
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                name,
                email,
                password_hash,
                "admin"
            )
        )

        conn.commit()

        user_id = cursor.lastrowid

        conn.close()

        return jsonify({
            "success": True,
            "message": "Account created successfully",
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "role": "admin"
            }
        }), 201

    except Exception as e:
        print("Signup error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to create account"
        }), 500


# =========================================================
# IMAGE ENHANCEMENT
# =========================================================

@app.route("/enhance", methods=["POST"])
def enhance():
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "message": "No image uploaded"
        }), 400

    try:
        file = request.files["image"]

        if not file or not file.filename:
            return jsonify({
                "success": False,
                "message": "Empty or missing image file"
            }), 400

        image = Image.open(file).convert("RGB")

        # -------------------------------------------------
        # Fundus validation
        # -------------------------------------------------

        is_fundus, validation_message = validate_fundus_image(
            image
        )

        if not is_fundus:
            return jsonify({
                "success": False,
                "validation_failed": True,
                "message": validation_message
            }), 422

        if max(image.size) > 800:
            image.thumbnail((800, 800))

        enhanced = ImageEnhance.Contrast(
            image
        ).enhance(1.25)

        enhanced = ImageEnhance.Sharpness(
            enhanced
        ).enhance(1.2)

        return jsonify({
            "success": True,
            "image": image_to_base64(enhanced)
        })

    except Exception as e:
        print("Enhancement error:", e)

        return jsonify({
            "success": False,
            "message": "Invalid or corrupted image file."
        }), 400


# =========================================================
# PREDICTION
# =========================================================

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "message": "No image uploaded"
        }), 400

    try:
        file = request.files["image"]

        if not file or not file.filename:
            return jsonify({
                "success": False,
                "message": "Empty or missing image file"
            }), 400

        # -------------------------------------------------
        # Fundus validation
        # -------------------------------------------------

        try:
            validation_image = Image.open(file).convert("RGB")

        except Exception:
            return jsonify({
                "success": False,
                "message": "Invalid or corrupted image file."
            }), 400

        is_fundus, validation_message = validate_fundus_image(
            validation_image
        )

        if not is_fundus:
            return jsonify({
                "success": False,
                "validation_failed": True,
                "message": validation_message
            }), 422

        # Reset file pointer before preprocessing
        file.seek(0)

        image, tensor = prepare_image(file)

        with torch.no_grad():
            output = model(tensor)

            probabilities = F.softmax(
                output,
                dim=1
            )[0]

        predicted_class = int(
            torch.argmax(probabilities).item()
        )

        confidence = float(
            probabilities[predicted_class].item()
        )

        referable_probability = float(
            probabilities[2:].sum().item()
        )

        referable = (
            referable_probability >= 0.50
        )

        diagnoses = {
            0: "No Diabetic Retinopathy",
            1: "Mild Diabetic Retinopathy",
            2: "Moderate Diabetic Retinopathy",
            3: "Severe Diabetic Retinopathy",
            4: "Proliferative Diabetic Retinopathy"
        }

        diagnosis = diagnoses[predicted_class]

        return jsonify({
            "success": True,
            "grade": predicted_class,
            "diagnosis": diagnosis,
            "confidence": confidence,
            "referable_probability": referable_probability,
            "referable": referable,
            "probabilities": [
                float(x.item())
                for x in probabilities
            ]
        })

    except Exception as e:
        print("Prediction error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# GRAD-CAM + IMAGE PERSISTENCE
# =========================================================

@app.route("/gradcam", methods=["POST"])
def gradcam():
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "message": "No image uploaded"
        }), 400

    try:
        file = request.files["image"]

        if not file or not file.filename:
            return jsonify({
                "success": False,
                "message": "Empty or missing image file"
            }), 400

        patient_id = request.form.get(
            "patient_id",
            ""
        ).strip()

        image = Image.open(file).convert("RGB")

        # -------------------------------------------------
        # Fundus validation
        # -------------------------------------------------

        is_fundus, validation_message = validate_fundus_image(
            image
        )

        if not is_fundus:
            return jsonify({
                "success": False,
                "validation_failed": True,
                "message": validation_message
            }), 422

        # Downsample large images to max 800px
        # to prevent OOM crash on 512MB RAM cloud containers
        if max(image.size) > 800:
            image.thumbnail((800, 800))

        tensor = transform(image).unsqueeze(0)
        tensor = tensor.to(device)

        activations = []
        gradients = []

        target_layer = model.features[-1]

        def forward_hook(module, input, output):
            activations.append(output)

        def backward_hook(module, grad_input, grad_output):
            gradients.append(grad_output[0])

        forward_handle = target_layer.register_forward_hook(
            forward_hook
        )

        backward_handle = target_layer.register_full_backward_hook(
            backward_hook
        )

        try:
            model.zero_grad()

            with torch.enable_grad():
                output = model(tensor)

                predicted_class = output.argmax(
                    dim=1
                ).item()

                score = output[
                    0,
                    predicted_class
                ]

                score.backward()

        finally:
            forward_handle.remove()
            backward_handle.remove()

        activation = activations[0]
        gradient = gradients[0]

        weights = gradient.mean(
            dim=(2, 3),
            keepdim=True
        )

        cam = (
            weights * activation
        ).sum(dim=1)

        cam = F.relu(cam)

        cam = (
            cam.squeeze()
            .detach()
            .cpu()
        )

        cam -= cam.min()

        if cam.max() > 0:
            cam /= cam.max()

        cam = cam.numpy()

        cam_image = Image.fromarray(
            np.uint8(cam * 255)
        )

        cam_image = cam_image.resize(
            image.size
        )

        cam_array = np.array(cam_image)

        original_array = np.array(
            image,
            dtype=np.float32
        )

        heatmap = np.zeros_like(
            original_array,
            dtype=np.float32
        )

        heatmap[:, :, 0] = cam_array

        heatmap[:, :, 1] = (
            cam_array // 3
        )

        overlay = (
            0.55 * original_array
            + 0.45 * heatmap
        )

        overlay = np.uint8(
            np.clip(
                overlay,
                0,
                255
            )
        )

        overlay_image = Image.fromarray(
            overlay
        )

        # Free intermediate array memory immediately
        del (
            activations,
            gradients,
            output,
            score,
            activation,
            gradient,
            cam,
            cam_array,
            original_array,
            heatmap,
            overlay
        )

        import gc
        gc.collect()

        # =================================================
        # CREATE PER-SCREENING STORAGE
        # =================================================

        screening_folder, folder_name = (
            create_screening_folder()
        )

        # =================================================
        # SAVE ORIGINAL IMAGE
        # =================================================

        original_filename = "original.jpg"

        original_path = save_image(
            image,
            screening_folder,
            original_filename
        )

        # =================================================
        # SAVE GRAD-CAM IMAGE
        # =================================================

        gradcam_filename = "gradcam.jpg"

        gradcam_path = save_image(
            overlay_image,
            screening_folder,
            gradcam_filename
        )

        # =================================================
        # DATABASE / URL PATHS
        # =================================================

        image_relative_path = (
            f"uploads/screenings/"
            f"{folder_name}/"
            f"{original_filename}"
        )

        gradcam_relative_path = (
            f"uploads/screenings/"
            f"{folder_name}/"
            f"{gradcam_filename}"
        )

        # =================================================
        # RESPONSE
        # =================================================

        return jsonify({
            "success": True,

            "original_image": image_to_base64(
                image
            ),

            "gradcam_image": image_to_base64(
                overlay_image
            ),

            "image": image_to_base64(
                overlay_image
            ),

            "predicted_class": predicted_class,

            "image_path": image_relative_path,

            "gradcam_path": gradcam_relative_path,

            "patient_id": patient_id
        })

    except Exception as e:
        print("Grad-CAM error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# SERVE STORED SCREENING IMAGES
# =========================================================

@app.route(
    "/uploads/<path:filename>",
    methods=["GET"]
)
def serve_upload(filename):
    return send_from_directory(
        UPLOAD_DIR,
        filename
    )


# =========================================================
# CREATE PATIENT
# =========================================================

@app.route("/patients", methods=["POST"])
def create_patient():
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    name = data.get(
        "name",
        ""
    ).strip()

    age = data.get("age")

    gender = data.get(
        "gender",
        ""
    )

    phone = data.get(
        "phone",
        ""
    )

    if not name:
        return jsonify({
            "success": False,
            "message": "Patient name is required"
        }), 400

    try:
        conn = get_connection()

        last_patient = conn.execute(
            """
            SELECT patient_id
            FROM patients
            ORDER BY id DESC
            LIMIT 1
            """
        ).fetchone()

        if last_patient:
            try:
                last_number = int(
                    last_patient["patient_id"].replace(
                        "PAT-",
                        ""
                    )
                )

                new_number = last_number + 1

            except Exception:
                new_number = 1

        else:
            new_number = 1

        patient_id = f"PAT-{new_number:04d}"

        cursor = conn.execute(
            """
            INSERT INTO patients
            (
                patient_id,
                name,
                age,
                gender,
                phone
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                patient_id,
                name,
                age,
                gender,
                phone
            )
        )

        conn.commit()

        patient = conn.execute(
            """
            SELECT *
            FROM patients
            WHERE id = ?
            """,
            (
                cursor.lastrowid,
            )
        ).fetchone()

        conn.close()

        return jsonify({
            "success": True,
            "message": "Patient created successfully",
            "patient": dict(patient)
        }), 201

    except Exception as e:
        print("Create patient error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# GET ALL PATIENTS
# =========================================================

@app.route("/patients", methods=["GET"])
def get_patients():
    try:
        conn = get_connection()

        patients = conn.execute(
            """
            SELECT
                p.*,
                COUNT(s.id) AS total_scans
            FROM patients p
            LEFT JOIN screenings s
                ON p.patient_id = s.patient_id
            GROUP BY p.id
            ORDER BY p.id DESC
            """
        ).fetchall()

        conn.close()

        return jsonify({
            "success": True,
            "patients": [
                dict(patient)
                for patient in patients
            ]
        })

    except Exception as e:
        print("Get patients error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# GET SINGLE PATIENT
# =========================================================

@app.route(
    "/patients/<patient_id>",
    methods=["GET"]
)
def get_patient(patient_id):
    try:
        conn = get_connection()

        patient = conn.execute(
            """
            SELECT *
            FROM patients
            WHERE patient_id = ?
            """,
            (
                patient_id,
            )
        ).fetchone()

        if not patient:
            conn.close()

            return jsonify({
                "success": False,
                "message": "Patient not found"
            }), 404

        screenings = conn.execute(
            """
            SELECT *
            FROM screenings
            WHERE patient_id = ?
            ORDER BY created_at DESC
            """,
            (
                patient_id,
            )
        ).fetchall()

        conn.close()

        return jsonify({
            "success": True,
            "patient": dict(patient),
            "screenings": [
                dict(screening)
                for screening in screenings
            ]
        })

    except Exception as e:
        print("Get patient error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# CREATE SCREENING
# =========================================================

@app.route(
    "/screenings",
    methods=["POST"]
)
def create_screening():
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    patient_id = data.get("patient_id")

    if not patient_id:
        return jsonify({
            "success": False,
            "message": "patient_id is required"
        }), 400

    try:
        conn = get_connection()

        patient = conn.execute(
            """
            SELECT id
            FROM patients
            WHERE patient_id = ?
            """,
            (
                patient_id,
            )
        ).fetchone()

        if not patient:
            conn.close()

            return jsonify({
                "success": False,
                "message": "Patient not found"
            }), 404

        cursor = conn.execute(
            """
            INSERT INTO screenings
            (
                patient_id,
                image_path,
                grade,
                diagnosis,
                confidence,
                referable_probability,
                referable,
                gradcam_path
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                patient_id,
                data.get("image_path"),
                data.get("grade"),
                data.get("diagnosis"),
                data.get("confidence"),
                data.get("referable_probability"),
                data.get("referable", 0),
                data.get("gradcam_path")
            )
        )

        conn.commit()

        screening = conn.execute(
            """
            SELECT *
            FROM screenings
            WHERE id = ?
            """,
            (
                cursor.lastrowid,
            )
        ).fetchone()

        conn.close()

        return jsonify({
            "success": True,
            "message": "Screening saved successfully",
            "screening": dict(screening)
        }), 201

    except Exception as e:
        print("Create screening error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# GET PATIENT SCREENINGS
# =========================================================

@app.route(
    "/screenings/<patient_id>",
    methods=["GET"]
)
def get_screenings(patient_id):
    try:
        conn = get_connection()

        screenings = conn.execute(
            """
            SELECT *
            FROM screenings
            WHERE patient_id = ?
            ORDER BY created_at DESC
            """,
            (
                patient_id,
            )
        ).fetchall()

        conn.close()

        return jsonify({
            "success": True,
            "screenings": [
                dict(screening)
                for screening in screenings
            ]
        })

    except Exception as e:
        print("Get screenings error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# DASHBOARD STATS
# =========================================================

@app.route(
    "/dashboard/stats",
    methods=["GET"]
)
def dashboard_stats():
    try:
        conn = get_connection()

        total_patients = conn.execute(
            """
            SELECT COUNT(*)
            AS count
            FROM patients
            """
        ).fetchone()["count"]

        total_scans = conn.execute(
            """
            SELECT COUNT(*)
            AS count
            FROM screenings
            """
        ).fetchone()["count"]

        total_referrals = conn.execute(
            """
            SELECT COUNT(*)
            FROM screenings
            WHERE referable = 1
            """
        ).fetchone()[0]

        recent_patients = conn.execute(
            """
            SELECT
                p.patient_id,
                p.name,
                p.age,
                p.gender,
                p.created_at,
                s.diagnosis,
                s.confidence
            FROM patients p
            LEFT JOIN screenings s
                ON s.id = (
                    SELECT id
                    FROM screenings
                    WHERE patient_id = p.patient_id
                    ORDER BY created_at DESC
                    LIMIT 1
                )
            ORDER BY p.id DESC
            LIMIT 5
            """
        ).fetchall()

        conn.close()

        return jsonify({
            "success": True,

            "stats": {
                "total_patients": total_patients,
                "total_screenings": total_scans,
                "total_referrals": total_referrals
            },

            "recent_patients": [
                dict(patient)
                for patient in recent_patients
            ]
        })

    except Exception as e:
        print("Dashboard stats error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# GET SINGLE SCREENING
# =========================================================

@app.route(
    "/screening/<int:screening_id>",
    methods=["GET"]
)
def get_screening(screening_id):
    try:
        conn = get_connection()

        screening = conn.execute(
            """
            SELECT
                id,
                patient_id,
                image_path,
                grade,
                diagnosis,
                confidence,
                referable_probability,
                referable,
                gradcam_path,
                created_at
            FROM screenings
            WHERE id = ?
            """,
            (
                screening_id,
            )
        ).fetchone()

        conn.close()

        if not screening:
            return jsonify({
                "success": False,
                "message": "Screening not found"
            }), 404

        return jsonify({
            "success": True,
            "screening": dict(screening)
        })

    except Exception as e:
        print("Get screening error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to load screening"
        }), 500


# =========================================================
# GET ALL SCREENINGS
# =========================================================

@app.route(
    "/screenings",
    methods=["GET"]
)
def get_all_screenings():
    try:
        conn = get_connection()

        screenings = conn.execute(
            """
            SELECT
                s.id,
                s.patient_id,
                s.image_path,
                s.grade,
                s.diagnosis,
                s.confidence,
                s.referable_probability,
                s.referable,
                s.gradcam_path,
                s.created_at,
                p.name AS patient_name,
                p.age AS patient_age,
                p.gender AS patient_gender
            FROM screenings s
            LEFT JOIN patients p
                ON s.patient_id = p.patient_id
            ORDER BY
                s.created_at DESC,
                s.id DESC
            """
        ).fetchall()

        conn.close()

        return jsonify({
            "success": True,
            "screenings": [
                dict(screening)
                for screening in screenings
            ]
        })

    except Exception as e:
        print("Get all screenings error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to load screening reports"
        }), 500


# =========================================================
# ANALYTICS
# =========================================================

@app.route(
    "/analytics",
    methods=["GET"]
)
def analytics():
    try:
        conn = get_connection()

        total_patients = conn.execute(
            """
            SELECT COUNT(*)
            FROM patients
            """
        ).fetchone()[0]

        total_screenings = conn.execute(
            """
            SELECT COUNT(*)
            FROM screenings
            """
        ).fetchone()[0]

        referable_cases = conn.execute(
            """
            SELECT COUNT(*)
            FROM screenings
            WHERE referable = 1
            """
        ).fetchone()[0]

        non_referable_cases = (
            total_screenings
            - referable_cases
        )

        average_confidence = conn.execute(
            """
            SELECT AVG(confidence)
            FROM screenings
            """
        ).fetchone()[0]

        if average_confidence is None:
            average_confidence = 0

        grade_rows = conn.execute(
            """
            SELECT
                grade,
                COUNT(*) AS count
            FROM screenings
            GROUP BY grade
            ORDER BY grade ASC
            """
        ).fetchall()

        grade_distribution = {
            "0": 0,
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0
        }

        for row in grade_rows:
            if row["grade"] is not None:
                grade_distribution[
                    str(row["grade"])
                ] = row["count"]

        monthly_rows = conn.execute(
            """
            SELECT
                strftime(
                    '%Y-%m',
                    created_at
                ) AS month,

                COUNT(*) AS count

            FROM screenings

            GROUP BY month

            ORDER BY month ASC

            LIMIT 12
            """
        ).fetchall()

        monthly_activity = [
            {
                "month": row["month"],
                "count": row["count"]
            }
            for row in monthly_rows
        ]

        diagnosis_rows = conn.execute(
            """
            SELECT
                diagnosis,
                COUNT(*) AS count
            FROM screenings
            WHERE diagnosis IS NOT NULL
            GROUP BY diagnosis
            ORDER BY count DESC
            """
        ).fetchall()

        diagnosis_distribution = [
            {
                "diagnosis": row["diagnosis"],
                "count": row["count"]
            }
            for row in diagnosis_rows
        ]

        if total_screenings > 0:
            referable_percentage = (
                referable_cases
                / total_screenings
            ) * 100
        else:
            referable_percentage = 0

        conn.close()

        return jsonify({
            "success": True,

            "analytics": {
                "total_patients": total_patients,

                "total_screenings": total_screenings,

                "referable_cases": referable_cases,

                "non_referable_cases": non_referable_cases,

                "referable_percentage": round(
                    referable_percentage,
                    2
                ),

                "average_confidence": round(
                    average_confidence,
                    4
                ),

                "grade_distribution": grade_distribution,

                "monthly_activity": monthly_activity,

                "diagnosis_distribution": diagnosis_distribution
            }
        })

    except Exception as e:
        print("Analytics error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to load analytics data"
        }), 500


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    print("")
    print("========================================")
    print("        RETINAAI BACKEND SERVER")
    print("========================================")
    print("Server: http://127.0.0.1:5000")
    print("Database: SQLite")
    print("AI Model: EfficientNet-B0")
    print("Image Storage:", SCREENING_DIR)
    print("========================================")
    print("")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )