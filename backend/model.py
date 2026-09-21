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

model = model.to(device)
model.eval()

print("RetinaAI model loaded successfully!")
