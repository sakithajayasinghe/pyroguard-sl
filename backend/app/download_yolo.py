from huggingface_hub import hf_hub_download
import shutil
import os

print("Downloading YOLOv8 fire/smoke weights...")
try:
    path = hf_hub_download(repo_id="rabahdev/fire-smoke-yolov8n", filename="best.pt")
    os.makedirs("backend/app/models", exist_ok=True)
    shutil.copy(path, "backend/app/models/yolov8_fire.pt")
    print("Downloaded successfully to backend/app/models/yolov8_fire.pt")
except Exception as e:
    print(f"Error: {e}")
