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
import tempfile
import gc

from backend.model import model, device, model_loaded

from backend.database import init_database, get_connection
from backend.auth import hash_password, verify_password, create_admin


# =========================================================
# APP CONFIG
# =========================================================

app = Flask(__name__)
CORS(app)

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
# FUNDUS IMAGE VALIDATION
# =========================================================

def validate_fundus_image(image):

    """
    STRICT FUNDUS IMAGE VALIDATION

    This validation happens BEFORE EfficientNet inference.

    Flow:

        uploaded image
              |
              v
        image validation
              |
        +-----+------+
        |            |
      FAIL          PASS
        |            |
        v            v
      422       EfficientNet
                   |
                   v
                Grade

    This is a defensive fundus-likeness gate.
    It is NOT a medical-grade fundus classifier.
    """

    try:

        # =================================================
        # BASIC IMAGE CHECK
        # =================================================

        if image is None:

            return {
                "valid": False,
                "confidence": 0.0,
                "message":
                    "No image was provided. "
                    "Please upload a retinal fundus image."
            }

        image = image.convert("RGB")

        width, height = image.size

        # =================================================
        # MINIMUM RESOLUTION
        # =================================================

        if width < 224 or height < 224:

            return {
                "valid": False,
                "confidence": 0.0,
                "message":
                    "Image resolution is too low. "
                    "Please upload a clear retinal fundus image."
            }

        # =================================================
        # ASPECT RATIO
        # =================================================

        aspect_ratio = (
            max(width, height)
            /
            min(width, height)
        )

        if aspect_ratio > 1.40:

            return {
                "valid": False,
                "confidence": 0.0,
                "message":
                    "Invalid image shape. "
                    "Please upload a correct retinal fundus image."
            }

        # =================================================
        # ANALYSIS IMAGE
        # =================================================

        analysis_image = image.copy()

        analysis_image.thumbnail(
            (512, 512)
        )

        arr = np.asarray(
            analysis_image,
            dtype=np.float32
        )

        if (
            arr.ndim != 3
            or arr.shape[2] != 3
        ):

            return {
                "valid": False,
                "confidence": 0.0,
                "message":
                    "Unsupported image format. "
                    "Please upload a retinal fundus image."
            }

        red = arr[:, :, 0]
        green = arr[:, :, 1]
        blue = arr[:, :, 2]

        gray = (
            0.299 * red
            +
            0.587 * green
            +
            0.114 * blue
        )

        h, w = gray.shape

        # =================================================
        # GLOBAL IMAGE QUALITY
        # =================================================

        mean_brightness = float(
            gray.mean()
        )

        brightness_std = float(
            gray.std()
        )

        if brightness_std < 10:

            return {
                "valid": False,
                "confidence": 0.0,
                "message":
                    "The uploaded image appears blank "
                    "or lacks sufficient visual detail."
            }

        if mean_brightness < 18:

            return {
                "valid": False,
                "confidence": 0.0,
                "message":
                    "Image is too dark. "
                    "Please upload a properly illuminated "
                    "retinal fundus image."
            }

        if mean_brightness > 248:

            return {
                "valid": False,
                "confidence": 0.0,
                "message":
                    "Image is overexposed. "
                    "Please upload a clear retinal fundus image."
            }

        # =================================================
        # CENTER OF IMAGE
        # =================================================

        center_x = w / 2.0
        center_y = h / 2.0

        yy, xx = np.ogrid[:h, :w]

        distance = np.sqrt(
            (xx - center_x) ** 2
            +
            (yy - center_y) ** 2
        )

        min_dim = min(h, w)

        # Main retinal field
        main_radius = min_dim * 0.42

        # Outer ring
        outer_radius = min_dim * 0.50

        # Central retinal region
        center_radius = min_dim * 0.28

        main_mask = (
            distance <= main_radius
        )

        outer_ring_mask = (
            (distance > main_radius)
            &
            (distance <= outer_radius)
        )

        center_mask = (
            distance <= center_radius
        )

        # =================================================
        # MASK VALIDATION
        # =================================================

        if (
            np.sum(main_mask) < 100
            or
            np.sum(outer_ring_mask) < 50
            or
            np.sum(center_mask) < 50
        ):

            return {
                "valid": False,
                "confidence": 0.0,
                "message":
                    "Unable to identify a retinal field."
            }

        # =================================================
        # FUNDUS FIELD BRIGHTNESS
        # =================================================

        main_gray = gray[main_mask]

        outer_gray = gray[outer_ring_mask]

        center_gray = gray[center_mask]

        main_mean = float(
            main_gray.mean()
        )

        outer_mean = float(
            outer_gray.mean()
        )

        center_mean = float(
            center_gray.mean()
        )

        circular_contrast = (
            main_mean
            -
            outer_mean
        )

        # =================================================
        # DARK OUTER BORDER
        # =================================================

        # A typical fundus photograph commonly has
        # dark pixels/background surrounding the retinal field.

        dark_outer_ratio = float(
            np.mean(
                outer_gray < 90
            )
        )

        # =================================================
        # DARK CORNERS
        # =================================================

        corner_h = max(
            1,
            int(h * 0.16)
        )

        corner_w = max(
            1,
            int(w * 0.16)
        )

        corners = np.concatenate([
            gray[
                :corner_h,
                :corner_w
            ].ravel(),

            gray[
                :corner_h,
                -corner_w:
            ].ravel(),

            gray[
                -corner_h:,
                :corner_w
            ].ravel(),

            gray[
                -corner_h:,
                -corner_w:
            ].ravel()
        ])

        corner_mean = float(
            corners.mean()
        )

        # =================================================
        # BRIGHT RETINAL FIELD OCCUPANCY
        # =================================================

        bright_inside_ratio = float(
            np.mean(
                main_gray > 45
            )
        )

        # =================================================
        # RED / GREEN / BLUE CHARACTERISTICS
        # =================================================

        red_mean = float(
            main_gray.mean()
        )

        green_mean = float(
            green[main_mask].mean()
        )

        blue_mean = float(
            blue[main_mask].mean()
        )

        # Fundus images normally have a red/orange retinal
        # appearance rather than arbitrary RGB distribution.

        warm_ratio = (
            red_mean + 1.0
        ) / (
            green_mean
            +
            blue_mean
            +
            2.0
        )

        # =================================================
        # RED DOMINANCE
        # =================================================

        red_green_difference = (
            red_mean
            -
            green_mean
        )

        red_blue_difference = (
            red_mean
            -
            blue_mean
        )

        # =================================================
        # CENTRAL WARMTH
        # =================================================

        center_red = float(
            red[center_mask].mean()
        )

        center_green = float(
            green[center_mask].mean()
        )

        center_blue = float(
            blue[center_mask].mean()
        )

        center_warm_ratio = (
            center_red + 1.0
        ) / (
            center_green
            +
            center_blue
            +
            2.0
        )

        # =================================================
        # GREEN CHANNEL STRUCTURE
        # =================================================

        green_inside = green[main_mask]

        green_std = float(
            green_inside.std()
        )

        # =================================================
        # COLOR VARIATION
        # =================================================

        channel_range = (
            np.max(
                arr,
                axis=2
            )
            -
            np.min(
                arr,
                axis=2
            )
        )

        mean_color_range = float(
            channel_range[main_mask].mean()
        )

        # =================================================
        # LOCAL CONTRAST
        # =================================================

        center_std = float(
            center_gray.std()
        )

        field_std = float(
            main_gray.std()
        )

        # =================================================
        # SATURATION-LIKE COLOR CHECK
        # =================================================

        max_channel = np.max(
            arr,
            axis=2
        )

        min_channel = np.min(
            arr,
            axis=2
        )

        saturation_like = (
            max_channel
            -
            min_channel
        )

        saturation_inside = float(
            saturation_like[main_mask].mean()
        )

        # =================================================
        # FUNDUS FEATURES
        # =================================================

        checks = {

            # 1. Retinal field must be brighter than
            # surrounding region.
            "circular_field":
                circular_contrast >= 18,

            # 2. Outer area should contain a reasonable
            # amount of dark background.
            "dark_outer_border":
                dark_outer_ratio >= 0.12,

            # 3. Corners should generally not look like
            # a completely illuminated rectangular photo.
            "dark_corners":
                corner_mean <= 165,

            # 4. Main field should contain actual visual
            # information.
            "retinal_occupancy":
                bright_inside_ratio >= 0.55,

            # 5. Fundus images normally have warm/red
            # characteristics.
            "warm_color":
                warm_ratio >= 0.78,

            # 6. Red should generally be stronger than
            # green in the retinal field.
            "red_green":
                red_green_difference >= 5,

            # 7. Red should generally be stronger than blue.
            "red_blue":
                red_blue_difference >= 15,

            # 8. Central retinal area should also have
            # warm characteristics.
            "central_warmth":
                center_warm_ratio >= 0.68,

            # 9. Green channel should have texture/detail.
            "green_structure":
                green_std >= 15,

            # 10. There should be meaningful color variation.
            "color_variation":
                mean_color_range >= 15,

            # 11. Center must contain visual structure.
            "center_detail":
                center_std >= 12,

            # 12. Whole retinal field needs sufficient
            # color information.
            "color_information":
                saturation_inside >= 15,

            # 13. Retinal field should not be almost uniform.
            "field_texture":
                field_std >= 18,

            # 14. Center should not be completely dark.
            "center_brightness":
                center_mean >= 40
        }

        # =================================================
        # SCORE
        # =================================================

        score = sum(
            1
            for value in checks.values()
            if value
        )

        total_checks = len(checks)

        # =================================================
        # PRINT DEBUG INFORMATION
        # =================================================

        print("")
        print("========================================")
        print("       STRICT FUNDUS VALIDATION")
        print("========================================")
        print(
            "Image size:",
            width,
            "x",
            height
        )
        print(
            "Aspect ratio:",
            round(
                aspect_ratio,
                3
            )
        )
        print(
            "Score:",
            score,
            "/",
            total_checks
        )
        print(
            "Main mean:",
            round(
                main_mean,
                2
            )
        )
        print(
            "Outer mean:",
            round(
                outer_mean,
                2
            )
        )
        print(
            "Circular contrast:",
            round(
                circular_contrast,
                2
            )
        )
        print(
            "Dark outer ratio:",
            round(
                dark_outer_ratio,
                3
            )
        )
        print(
            "Corner mean:",
            round(
                corner_mean,
                2
            )
        )
        print(
            "Bright inside:",
            round(
                bright_inside_ratio,
                3
            )
        )
        print(
            "Warm ratio:",
            round(
                warm_ratio,
                3
            )
        )
        print(
            "Red-Green:",
            round(
                red_green_difference,
                2
            )
        )
        print(
            "Red-Blue:",
            round(
                red_blue_difference,
                2
            )
        )
        print(
            "Center warm:",
            round(
                center_warm_ratio,
                3
            )
        )
        print(
            "Green std:",
            round(
                green_std,
                2
            )
        )
        print(
            "Color range:",
            round(
                mean_color_range,
                2
            )
        )
        print(
            "Center std:",
            round(
                center_std,
                2
            )
        )
        print(
            "Field std:",
            round(
                field_std,
                2
            )
        )
        print(
            "Color information:",
            round(
                saturation_inside,
                2
            )
        )

        print("----------------------------------------")

        for name, passed in checks.items():

            print(
                ("PASS " if passed else "FAIL "),
                name
            )

        print("========================================")

        # =================================================
        # HARD FINAL GATE
        # =================================================

        # Require most characteristics to pass.
        #
        # IMPORTANT:
        # circular_field + warm_color + red_green +
        # central_warmth + color_variation are mandatory.

        mandatory_checks = [

            "circular_field",
            "warm_color",
            "red_green",
            "central_warmth",
            "color_variation"
        ]

        mandatory_passed = all(
            checks[name]
            for name in mandatory_checks
        )

        # Need at least 11/14 total checks.
        strong_score = (
            score >= 11
        )

        if (
            not mandatory_passed
            or
            not strong_score
        ):

            print("")
            print(
                "❌ FUNDUS VALIDATION FAILED"
            )
            print(
                "❌ CLASSIFICATION BLOCKED"
            )
            print("========================================")
            print("")

            validation_confidence = min(
                score / float(total_checks),
                0.99
            )

            return {
                "valid": False,
                "confidence":
                    validation_confidence,
                "message":
                    "The uploaded image does not appear "
                    "to be a valid retinal fundus photograph. "
                    "Please upload a relevant fundus image."
            }

        # =================================================
        # VALID
        # =================================================

        validation_confidence = min(
            score / float(total_checks),
            0.99
        )

        print("")
        print(
            "✅ FUNDUS VALIDATION PASSED"
        )
        print(
            "Score:",
            score,
            "/",
            total_checks
        )
        print(
            "Confidence:",
            round(
                validation_confidence,
                3
            )
        )
        print(
            "➡️ Classification allowed"
        )
        print("========================================")
        print("")

        return {
            "valid": True,
            "confidence":
                validation_confidence,
            "message":
                "Fundus image validation passed."
        }

    except Exception as e:

        # FAIL CLOSED
        #
        # If validation itself crashes,
        # NEVER allow the image to reach the model.

        print("")
        print(
            "❌ FUNDUS VALIDATION ERROR"
        )
        print(
            repr(e)
        )
        print(
            "❌ CLASSIFICATION BLOCKED"
        )
        print("========================================")

        return {
            "valid": False,
            "confidence": 0.0,
            "message":
                "Unable to validate the uploaded image. "
                "Please upload a valid retinal fundus image."
        }


