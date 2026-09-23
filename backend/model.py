import torch
import torch.nn as nn
from pathlib import Path
from torchvision.models import efficientnet_b0

MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "model"
    / "efficientnet_b0_aptos_final_best.pth"
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Device:", device)

# Same architecture as Kaggle
model = efficientnet_b0(weights=None)

# Same 5-class output
model.classifier[1] = nn.Linear(
    model.classifier[1].in_features,
    5
)

model_loaded = False

if MODEL_PATH.exists():
    try:
        # Load checkpoint
        checkpoint = torch.load(
            MODEL_PATH,
            map_location=device,
            weights_only=False
        )
        print("Checkpoint loaded!")

        # Load trained weights
        model.load_state_dict(
            checkpoint["model_state_dict"]
        )
        model_loaded = True
        print("RetinaAI model loaded successfully!")
    except Exception as e:
        print(f"Warning: Failed to load model checkpoint ({e}). Operating with initialized weights.")
else:
    print(f"Warning: Model checkpoint not found at {MODEL_PATH}. Operating with initialized weights.")

model = model.to(device)
model.eval()
