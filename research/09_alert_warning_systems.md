# Research Report: Early Warning & Alert Systems for Disasters

## Executive Summary
This report provides a comprehensive analysis of early warning and alert system architectures, drawing on international standards (UN Sendai Framework, WMO), modern communication platforms, and hardware integrations. The findings are contextualized for developing nations, with a specific focus on Sri Lanka's existing infrastructure and cultural adoption of technologies like WhatsApp. The insights gathered are directly applicable to the development of a robust, multi-hazard or wildfire early detection system for Sri Lanka, emphasizing a "people-centered" approach that bridges the gap between high-tech sensor networks and last-mile community response.

---

## Detailed Findings

### 1. Multi-Hazard Early Warning Systems (MHEWS)
The UN Sendai Framework (Target G) and WMO guidelines mandate a shift from single-hazard to multi-hazard early warning systems. The core philosophy is a "people-centered, end-to-end approach." 
WMO outlines four pillars for an effective MHEWS:
1. **Disaster Risk Knowledge:** Systematic data collection.
2. **Detection, Monitoring, Analysis, and Forecasting:** Utilizing sensors and AI to track hazards.
3. **Dissemination and Communication:** Ensuring timely warnings reach the public.
4. **Preparedness:** Maintaining response capabilities at all levels.

### 2. Alert Protocols & Severity Levels
The **Common Alerting Protocol (CAP)** is the international standard format for emergency alerting. CAP ensures a single verified message is disseminated across multiple channels simultaneously.
CAP standard severity levels:
*   **Extreme:** Extraordinary threat to life or property.
*   **Severe:** Significant threat to life or property.
*   **Moderate:** Possible threat to life or property.
*   **Minor:** Minimal to no known threat to life or property.

### 3. Digital Communication Platforms

#### SMS-Based Alerting
Neither Twilio nor Africa's Talking offers a permanent free tier for production bulk SMS; both are pay-as-you-go or prepaid.
*   **Twilio:** Industry standard, global reach. Free trial is time-bound and restricted to verified numbers. Best for global reach and omnichannel needs.
*   **Africa's Talking:** Pan-African focus with direct carrier routes. Offers a free sandbox for development, but live messages require prepaid credits. Might lack direct optimized routes for Sri Lanka compared to global CPaaS or local telco APIs (like Dialog).

#### Push Notification Systems
*   **Firebase Cloud Messaging (FCM):** An infrastructure-level transport layer. It is 100% free with unlimited delivery but requires significant engineering to build segmentation and campaign logic.
*   **OneSignal:** A managed engagement platform sitting on top of FCM/APNs. Offers a free tier and user-friendly dashboards for segmentation, A/B testing, and multi-channel orchestration.

#### Email Alerting
*   **SendGrid:** Offers a 60-day free trial (100 emails/day), after which it converts to paid. Better suited for marketing/transactional hybrids.
*   **Mailgun:** Offers a permanent free tier (100 emails/day). Developer-focused with a native "Alerts" product (webhooks, Slack integrations), making it ideal for system monitoring and stakeholder alerting.

#### WhatsApp Business API (Sri Lanka Context)
WhatsApp has massive penetration in Sri Lanka. For emergency alerts, the official WhatsApp Business API is required.
*   **Capabilities:** Allows automated, scalable, real-time alerts. Supports rich media (images of fire fronts, maps).
*   **Implementation:** Must adhere to Meta's opt-in policies. Using local Business Solution Providers (BSPs) who offer trilingual support (Sinhala, Tamil, English) is crucial for effective reach.

### 4. Hardware and Community Alerts

#### IoT-Connected Sirens & PA Systems
Modern IoT sirens replace manual activation with automated triggering based on sensor data (e.g., thermal, smoke, seismic).
*   **Architecture:** Perception layer (sensors) -> Network layer (LoRaWAN, MQTT, Cellular) -> Application layer (Dashboard).
*   **Benefits:** Targeted zone alerting, remote diagnostics, and hybrid connectivity (LoRa + GSM) ensure reliability even in remote areas.