# =========================================================
# IMAGE PREPARATION
# =========================================================

def prepare_image(file):

    image = Image.open(
        file
    ).convert("RGB")

    image.load()

    if max(image.size) > 800:

        image.thumbnail(
            (800, 800)
        )

    tensor = transform(
        image
    ).unsqueeze(0)

    return (
        image,
        tensor.to(device)
    )


# =========================================================
# IMAGE TO BASE64
# =========================================================

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


# =========================================================
# SAVE IMAGE
# =========================================================

def save_image(
    image,
    folder,
    filename
):

    folder = Path(folder)

    folder.mkdir(
        parents=True,
        exist_ok=True
    )

    file_path = (
        folder
        /
        filename
    )

    image.save(
        file_path,
        format="JPEG",
        quality=95
    )

    return file_path


# =========================================================
# CREATE SCREENING FOLDER
# =========================================================

def create_screening_folder():

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    unique_id = uuid.uuid4().hex[:8]

    folder_name = (
        f"{timestamp}_{unique_id}"
    )

    folder = (
        SCREENING_DIR
        /
        folder_name
    )

    folder.mkdir(
        parents=True,
        exist_ok=True
    )

    return (
        folder,
        folder_name
    )


# =========================================================
# HOME
# =========================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({
        "status": "success",
        "message":
            "RetinaAI backend is running!"
    })


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/login",
    methods=["POST"]
)
def login():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message":
                "Invalid request"
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
            "message":
                "Email and password are required"
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
                "message":
                    "Invalid email or password"
            }), 401

        if not verify_password(
            password,
            user["password_hash"]
        ):

            return jsonify({
                "success": False,
                "message":
                    "Invalid email or password"
            }), 401

        return jsonify({

            "success": True,

            "message":
                "Login successful",

            "user": {

                "id":
                    user["id"],

                "name":
                    user["name"],

                "email":
                    user["email"],

                "role":
                    user["role"]
            }

        })

    except Exception as e:

        print(
            "Login error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                "Login failed"
        }), 500


