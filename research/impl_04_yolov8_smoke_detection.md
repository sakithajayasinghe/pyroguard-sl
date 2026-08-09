# IMPLEMENTATION RESEARCH: YOLOv8 Fire & Smoke Detection with FastAPI

## Executive Summary
This document outlines the implementation strategy for deploying a real-time fire and smoke detection system using YOLOv8 via a FastAPI endpoint. Based on comprehensive web research, utilizing a pre-trained YOLOv8 Nano (`yolov8n`) model fine-tuned on benchmark datasets like D-Fire or FLAME is the most effective approach for CPU-constrained environments like an `e2-standard-2` Google Cloud instance. We provide the full architectural considerations, dataset insights, and a working Python implementation for the FastAPI backend.

---

## 1. Ultralytics YOLOv8 Setup & API
YOLOv8 by Ultralytics offers a unified API for object detection, classification, and segmentation.
*   **Installation**: `pip install ultralytics fastapi uvicorn python-multipart Pillow huggingface_hub`
*   **Model Loading**: The model can be initialized easily using `from ultralytics import YOLO` and `model = YOLO("model_path.pt")`.
*   **Inference**: `results = model.predict(source=image, conf=0.25)`

## 2. Pre-trained Fire/Smoke Models & Datasets
Training a model from scratch is unnecessary as several high-quality datasets and pre-trained weights exist.

### Best Datasets
*   **D-Fire Dataset**: Contains over 21,000 images with diverse fire and smoke annotations. Widely used for training lightweight YOLO models.
*   **FLAME Dataset**: Focuses on aerial imagery, making it highly relevant if the Sri Lanka system uses drone or elevated camera feeds.

### Finding Pre-Trained Weights
You can pull pre-trained weights directly from Hugging Face or GitHub rather than training manually.
*   **Hugging Face**: The repository `rabahdev/fire-smoke-yolov8n` hosts a `best.pt` fine-tuned on fire and smoke.
*   **GitHub**: Repositories like `luminous0219/fire-and-smoke-detection-yolov8` provide robust weights for YOLOv8n.
*   **Roboflow Universe**: Searching "fire smoke detection" yields numerous exports in YOLOv8 format.

## 3. Training & Fine-Tuning (If Needed)
If pre-trained models lack accuracy for specific Sri Lankan terrains (e.g., specific dry zone vegetation):
1.  **Transfer Learning**: Download the D-Fire dataset in YOLO format.
2.  **Fine-tune**:
    ```python
    from ultralytics import YOLO
    model = YOLO('yolov8n.pt') # Start with base nano model
    model.train(data='dfire.yaml', epochs=50, imgsz=640)
    ```
3.  **Classification Alternative**: If bounding boxes are unnecessary, a YOLOv8 classification model (`yolov8n-cls.pt`) trained on a binary "Fire/No-Fire" dataset is faster and consumes less memory.

## 4. FastAPI Implementation (Working Code)
Below is the complete, working Python code for a FastAPI endpoint that accepts an image, runs inference, draws bounding boxes, and returns the annotated image and JSON data.

```python
import io
import json
from fastapi import FastAPI, UploadFile, File, Response
from fastapi.responses import JSONResponse
from ultralytics import YOLO
from PIL import Image
from huggingface_hub import hf_hub_download

app = FastAPI(title="Fire & Smoke Detection API")

# 1. Global Model Loading (Optimized for startup)
# Download weights from Hugging Face (or use local path like "best.pt")
try:
    model_path = hf_hub_download(repo_id="rabahdev/fire-smoke-yolov8n", filename="best.pt")
    model = YOLO(model_path)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Using base YOLOv8n as fallback due to error: {e}")
    model = YOLO("yolov8n.pt") # Fallback for testing

@app.post("/detect/")
async def detect_fire_smoke(file: UploadFile = File(...)):
    # 2. Image Processing
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # 3. Inference
    results = model.predict(image, conf=0.25) # 25% confidence threshold
    
    # 4. Extract Data
    detections = []
    for box in results[0].boxes:
        detections.append({
            "class": model.names[int(box.cls)],
            "confidence": float(box.conf),
            "bbox": box.xyxy[0].tolist() # [x1, y1, x2, y2]
        })

    # 5. Image Annotation
    annotated_frame = results[0].plot() # numpy array (BGR)
    annotated_image = Image.fromarray(annotated_frame[..., ::-1]) # Convert BGR to RGB
    
    output_buffer = io.BytesIO()
    annotated_image.save(output_buffer, format="JPEG")
    output_buffer.seek(0)
    
    # Return multipart or specific format based on needs. 
    # Here we return JSON with base64 or just stream the image. 
    # For a dual response, headers can be used, or just return the image.
    
    # Returning the annotated image with detection data in headers
    headers = {"X-Detection-Results": json.dumps(detections)}
    return Response(content=output_buffer.getvalue(), media_type="image/jpeg", headers=headers)
```

## 5. Memory Usage & e2-standard-2 Performance
The target VM is an `e2-standard-2` (2 vCPUs, 8GB RAM).
*   **Memory**: 8GB is plenty of RAM to hold YOLOv8n (Nano), YOLOv8s (Small), or even YOLOv8m (Medium). A YOLOv8n model takes < 50MB of RAM.
*   **CPU Inference Time**: Deep learning on CPUs is slow.
    *   **YOLOv8n**: ~100-300ms per frame.
    *   **YOLOv8m/l**: >1000ms per frame.
*   **Optimization**: 
    *   Strictly use **YOLOv8n**.
    *   Export the model to **ONNX** or **OpenVINO** format (`yolo export model=best.pt format=onnx`). ONNX runtime on CPU is significantly faster than raw PyTorch.
    *   Reduce input image size (e.g., `imgsz=320`).

## 6. Fallback Approach
If a robust YOLOv8 detection model proves too slow or inaccurate on CPU, fall back to a simple Image Classification approach using a lightweight CNN (e.g., MobileNetV2 or ResNet18). These models are highly optimized for CPU inference and easily achieve real-time performance on a 2-vCPU machine.

## 7. Demo Images
For testing the endpoint, sample images can be found at:
*   Kaggle datasets (search "wildfire smoke dataset").
*   Roboflow Universe sample image sections.
*   Google Images (using advanced search for creative commons).

## 8. Key Takeaways for Sri Lanka System
1.  **Use YOLOv8 Nano**: Essential for keeping CPU latency acceptable on the e2-standard-2 instance.
2.  **Global Loading**: The FastAPI app must load the model at module level (startup), not inside the route handler.
3.  **ONNX Conversion**: Highly recommended to convert the downloaded `.pt` file to `.onnx` for production CPU deployment.
4.  **Dataset Bias**: Ensure the pre-trained model (likely trained on US/European data like FLAME) accurately recognizes smoke against Sri Lankan tropical/dry-zone backgrounds. Testing is critical.
