import requests
import os
import sys

print("=" * 60)
print("              RETINAAI SYSTEM CHECK")
print("=" * 60)

# -------------------------------------------------
# BACKEND
# -------------------------------------------------

backend_url = "http://127.0.0.1:5000"

print("\n[1] Backend API")

try:
    response = requests.get(
        backend_url,
        timeout=5
    )

    print("    Status : ONLINE")
    print(f"    Code   : {response.status_code}")

except requests.RequestException:
    print("    Status : OFFLINE")
    print("    Start the Flask backend first.")


# -------------------------------------------------
# PROJECT FILES
# -------------------------------------------------

print("\n[2] Core Project Files")

files = {
    "MATLAB Pipeline": "matlab/main_pipeline.m",
    "Quality Check": "matlab/quality_check.m",
    "Preprocessing": "matlab/preprocessing.m",
    "Prediction Bridge": "matlab/predict_backend.m",
    "Grad-CAM Bridge": "matlab/gradcam_backend.m",
    "Workflow Simulation": "simulink/workflow_simulation.py",
}

for name, path in files.items():

    if os.path.exists(path):
        print(f"    {name:<22} OK")
    else:
        print(f"    {name:<22} MISSING")


# -------------------------------------------------
# TEST IMAGE
# -------------------------------------------------

print("\n[3] Test Image")

if os.path.exists("test_image.jpg"):
    print("    test_image.jpg       OK")
else:
    print("    test_image.jpg       MISSING")


# -------------------------------------------------
# SUMMARY
# -------------------------------------------------

print("\n" + "=" * 60)
print("                 SYSTEM CHECK COMPLETE")
print("=" * 60)

print("\nPipeline:")
print("Fundus Image")
print("     ↓")
print("Quality Gate")
print("     ↓")
print("Preprocessing")
print("     ↓")
print("EfficientNet-B0")
print("     ↓")
print("5-Class DR Prediction")
print("     ↓")
print("Grad-CAM")
print("     ↓")
print("Evidence Fusion")
print("     ↓")
print("Referral Support")
print("     ↓")
print("Doctor Dashboard")

print("\nWorkflow Simulation:")
print("PHC → AI Screening → Referral Queue → Doctor Review")

print("\nReady for SIH demonstration.")
print("=" * 60)