#### Low-Tech Fallbacks
When power and internet fail, analog fallbacks are life-saving:
*   **Battery/Crank Radios:** NOAA-style weather radios.
*   **Public Sirens:** Non-digital, locally powered.
*   **Community Networks:** Manual alert chains, flags, assembly points.
*   **Two-way Ham/CB Radios:** Used by responders when cell networks collapse.

### 5. Operational Dynamics

#### Stakeholder Notification Chains & Response Times
*   **Response Time:** The first 72 hours are critical. EWS aims to compress detection-to-alert timelines. There is no global standard time; it relies on local SOPs.
*   **Chains:** Follow the PACE framework (Primary, Alternate, Contingency, Emergency channels). Chains typically flow: Sensors -> EOC/Government Authority -> First Responders -> Community.

#### False Alarm Management
Alert fatigue (the "Cry Wolf" effect) causes communities to ignore warnings.
*   **Mitigation:** Use multi-step verification (sensor + human confirmation). Provide contextual messaging (explaining *why* a false alarm happened). Calibrate sensors continuously.

#### EOC Dashboard Design Best Practices
*   **Layout:** F-pattern for KPIs; prioritize Alerts (actionable) over Notifications (informational).
*   **Common Operating Picture (COP):** Integrate GIS/maps, live sensor data, and resource tracking into a single view.
*   **Cognitive Load:** Use color coding (red/yellow) and minimize visual noise to aid rapid decision-making under stress.

### 6. Case Studies & Sri Lanka's Infrastructure

#### Sri Lanka's Alert Infrastructure
The Disaster Management Centre (DMC) coordinates alerts.
*   **DEWN (Disaster and Emergency Warning Network):** A partnership with Dialog Axiata. Uses Cell Broadcast to send localized alerts without needing a data connection, bypassing network congestion.
*   **Sayuru:** Trilingual service for fishermen via SMS/voice.
*   **Tsunami Systems:** Upgraded in 2023 across 14 districts with distinct siren tones.

#### Developing Countries Case Studies
*   **Indonesia:** Palu Tsunami showed that high-tech systems fail without community education.
*   **Bangladesh:** Transitioned to multi-hazard systems using IVR.
*   **Key Lesson:** The "Last Mile" challenge requires people-centered systems where communities understand and trust the alerts.

---

## Key Takeaways for Building a Wildfire Early Detection System in Sri Lanka

1. **Leverage Existing Telco Infrastructure:** Instead of building a dissemination network from scratch, integrate with Dialog's DEWN for cell broadcasting. This reaches offline feature phones and bypasses data outages.
2. **Trilingual WhatsApp API Integration:** For early warnings and community reporting (crowdsourcing fire sightings), a WhatsApp chatbot supporting Sinhala, Tamil, and English is optimal given local app usage.
3. **IoT Sensor Networks with LoRaWAN:** Forest areas lack GSM coverage. Use LoRaWAN for thermal/smoke sensors in forests, sending data to a central hub that has satellite/GSM backhaul.
4. **Mitigate Alert Fatigue:** Wildfire sensors (like smoke detectors) can trigger false positives from agricultural burn-offs. Implement an AI validation layer or a "human-in-the-loop" validation step before escalating to a severe public alert.
5. **EOC Dashboard for DMC:** Design a COP dashboard that overlays sensor data, wind direction, and population density on a GIS map, tailored for Sri Lankan firefighting authorities.
6. **Community Drills:** Technology will fail if locals don't know evacuation routes. System deployment must be paired with village-level education.

---
## Key Statistics & Data Points
* **60%** of countries report having an MHEWS, but significant gaps remain in developing nations (WMO).
* The **first 72 hours** post-disaster are universally acknowledged as the most critical window for emergency response.
* IoT-enabled EWS can reduce emergency response times by up to **25%** by automating alert triggers based on sensor thresholds.

## Sources
* WMO MHEWS Guidelines: https://public.wmo.int
* Sendai Framework: https://www.undrr.org
* CAP Standard: https://www.itu.int
* Sri Lanka DMC & DEWN: https://www.dmc.gov.lk, https://dialog.lk
* FCM vs OneSignal comparisons: https://onesignal.com, https://firebase.google.com
* IoT Alert Systems: IEEE, MDPI research papers.
* False Alarm & Alert Fatigue: ResearchGate DRR journals.