# =========================================================
# SIGNUP
# =========================================================

@app.route(
    "/signup",
    methods=["POST"]
)
def signup():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message":
                "Invalid request"
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
            "message":
                "Name is required"
        }), 400

    if not email:

        return jsonify({
            "success": False,
            "message":
                "Email is required"
        }), 400

    if (
        "@"
        not in email
        or
        "."
        not in email
    ):

        return jsonify({
            "success": False,
            "message":
                "Please enter a valid email address"
        }), 400

    if len(password) < 6:

        return jsonify({
            "success": False,
            "message":
                "Password must be at least 6 characters"
        }), 400

    if password != confirm_password:

        return jsonify({
            "success": False,
            "message":
                "Passwords do not match"
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
                "message":
                    "An account with this email already exists"
            }), 409

        password_hash = hash_password(
            password
        )

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

            "message":
                "Account created successfully",

            "user": {

                "id":
                    user_id,

                "name":
                    name,

                "email":
                    email,

                "role":
                    "admin"
            }

        }), 201

    except Exception as e:

        print(
            "Signup error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to create account"
        }), 500


# =========================================================
# IMAGE ENHANCEMENT
# =========================================================

@app.route(
    "/enhance",
    methods=["POST"]
)
def enhance():

    if "image" not in request.files:

        return jsonify({
            "success": False,
            "message":
                "No image uploaded"
        }), 400

    try:

        file = request.files["image"]

        if not file or not file.filename:

            return jsonify({
                "success": False,
                "message":
                    "Empty or missing image file"
            }), 400

        try:

            image = Image.open(
                file
            ).convert("RGB")

            image.load()

        except Exception:

            return jsonify({
                "success": False,
                "validation_failed": True,
                "error_type":
                    "INVALID_IMAGE",
                "message":
                    "Invalid or corrupted image file."
            }), 422

        # =================================================
        # FUNDUS VALIDATION
        # =================================================

        validation_result = (
            validate_fundus_image(
                image
            )
        )

        print(
            "Enhancement validation:",
            validation_result
        )

        if not validation_result["valid"]:

            return jsonify({
                "success": False,
                "validation_failed": True,
                "error_type":
                    "INVALID_RETINAL_IMAGE",
                "message":
                    "Please upload a relevant retinal "
                    "fundus image for screening."
            }), 422

        # =================================================
        # ENHANCE
        # =================================================

        if max(image.size) > 800:

            image.thumbnail(
                (800, 800)
            )

        enhanced = (
            ImageEnhance.Contrast(
                image
            ).enhance(1.25)
        )

        enhanced = (
            ImageEnhance.Sharpness(
                enhanced
            ).enhance(1.2)
        )

        return jsonify({

            "success": True,

            "validation_failed": False,

            "image":
                image_to_base64(
                    enhanced
                )
        })

    except Exception as e:

        print(
            "Enhancement error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to process image."
        }), 500


