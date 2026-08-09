# Deep Research Report: Sri Lanka Wildfire & Forest Fire Context

## Executive Summary
Forest fires in Sri Lanka represent a significant and growing environmental challenge. Unlike some regions where natural phenomena like lightning are major causes, over 95% of forest fires in Sri Lanka are human-induced. The country experiences annual damages ranging from 100 to 2,500 hectares, with a concerning upward trend exacerbated by climate change and prolonged droughts. The most affected areas are concentrated in the dry zones and the Uva Province, particularly Badulla and Monaragala. While traditional response mechanisms involving the Disaster Management Centre (DMC) and the Forest Department are in place, there is a recognized gap in technological integration, presenting a critical opportunity for the deployment of advanced early warning and monitoring systems.

---

## 1. Historical Fire Data & Statistics
Sri Lanka does not experience continent-scale megafires, but its frequent, localized fires have severe cumulative impacts.
- **Hectares Burned:** Annually, between **100 and 2,500 hectares** of forest and grassland are destroyed. Recent years have seen a spike, with over 40 significant fires reported in just the first two months of 2025/2026.
- **Biodiversity Impact:** Fires frequently lead to the death of mature native trees, destruction of habitats for endemic species, and mortality among less mobile fauna (insects, reptiles, small mammals). 
- **Ecological Degradation:** Repeated fires result in severe topsoil loss, increased surface runoff, and sedimentation of streams, raising landslide risks during the monsoon.
- **Economic Losses:** While exact monetary figures are difficult to aggregate nationally, losses include timber, non-timber forest products, disruption to eco-tourism, and high costs associated with emergency response (e.g., deploying the Sri Lanka Air Force).

## 2. Geographical Hotspots & Vulnerable Vegetation

### Most Affected Districts
The most fire-prone districts are typically located in the dry zone and central highlands:
1. **Badulla:** Consistently records the highest number of forest fires.
2. **Monaragala:** Highly susceptible, especially around Wellawaya.
3. **Polonnaruwa & Anuradhapura:** Dry zone districts where agricultural clearing often escapes into forests.
4. **Central Highlands:** Areas like the Knuckles Mountain Range, Belihuloya, and Ella face increasing risks due to spreading fires.

### Vegetation Types at Risk
| Ecosystem | Vulnerability & Characteristics |
| :--- | :--- |
| **Grasslands (Pathanas/Savannas)** | Highly flammable (e.g., Nilgala). Often maintained by fire, but increased frequency leads to degradation and the proliferation of invasive species like Guinea grass, which burns hotter. |
| **Dry Zone Forests** | Tropical dry mixed evergreen forests accumulate massive fuel loads during the long dry season (June–September). |
| **Montane / Cloud Forests** | Found above 1,000m. Traditionally less prone to fire, they are now threatened as fires spread from adjacent grasslands due to changing microclimates. |
| **Plantations** | Introduced species like Pine and Eucalyptus in the highlands are highly resinous and increase bushfire hazards significantly. |

## 3. Causes of Forest Fires
Almost all fires in Sri Lanka are **anthropogenic** (human-caused). Natural causes like lightning are extremely rare.
- **Slash-and-Burn Agriculture (Chena):** Farmers intentionally burn patches of forest to clear land. Fires frequently escape into surrounding reserves.
- **Cattle Grazing:** Herders deliberately set fire to dry grasslands to stimulate the rapid growth of fresh green shoots for livestock.
- **Hunting/Poaching:** Fires are lit to flush out wild animals from dense cover.
- **Human Negligence:** Discarded cigarette butts, unattended campfires, and burning roadside debris.
- **Honey Collection:** Traditional methods involve smoking out bees, which can easily ignite dry vegetation.

## 4. Seasonal Patterns and Climate Change Impact

### The Fire Seasons
Fires in Sri Lanka are highly seasonal, strictly following the dry spells between monsoons:
- **Major Fire Season:** **June to September** (peaking in July and August) affects the dry zone when fuel loads are highest.
- **Minor Fire Season:** **February to March** affects the wet zone and highlands during a brief but intense dry window.

