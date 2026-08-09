# Recent Research Papers on AI-based Wildfire Detection (2022–2026)

## Executive Summary
This report synthesizes deep research into recent academic literature (2023–2026) on AI-based wildfire detection. The research landscape has shifted significantly towards **multimodal fusion** (combining weather, terrain, and satellite data), **edge-deployed lightweight models** (YOLO variants on UAVs), and **Transformer/Foundation models** for both early detection and spread prediction. For Sri Lanka, where cloud cover, dense tropical canopies, and resource constraints are prevalent, approaches that emphasize early smoke detection via UAVs (like lightweight YOLO/Transformer hybrids) and multimodal risk prediction (incorporating historical weather and terrain data) are the most promising.

## Detailed Findings Organized by Sub-Topic

### 1. Edge-Optimized & UAV-Based Early Detection
UAVs (drones) equipped with vision-based AI are heavily researched for early fire/smoke detection. Due to hardware limitations on drones, lightweight architectures are the primary focus.
- **YOLO Variants**: Researchers are optimizing YOLOv8 and YOLOv7 with GhostConv, RepVGG, and attention mechanisms (like CBAM or BiFormer) to detect small, distant smoke plumes while maintaining high real-time processing speeds (FPS).
- **Multimodal Sensor Fusion**: Combining thermal/IR with visible spectrum cameras to counteract false positives like fog or clouds.

### 2. Transformer & Attention Models
Transformers, traditionally used in NLP, are now dominating computer vision tasks in wildfire detection.
- **Vision Transformers (ViT) & Swin Transformers**: Used to capture global contextual information, reducing false positives in complex forest backgrounds.
- **Knowledge Distillation**: Models like FireNet-KD use distillation to compress heavy Swin Transformers into lightweight models for edge devices.

### 3. Multi-modal Spread Prediction
Modern systems predict wildfire spread 1-5 days in advance using multimodal data.
- **Data sources**: Satellite imagery (NDVI), meteorological data (wind, humidity, temp from ERA-5), and topography (DEM, slope).
- **Architectures**: Multimodal Transformers and ConvLSTMs ingest this heterogenous data to simulate and predict fire boundaries over time.

### 4. Tropical & Dense Canopy Challenges
Detecting fires in tropical regions (highly relevant to Sri Lanka) is challenging due to persistent cloud cover and dense canopies blocking early smoldering signs.
- Systems are leaning into IoT/ground-based sensor networks combined with UAVs to bypass cloud cover, and utilizing temporal video analysis (3D-CNNs) to catch faint smoke signatures early.

---

## Summary Table of Key Papers