# =========================================================
# PREDICTION
# =========================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    if "image" not in request.files:

        return jsonify({
            "success": False,
            "message":
                "No image uploaded"
        }), 400

    try:

        file = request.files["image"]

        if not file or not file.filename:

            return jsonify({
                "success": False,
                "message":
                    "Empty or missing image file"
            }), 400

        # =================================================
        # OPEN IMAGE
        # =================================================

        try:

            validation_image = (
                Image.open(
                    file
                ).convert("RGB")
            )

            validation_image.load()

        except Exception as e:

            print(
                "Image decoding failed:",
                repr(e)
            )

            return jsonify({
                "success": False,
                "validation_failed": True,
                "error_type":
                    "INVALID_IMAGE",
                "message":
                    "Invalid or corrupted image file. "
                    "Please upload a retinal fundus image."
            }), 422

        # =================================================
        # FUNDUS VALIDATION
        # =================================================

        validation_result = (
            validate_fundus_image(
                validation_image
            )
        )

        print("")
        print("========================================")
        print("        FUNDUS VALIDATION")
        print("========================================")
        print(
            "Valid:",
            validation_result["valid"]
        )
        print(
            "Confidence:",
            validation_result["confidence"]
        )
        print(
            "Message:",
            validation_result["message"]
        )
        print("========================================")
        print("")

        # =================================================
        # HARD BLOCK
        # =================================================

        if not validation_result["valid"]:

            print(
                "❌ CLASSIFICATION BLOCKED"
            )

            return jsonify({
                "success": False,
                "validation_failed": True,
                "error_type":
                    "INVALID_RETINAL_IMAGE",
                "message":
                    "Please upload a relevant retinal "
                    "fundus image for screening."
            }), 422

        # =================================================
        # MODEL CHECK
        # =================================================

        if not model_loaded:

            return jsonify({
                "success": False,
                "message":
                    "AI model is not loaded."
            }), 503

        # =================================================
        # RESET FILE
        # =================================================

        file.seek(0)

        # =================================================
        # PREPARE IMAGE
        # =================================================

        image, tensor = (
            prepare_image(
                file
            )
        )

        # =================================================
        # MODEL PREDICTION
        # =================================================

        print(
            "🚀 Valid fundus image -> "
            "EfficientNet-B0"
        )

        model.eval()

        with torch.no_grad():

            output = model(
                tensor
            )

            probabilities = (
                F.softmax(
                    output,
                    dim=1
                )[0]
            )

        # =================================================
        # PREDICTED CLASS
        # =================================================

        predicted_class = int(
            torch.argmax(
                probabilities
            ).item()
        )

        confidence = float(
            probabilities[
                predicted_class
            ].item()
        )

        referable_probability = float(
            probabilities[2:].sum().item()
        )

        referable = (
            referable_probability >= 0.50
        )

        # =================================================
        # DIAGNOSIS
        # =================================================

        diagnoses = {

            0:
                "No Diabetic Retinopathy",

            1:
                "Mild Diabetic Retinopathy",

            2:
                "Moderate Diabetic Retinopathy",

            3:
                "Severe Diabetic Retinopathy",

            4:
                "Proliferative Diabetic Retinopathy"
        }

        diagnosis = diagnoses.get(
            predicted_class,
            "Unknown"
        )

        # =================================================
        # RESPONSE
        # =================================================

        return jsonify({

            "success": True,

            "validation_failed": False,

            "grade":
                predicted_class,

            "diagnosis":
                diagnosis,

            "confidence":
                confidence,

            "referable_probability":
                referable_probability,

            "referable":
                referable,

            "probabilities": [

                float(
                    x.item()
                )

                for x in probabilities

            ]

        })

    except Exception as e:

        print(
            "Prediction error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                "Prediction failed. Please try again."
        }), 500