### Climate Change Nexus
- **Warming Temperatures & Droughts:** Climate change is disrupting the El Niño Southern Oscillation (ENSO) and traditional monsoon cycles. This leads to longer, more intense dry seasons, turning vegetation into highly flammable tinder.
- **Feedback Loop:** As temperatures rise, fire intensity increases, killing mature trees that would normally survive. The resulting loss of carbon sinks and release of CO2 further accelerates local warming.
- **Expanding Threat:** Fires are increasingly encroaching into dense, historically moist forests that previously acted as natural firebreaks.

## 5. Current Detection, Response & Agencies Involved

### Primary Agencies
- **Disaster Management Centre (DMC):** The central coordinating body for all disaster responses, integrating fire management into the National Disaster Management Plan.
- **Forest Department (FD) & Department of Wildlife Conservation (DWC):** Responsible for ground-level prevention, creating fire belts, and initial suppression.
- **Sri Lanka Air Force (SLAF):** Called in for aerial firefighting (using Bambi buckets) during major, uncontrollable blazes.
- **Local Fire Brigades & Military:** Assist in ground suppression in accessible areas.

### Current Detection Methods
- **Manual & Visual:** Heavily reliant on manual patrols by forest rangers and visual reports from local communities.
- **Hotlines:** The public reports fires via `1992` (Forest/Wildlife crimes), `117` (DMC), or `110` (Fire Rescue).
- **Shortcomings:** Responses are largely reactive. By the time a fire is visually detected and reported, it has often grown beyond the capacity of ground crews.

## 6. Existing Digital & Tech Solutions
While traditional methods dominate, there is a growing push towards technological integration:
- **Satellite Monitoring:** The DMC utilizes platforms like Google Earth Engine (Landsat-8, Sentinel-2) for post-fire burn severity mapping. NASA's FIRMS (MODIS/VIIRS) is used for active fire hotspot detection.
- **Early Warning Platforms:** The AWARE platform (by IWMI) integrates meteorological data for broader disaster resilience, though not exclusively for fires.
- **Academic Prototypes:** Universities (e.g., University of Moratuwa) are researching Wireless Sensor Networks (WSN) to monitor temperature, humidity, and CO2, combined with Machine Learning (ML) to reduce false alarms.
- **The Gap:** There is a significant gap between localized academic prototypes and a scalable, operational, nationwide early warning system.

---

## Key Takeaways for Building an Early Detection System in Sri Lanka
1. **Target the Hotspots:** The system should be prioritized for deployment in Badulla, Monaragala, and specific high-risk reserves like the Knuckles Range and Nilgala.
2. **Account for Human Behavior:** Since fires are human-induced, sensors and cameras should be strategically placed near agricultural borders, grazing lands, and forest entry points, rather than just deep in the forest.
3. **Multi-Modal Sensing:** A successful system must integrate ground-based IoT sensors (temperature, humidity, smoke) with satellite data (FIRMS) to overcome the limitations of manual patrols.
4. **Rapid Alerting:** The system should directly interface with the DMC (117) and Forest Department to reduce the critical delay between ignition and response.
5. **Weather Integration:** Incorporating real-time drought and wind data is crucial, given the strong seasonal (Feb-Mar, Jun-Sep) and climate-driven nature of the fires.

---
### Sources Consulted
*   *Mongabay* - Reports on Sri Lanka biodiversity loss, El Niño impacts, and annual fire statistics.
*   *ResearchGate* - Academic papers detailing GIS mapping of fire risks in Uva Province, Belihuloya, and the impact of Pine/Eucalyptus plantations.
*   *Disaster Management Centre (DMC) Sri Lanka* - Official protocols, early warning mechanisms, and inter-agency coordination.
*   *FAO (Food and Agriculture Organization)* - Forestry profiles and fire management data for Sri Lanka.
*   *Local News (Daily Mirror, Adaderana, The Morning)* - Real-time reports of seasonal fire outbreaks and government response efforts.
