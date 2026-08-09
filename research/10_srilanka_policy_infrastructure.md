# Sri Lanka Policy, Infrastructure & Stakeholder Landscape for Disaster Management: Deep Research Report

## 1. Executive Summary
This report provides a comprehensive analysis of Sri Lanka's policy, institutional framework, and infrastructure landscape concerning disaster management, with a specific focus on forest fires. Despite contributing less than 0.1% to global greenhouse gas emissions, Sri Lanka is highly vulnerable to climate change (SDG 13). Its rich biodiversity (SDG 15) is increasingly threatened by human-induced forest fires, predominantly during the dry season (July-August). While the Disaster Management Centre (DMC) and the Forest Department employ early warning systems (like DEWN and Sayuru) and emerging technologies (drones, satellite imagery), there remains a significant opportunity for digital transformation. Building an early wildfire detection system in Sri Lanka requires navigating limited dedicated budgets, leveraging robust but geographically uneven mobile networks (Dialog, Mobitel), and collaborating with a multi-tiered stakeholder network including government bodies, academic institutions, and international agencies (UNDP, JICA).

---

## 2. Institutional Framework & Policies

### Forest Department of Sri Lanka
*   **Mandate:** The primary agency responsible for forest conservation, protection, and management under the Forest Conservation Ordinance.
*   **Fire Response Capabilities:** Relies heavily on human intervention, "fire belts," and local community coordination. Most forest fires are human-induced (e.g., land clearing, poaching).
*   **Tech Initiatives:** Transitioning to data-driven approaches. They utilize satellite observations (VIIRS, MODIS) and Google Earth Engine (with DMC) for fire mapping. Recent initiatives include the deployment of drone technology (UAVs) for surveillance, tracking fire origins, and identifying perpetrators. [Source](https://www.newsfirst.lk)

### Disaster Management Centre (DMC)
*   **Structure:** Operates under the National Council for Disaster Management (Disaster Management Act No. 13 of 2005). The DMC coordinates across national, district (District Disaster Management Coordination Units - DDMCU), and local levels.
*   **Early Warning Systems & Tech:** 
    *   Maintains a 24/7 Emergency Operations Centre (EOC).
    *   **AWARE Platform:** Integrates meteorological and socio-economic data for real-time monitoring.
    *   **DEWN (Disaster Early Warning Network):** ICT-based system using Cell Broadcast technology for mass-scale mobile alerts.
    *   **Sayuru System:** A public-private partnership offering trilingual SMS/voice alerts. [Source](https://www.dmc.gov.lk)

### National Policies & Regulations
*   **National Disaster Management Policy:** Recognizes "Forest Fire" as a natural hazard. Establishes the institutional structure for risk reduction and emergency response.
*   **Forest Conservation Ordinance:** Provides the legal basis for declaring "Conservation Forests" to prevent fires hazardous to life and biodiversity. Empowers authorities to take legal action against individuals causing fires.
*   **Building Regulations:** Distinct from forest fires, built environments are governed by the Construction Industry Development Authority (CIDA) and the Factories Ordinance.

---

## 3. Protected Areas & Fire Risk Profiles

Sri Lanka has two primary fire seasons, peaking in July-August due to dry weather. 

| Protected Area | Ecosystem Type | Fire Risk Level | Key Vulnerabilities |
| :--- | :--- | :--- | :--- |
| **Yala National Park** | Dry-zone / Savannah | **High** | Dry scrublands, invasive grasses (guinea grass), high human-wildlife interaction. |
| **Wilpattu National Park** | Dry-zone / Forest | **Moderate-High** | Extended dry spells, poaching activities leading to human-induced fires. |
| **Knuckles Mountain Range** | Cloud Forest / Montane | **Moderate** | Vulnerable during the dry season; illegal land clearing and camping accidents. |
| **Sinharaja Forest Reserve** | Dense Rainforest | **Low** | High humidity and dense canopy; fires are rare but devastating if they occur at the edges. |

*   *Note: Almost all fires in these areas are human-induced.* [Source: Mongabay](https://news.mongabay.com)

---

## 4. Budget, Resources & International Support

*   **National Budget:** Sri Lanka's disaster financing is largely reactive. There is no specific, dedicated "forest fire" budget; funds are often reallocated from broader disaster relief or agricultural budgets during crises.
*   **International Support:** 
    *   **JICA (Japan International Cooperation Agency):** Long-term partner focusing on DRR infrastructure, DMC capacity building, and technical expertise.
    *   **UNDP:** Integrates climate resilience into development. Recent initiatives focus on community-based disaster preparedness and climate-resilient waste management. [Source: JICA / UNDP Sri Lanka]

---

## 5. Technology & Telecommunication Infrastructure

### Telecom Landscape
*   **Major Players:** Dialog Axiata, SLT-Mobitel, Airtel.
*   **Rural Internet & Coverage:** Intensive efforts (e.g., "Sew Desatama Dialog") aim for over 95% 4G population coverage. However, deep rural, mountainous, and dense forest areas still experience connectivity gaps and "spotty" coverage.
*   **SMS & Early Warning:** Highly capable. The **DEWN** system utilizes Cell Broadcast (avoiding network congestion) to deliver location-based alerts. The **Sayuru** service provides critical weather warnings to coastal communities.

### Academic Research & Tech Initiatives
Sri Lankan universities are actively researching fire prediction and environmental monitoring:
*   **University of Moratuwa (UoM):** Developing multi-model wireless sensor networks (LoRa-based) and AI/CNN models for early smoke/fire detection.
*   **University of Peradeniya (UoP):** Utilizing GIS and remote sensing for forest fire management plans (e.g., Hanthana Protected Area).
*   **University of Colombo (UoC):** Wildfire propagation prediction models using GIS.
*   **SLIIT:** Broader environmental engineering and sustainable tech research.

---

## 6. SDG 13 & 15 Progress Metrics

*   **SDG 13 (Climate Action):** Sri Lanka pledged a 14.5% GHG emission reduction by 2030. Progress is monitored via the DCS SDG Data Portal, focusing on disaster resilience and climate-smart agriculture.
*   **SDG 15 (Life on Land):** A recognized biodiversity hotspot. While protection of Key Biodiversity Areas (KBAs) has increased (terrestrial KBAs from 36.9% in 2000 to 45.2% in 2025), overall forest cover has declined to approximately 34.3%. [Source: UN Sustainable Development Report](https://sdgindex.org)

---

## 7. Stakeholder Map for Wildfire Early Detection System

A successful early warning tech implementation must engage the following stakeholders:

| Category | Stakeholders | Role / Benefit |
| :--- | :--- | :--- |
| **Government (Core)** | Forest Department, DMC, Dept of Wildlife Conservation | Primary end-users, command & control, dispatching emergency responses. |
| **Telecom & Tech** | Dialog Axiata, SLT-Mobitel, TRCSL | Providing IoT connectivity (LoRaWAN/4G), server hosting, and Cell Broadcast dissemination (DEWN). |
| **International/Funding** | UNDP, JICA, World Bank | Financial backing, technical expertise, and alignment with global DRR frameworks. |
| **Academia** | UoM, UoP, UoC | Providing localized AI models, GIS mapping, and R&D for sensor networks. |
| **Local Communities** | Village Committees, Grama Niladharis | On-the-ground validation, community response, and primary beneficiaries of alerts. |

---

## 8. Gaps, Opportunities & Key Takeaways

**Takeaways for a Wildfire Early Detection System:**
1.  **Address the Connectivity Gap:** Since deep forest areas (like Yala or Knuckles) have spotty 4G coverage, an early detection system should leverage **LoRaWAN or Mesh Networks** connecting to edge gateways where cellular coverage is stable.
2.  **Integration with Existing Systems:** Instead of building a standalone alert app, the system MUST integrate with the DMC's existing **AWARE platform** and push alerts through the **DEWN Cell Broadcast** system.
3.  **Human-Centric Focus:** Since most fires are human-induced, sensors and cameras should be deployed at forest peripheries, trailheads, and human-wildlife interface zones rather than deep uninhabited cores.
4.  **Cost-Effective Scalability:** Due to reactive national budgeting, the proposed tech must be highly cost-effective. Partnering with universities (e.g., UoM's prototype sensor nodes) and seeking UNDP/JICA grants is the most viable path to market.