# =========================================================
# GRAD-CAM + IMAGE PERSISTENCE
# =========================================================

@app.route(
    "/gradcam",
    methods=["POST"]
)
def gradcam():

    if "image" not in request.files:

        return jsonify({
            "success": False,
            "message":
                "No image uploaded"
        }), 400

    try:

        file = request.files["image"]

        if not file or not file.filename:

            return jsonify({
                "success": False,
                "message":
                    "Empty or missing image file"
            }), 400

        patient_id = request.form.get(
            "patient_id",
            ""
        ).strip()

        # =================================================
        # OPEN IMAGE
        # =================================================

        try:

            image = (
                Image.open(
                    file
                ).convert("RGB")
            )

            image.load()

        except Exception:

            return jsonify({
                "success": False,
                "validation_failed": True,
                "error_type":
                    "INVALID_IMAGE",
                "message":
                    "Invalid or corrupted image file."
            }), 422

        # =================================================
        # FUNDUS VALIDATION
        # =================================================

        validation_result = (
            validate_fundus_image(
                image
            )
        )

        print(
            "Grad-CAM validation:",
            validation_result
        )

        # =================================================
        # HARD BLOCK
        # =================================================

        if not validation_result["valid"]:

            print(
                "❌ GRAD-CAM BLOCKED"
            )

            return jsonify({
                "success": False,
                "validation_failed": True,
                "error_type":
                    "INVALID_RETINAL_IMAGE",
                "message":
                    "Please upload a relevant retinal "
                    "fundus image for screening."
            }), 422

        # =================================================
        # MODEL CHECK
        # =================================================

        if not model_loaded:

            return jsonify({
                "success": False,
                "message":
                    "AI model is not loaded."
            }), 503

        # =================================================
        # RESIZE
        # =================================================

        if max(image.size) > 800:

            image.thumbnail(
                (800, 800)
            )

        tensor = transform(
            image
        ).unsqueeze(0)

        tensor = tensor.to(
            device
        )

        # =================================================
        # GRAD-CAM STORAGE
        # =================================================

        activations = []
        gradients = []

        target_layer = (
            model.features[-1]
        )

        def forward_hook(
            module,
            input,
            output
        ):

            activations.append(
                output
            )

        def backward_hook(
            module,
            grad_input,
            grad_output
        ):

            gradients.append(
                grad_output[0]
            )

        forward_handle = (
            target_layer.register_forward_hook(
                forward_hook
            )
        )

        backward_handle = (
            target_layer.register_full_backward_hook(
                backward_hook
            )
        )

        try:

            model.zero_grad()

            with torch.enable_grad():

                output = model(
                    tensor
                )

                predicted_class = (
                    output.argmax(
                        dim=1
                    ).item()
                )

                score = output[
                    0,
                    predicted_class
                ]

                score.backward()

        finally:

            forward_handle.remove()
            backward_handle.remove()

        # =================================================
        # GRAD-CAM CALCULATION
        # =================================================

        if (
            len(activations) == 0
            or
            len(gradients) == 0
        ):

            raise RuntimeError(
                "Unable to generate Grad-CAM."
            )

        activation = (
            activations[0]
        )

        gradient = (
            gradients[0]
        )

        weights = (
            gradient.mean(
                dim=(2, 3),
                keepdim=True
            )
        )

        cam = (
            weights
            *
            activation
        ).sum(
            dim=1
        )

        cam = F.relu(
            cam
        )

        cam = (
            cam.squeeze()
            .detach()
            .cpu()
        )

        cam -= cam.min()

        if cam.max() > 0:

            cam /= cam.max()

        cam = cam.numpy()

        cam_image = (
            Image.fromarray(
                np.uint8(
                    cam * 255
                )
            )
        )

        cam_image = (
            cam_image.resize(
                image.size
            )
        )

        cam_array = np.array(
            cam_image
        )

        original_array = np.array(
            image,
            dtype=np.float32
        )

        heatmap = np.zeros_like(
            original_array,
            dtype=np.float32
        )

        heatmap[:, :, 0] = (
            cam_array
        )

        heatmap[:, :, 1] = (
            cam_array // 3
        )

        overlay = (
            0.55
            *
            original_array
            +
            0.45
            *
            heatmap
        )

        overlay = np.uint8(
            np.clip(
                overlay,
                0,
                255
            )
        )

        overlay_image = (
            Image.fromarray(
                overlay
            )
        )

        # =================================================
        # FREE MEMORY
        # =================================================

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
            overlay,
            tensor
        )

        gc.collect()

        # =================================================
        # CREATE SCREENING STORAGE
        # =================================================

        screening_folder, folder_name = (
            create_screening_folder()
        )

        # =================================================
        # SAVE ORIGINAL
        # =================================================

        original_filename = (
            "original.jpg"
        )

        save_image(
            image,
            screening_folder,
            original_filename
        )

        # =================================================
        # SAVE GRAD-CAM
        # =================================================

        gradcam_filename = (
            "gradcam.jpg"
        )

        save_image(
            overlay_image,
            screening_folder,
            gradcam_filename
        )

        # =================================================
        # DATABASE PATHS
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

            "original_image":
                image_to_base64(
                    image
                ),

            "gradcam_image":
                image_to_base64(
                    overlay_image
                ),

            "image":
                image_to_base64(
                    overlay_image
                ),

            "predicted_class":
                predicted_class,

            "image_path":
                image_relative_path,

            "gradcam_path":
                gradcam_relative_path,

            "patient_id":
                patient_id

        })

    except Exception as e:

        print(
            "Grad-CAM error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to generate Grad-CAM."
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

@app.route(
    "/patients",
    methods=["POST"]
)
def create_patient():

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message":
                "Request body is required"
        }), 400

    name = data.get(
        "name",
        ""
    ).strip()

    age = data.get(
        "age"
    )

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
            "message":
                "Patient name is required"
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
                    last_patient[
                        "patient_id"
                    ].replace(
                        "PAT-",
                        ""
                    )
                )

                new_number = (
                    last_number + 1
                )

            except Exception:

                new_number = 1

        else:

            new_number = 1

        patient_id = (
            f"PAT-{new_number:04d}"
        )

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

            "message":
                "Patient created successfully",

            "patient":
                dict(patient)

        }), 201

    except Exception as e:

        print(
            "Create patient error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                str(e)
        }), 500


