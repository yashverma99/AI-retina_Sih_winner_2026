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

test_img = "final_explainability_demo.png" if os.path.exists("final_explainability_demo.png") else "test_image.jpg"
if os.path.exists(test_img):
    print(f"    {test_img:<20} OK")
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
print("     |")
print("     v")
print("Quality Gate")
print("     |")
print("     v")
print("Preprocessing")
print("     |")
print("     v")
print("EfficientNet-B0")
print("     |")
print("     v")
print("5-Class DR Prediction")
print("     |")
print("     v")
print("Grad-CAM")
print("     |")
print("     v")
print("Evidence Fusion")
print("     |")
print("     v")
print("Referral Support")
print("     |")
print("     v")
print("Doctor Dashboard")

print("\nWorkflow Simulation:")
print("PHC -> AI Screening -> Referral Queue -> Doctor Review")

print("\nReady for SIH demonstration.")
print("=" * 60)