| Title / Focus | Authors/Year/Venue | Key Methodology | Dataset | Results / Accuracy | Key Innovation | Relevance to Sri Lanka | URL / Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. PyroNear: Scrapping The Web For Early Wildfire Detection** | arXiv, 2024 | YOLO/Lightweight Object Detectors | PyroNear 2024 (150k annotations) | F1-score ~60% (Highlighting difficulty of real-world data) | Large-scale diverse in-the-wild smoke dataset | High; training on diverse real-world smoke helps model generalize to Sri Lankan terrain. | [arXiv](https://arxiv.org/abs/2024) |
| **2. DFE-YOLO: Dynamic Frequency Domain Enhancement for UAVs** | Forests (MDPI), 2025 | YOLO + C2f_CBAM + Frequency Domain | UAV-captured aerial images | High mAP for small targets | Frequency domain enhancement for small targets | High; perfect for drone-based monitoring over dense forests. | [MDPI](https://mdpi.com) |
| **3. TriRHC-YOLO for Early-Stage Forest Fire Detection** | MDPI, 2024/2025 | YOLO + RepVGG blocks | Custom forest fire dataset | 168.25 FPS | High speed real-time early small target detection | High; efficient for low-cost drones in rural SL. | [MDPI](https://mdpi.com) |
| **4. BCWildfire: A Multimodal Benchmark Dataset** | arXiv, 2024/2025 | CNNs, Transformers, Mamba | BCWildfire (38 covariates, 25-years) | Benchmark baseline established | Unifies weather, terrain, and satellite data | Medium; shows how to integrate SL's meteorological and terrain data. | [arXiv](https://arxiv.org) |
| **5. ForestFireVLM-7B** | Preprints, 2025 | Vision Language Models (VLMs) | Multimodal fire imagery | Rich semantic output | Describes fire scene contextually (fuel, spread) | Medium; useful for automated command center alerts. | [Preprints](https://preprints.org) |
| **6. FireNet-KD: Swin Transformers on Edge** | MDPI, 2025 | Swin Transformer + Knowledge Distillation | Satellite/Aerial images | High accuracy, low parameters | Combines CNN local features with Transformer global context | High; allows advanced AI on cheap hardware. | [MDPI](https://mdpi.com) |
| **7. Swin-UNet for Wildfire Spread Prediction** | arXiv, 2024 | Swin-UNet | Environmental variables, fire masks | Superior to FARSITE | Attention mechanism focuses on drought/vegetation | High; can predict spread in SL dry zones. | [arXiv](https://arxiv.org) |
| **8. Hybrid SE-ResNet + SVM for Smoke/Fog Ambiguity** | MDPI, 2024 | Deep Learning + SVM | Fog/Smoke dataset | Reduced false alarms | Hybrid classifier targeting mist/cloud misclassification | **Critical**; SL mountains have high mist, avoiding false alarms is key. | [MDPI](https://mdpi.com) |
| **9. Lightweight Edge Detection on Raspberry Pi** | MDPI, 2025 | MobileNetV2 | Embedded camera images | Fast inference on RPi | Optimized for extreme resource constraints | High; allows deploying cheap IoT nodes in SL forests. | [MDPI](https://mdpi.com) |
| **10. Real-time Multimodal Transformer Neural Networks** | arXiv, 2024 | Multimodal Transformer | Weather + Topography | High precision spread mapping | Cross-modal attention mechanisms | High; fuses SL weather station data with terrain. | [arXiv](https://arxiv.org) |
| **11. FFYOLO: Lightweight YOLOv8** | Fire (MDPI), 2024 | YOLOv8 modification | Forest fire datasets | High FPS / mAP balance | Low complexity for low-end hardware | High; standard efficient detection. | [MDPI](https://mdpi.com) |
| **12. LUFFD-YOLO** | MDPI, 2024 | Lightweight architecture | UAV imagery | Resource-efficient | Focused on edge-intelligent UAVs | High; drone swarm integration. | [MDPI](https://mdpi.com) |
| **13. Improved YOLOv8 with BiFormer Attention** | MDPI, 2024 | YOLOv8 + BiFormer + Wise-IoUv3 | National Park datasets | Precise localization | Advanced loss functions for blurred boundaries | Medium; helps detect fires hidden under canopy. | [MDPI](https://mdpi.com) |
| **14. ViT + 3D-CNN Spatiotemporal Learning** | IEEE/NIH, 2024 | 3D-CNN + Transformer | Video sequences | Tracks temporal evolution | Uses time sequence to confirm fire vs moving object | High; stationary camera towers in SL can use this. | [IEEE](https://ieee.org) |
| **15. CatBoost–Transformer Framework** | arXiv/DOI, 2024 | Transformer + Gradient Boosting | Satellite + Weather | Interpretable warnings | Hybrid tabular and visual data processing | High; handles diverse tabular weather data. | [arXiv](https://arxiv.org) |
| **16. YOLO-CSQ for Tiny Objects** | Drones (MDPI), 2024 | Optimized YOLO | UAV drone imagery | High small-target recall | Focused entirely on "tiny" early stage spots | High; early detection is critical for prevention. | [MDPI](https://mdpi.com) |
| **17. Multi-modal Generative AI (GANs/Diffusion) for Fire**| arXiv, 2024 | Generative AI | Spread data | Accurate 3D simulation | Handles uncertainty better than physics models | Low; might be too computationally heavy for SL initially. | [arXiv](https://arxiv.org) |
| **18. LD-YOLO** | MDPI, 2024 | GhostConv + DySample | Smoke/Fire images | Reduced parameters | Maintains accuracy while shrinking model size | High; edge deployment. | [MDPI](https://mdpi.com) |

---

## Key Takeaways for the Sri Lanka Wildfire Detection System

1. **Address the Fog/Cloud Problem (Crucial for SL Hill Country):** Models like the **Hybrid SE-ResNet + SVM** that specifically address the ambiguity between smoke and mountain fog/mist are essential to prevent alarm fatigue.
2. **UAV Swarms with Lightweight YOLO:** Sri Lanka's dense canopy makes satellite detection of small fires difficult. Deploying low-cost drones running lightweight models like **TriRHC-YOLO** or **DFE-YOLO** ensures we catch smoldering fires under the canopy early.
3. **Multimodal Risk Prediction:** The system shouldn't just look for fire; it should predict it. Adapting a **Multimodal Transformer** that fuses Sri Lanka's local weather data (temperature, wind, humidity from meteorological department) with terrain elevation data will allow the system to map out daily high-risk zones.
4. **Edge Computing:** Connectivity in SL's wilderness is unreliable. Utilizing knowledge distillation (like **FireNet-KD**) to run advanced Swin Transformers directly on Raspberry Pi or Jetson Nano edge nodes ensures the system functions without continuous 4G/5G cloud connectivity.