# =========================================================
# GET ALL PATIENTS
# =========================================================

@app.route(
    "/patients",
    methods=["GET"]
)
def get_patients():

    try:

        conn = get_connection()

        patients = conn.execute(
            """
            SELECT
                p.*,
                COUNT(s.id)
                    AS total_scans
            FROM patients p
            LEFT JOIN screenings s
                ON p.patient_id =
                   s.patient_id
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

        print(
            "Get patients error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                str(e)
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
                "message":
                    "Patient not found"
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

            "patient":
                dict(patient),

            "screenings": [

                dict(screening)

                for screening in screenings

            ]

        })

    except Exception as e:

        print(
            "Get patient error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                str(e)
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
            "message":
                "Request body is required"
        }), 400

    patient_id = data.get(
        "patient_id"
    )

    if not patient_id:

        return jsonify({
            "success": False,
            "message":
                "patient_id is required"
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
                "message":
                    "Patient not found"
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
                data.get(
                    "image_path"
                ),
                data.get(
                    "grade"
                ),
                data.get(
                    "diagnosis"
                ),
                data.get(
                    "confidence"
                ),
                data.get(
                    "referable_probability"
                ),
                data.get(
                    "referable",
                    0
                ),
                data.get(
                    "gradcam_path"
                )
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

            "message":
                "Screening saved successfully",

            "screening":
                dict(screening)

        }), 201

    except Exception as e:

        print(
            "Create screening error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                str(e)
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

        print(
            "Get screenings error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                str(e)
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
                    WHERE patient_id =
                          p.patient_id
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

                "total_patients":
                    total_patients,

                "total_screenings":
                    total_scans,

                "total_referrals":
                    total_referrals

            },

            "recent_patients": [

                dict(patient)

                for patient in recent_patients

            ]

        })

    except Exception as e:

        print(
            "Dashboard stats error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                str(e)
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
                "message":
                    "Screening not found"
            }), 404

        return jsonify({

            "success": True,

            "screening":
                dict(screening)

        })

    except Exception as e:

        print(
            "Get screening error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to load screening"
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
                ON s.patient_id =
                   p.patient_id
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

        print(
            "Get all screenings error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to load screening reports"
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
            -
            referable_cases
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
                "month":
                    row["month"],

                "count":
                    row["count"]

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
                "diagnosis":
                    row["diagnosis"],

                "count":
                    row["count"]

            }

            for row in diagnosis_rows

        ]

        if total_screenings > 0:

            referable_percentage = (
                referable_cases
                /
                total_screenings
            ) * 100

        else:

            referable_percentage = 0

        conn.close()

        return jsonify({

            "success": True,

            "analytics": {

                "total_patients":
                    total_patients,

                "total_screenings":
                    total_screenings,

                "referable_cases":
                    referable_cases,

                "non_referable_cases":
                    non_referable_cases,

                "referable_percentage":
                    round(
                        referable_percentage,
                        2
                    ),

                "average_confidence":
                    round(
                        average_confidence,
                        4
                    ),

                "grade_distribution":
                    grade_distribution,

                "monthly_activity":
                    monthly_activity,

                "diagnosis_distribution":
                    diagnosis_distribution

            }

        })

    except Exception as e:

        print(
            "Analytics error:",
            repr(e)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to load analytics data"
        }), 500


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    print("")
    print("========================================")
    print("        RETINAAI BACKEND SERVER")
    print("========================================")
    print(
        "Server: http://127.0.0.1:5000"
    )
    print("Database: SQLite")
    print("AI Model: EfficientNet-B0")
    print(
        "Image Storage:",
        SCREENING_DIR
    )
    print("========================================")
    print("")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )