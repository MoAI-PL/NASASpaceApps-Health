| Config entry | Status | Source / note |
|---|---|---|
| `simulation.yaml` mission.start_date | ASSUMPTION | Real calendar window used only to align real NASA DONKI solar particle events with mission days. |
| `simulation.yaml` mission.days | ASSUMPTION |  |
| `simulation.yaml` mission.calibration_days | ASSUMPTION | Personal baseline period; no scenario is ever active here. |
| `simulation.yaml` mission.scenario_free_days | ASSUMPTION |  |
| `simulation.yaml` mission.scenario_start_range | ASSUMPTION |  |
| `simulation.yaml` features.sys | ASSUMPTION |  |
| `simulation.yaml` features.dia | ASSUMPTION |  |
| `simulation.yaml` features.hr | ASSUMPTION |  |
| `simulation.yaml` features.glucose | ASSUMPTION |  |
| `simulation.yaml` features.temp | ASSUMPTION |  |
| `simulation.yaml` features.sleep_h | SOURCED | Barger L.K. et al., The Lancet Neurology (2014): ISS crew averaged 6.09 h of sleep per night (pop_mean). pop_sd and day_sd are assumptions. https://www.eurekalert.org/news-releases/595450 |
| `simulation.yaml` features.mood | ASSUMPTION |  |
| `simulation.yaml` features.reaction_ms | ASSUMPTION |  |
| `simulation.yaml` features.exercise_min | ASSUMPTION |  |
| `simulation.yaml` latent.phi | ASSUMPTION |  |
| `simulation.yaml` latent.fatigue_loadings | ASSUMPTION |  |
| `simulation.yaml` latent.load_exercise_loading | ASSUMPTION | Share of exercise variation driven by the training-load factor. |
| `simulation.yaml` latent.load_next_day_loadings | ASSUMPTION | Effect of the previous day's training load. |
| `simulation.yaml` missing_prob | ASSUMPTION |  |
| `simulation.yaml` radiation.baseline_mGy_per_day | ASSUMPTION | Order-of-magnitude placeholder for deep-space absorbed dose; replace with a verified value (e.g. Curiosity RAD cruise measurements) before quoting it. |
| `simulation.yaml` radiation.baseline_rel_noise | ASSUMPTION |  |
| `simulation.yaml` radiation.sep_spike_mGy | ASSUMPTION | Added on days with a DONKI solar energetic particle event; magnitude is illustrative only. |
| `simulation.yaml` cabin_co2.baseline_mmHg | ASSUMPTION |  |
| `simulation.yaml` cabin_co2.day_sd | ASSUMPTION |  |
| `simulation.yaml` cabin_co2.episodes_per_mission | ASSUMPTION |  |
| `simulation.yaml` cabin_co2.episode_days | ASSUMPTION |  |
| `simulation.yaml` cabin_co2.episode_level_mmHg | ASSUMPTION | Within the 1-9 mmHg range reported on the ISS by NASA OCHMO. |
| `simulation.yaml` cabin_co2.limit_mmHg | SOURCED | NASA OCHMO Technical Brief OCHMO-TB-004 Carbon Dioxide: NASA-STD-3001 Vol. 2 [V2 6004] limits the 1-hour average ppCO2 to 3 mmHg; ISS flight rule keeps the 24-hour average at or below 3.0 mmHg. https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf |
| `simulation.yaml` scenarios.S1 | ASSUMPTION |  |
| `simulation.yaml` scenarios.S2 | ASSUMPTION |  |
| `simulation.yaml` scenarios.S3 | ASSUMPTION |  |
| `simulation.yaml` scenarios.S4 | ASSUMPTION |  |
| `simulation.yaml` scenarios.S5 | ASSUMPTION |  |
| `rules.yaml` b1_rules[temp ge 38.0] | SOURCED | MedlinePlus (U.S. National Library of Medicine), Body temperature norms: a temperature over 100.4 °F (38 °C) most often means a fever. https://medlineplus.gov/ency/article/001982.htm |
| `rules.yaml` b1_rules[hr gt 100] | SOURCED | Mayo Clinic, Heart rate: What's normal? — a normal resting heart rate for adults ranges from 60 to 100 beats per minute. https://www.mayoclinic.org/healthy-lifestyle/fitness/expert-answers/heart-rate |
| `rules.yaml` b1_rules[sys ge 140] | SOURCED | American Heart Association, Understanding Blood Pressure Readings — Stage 2 hypertension: systolic >= 140 or diastolic >= 90 mmHg. https://heart.org/bplevels |
| `rules.yaml` b1_rules[dia ge 90] | SOURCED | American Heart Association, Understanding Blood Pressure Readings — Stage 2 hypertension. https://heart.org/bplevels |
| `rules.yaml` b1_rules[glucose ge 126] | ASSUMPTION | Fasting glucose diagnostic cut-off commonly attributed to the ADA; verify before quoting. |
| `rules.yaml` b1_rules[glucose lt 70] | SOURCED | American Diabetes Association, Hypoglycemia (HCP) — Level 1 hypoglycemia: glucose < 70 mg/dL. https://professional.diabetes.org/sites/dpro/files/2025-05/hypoglycemia-hcp-5-27-25.pdf |
| `rules.yaml` b1_rules[sleep_h lt 5.0] | ASSUMPTION |  |
| `rules.yaml` b1_rules[mood le 2] | ASSUMPTION |  |
| `rules.yaml` critical_rules[temp ge 39.5] | ASSUMPTION |  |
| `rules.yaml` critical_rules[sys gt 180] | SOURCED | American Heart Association — hypertensive crisis: systolic above 180 and/or diastolic above 120 mmHg. https://heart.org/bplevels |
| `rules.yaml` critical_rules[dia gt 120] | SOURCED | American Heart Association — hypertensive crisis. https://heart.org/bplevels |
| `rules.yaml` critical_rules[glucose lt 54] | SOURCED | American Diabetes Association — Level 2 hypoglycemia: glucose < 54 mg/dL. https://professional.diabetes.org/sites/dpro/files/2025-05/hypoglycemia-hcp-5-27-25.pdf |
| `rules.yaml` critical_rules[hr gt 130] | ASSUMPTION |  |
| `rules.yaml` critical_rules[hr lt 40] | ASSUMPTION |  |
| `rules.yaml` b2 | ASSUMPTION | Method parameter of the personal single-indicator baseline (B2). |
| `ui.yaml` hazards.radiation | SOURCED | https://www.nasa.gov/hrp/hazards/ |
| `ui.yaml` hazards.isolation | SOURCED | https://www.nasa.gov/hrp/hazards/ |
| `ui.yaml` hazards.distance | SOURCED | https://www.nasa.gov/hrp/hazards/ |
| `ui.yaml` hazards.gravity | SOURCED | https://www.nasa.gov/hrp/hazards/ |
| `ui.yaml` hazards.closed_environment | SOURCED | https://www.nasa.gov/hrp/hazards/ |
| `ui.yaml` environments.iss | ASSUMPTION |  |
| `ui.yaml` environments.lunar_base | SOURCED | Light travel time over the mean Earth–Moon distance (~384,400 km / c ≈ 1.28 s); NASA ASCEND paper describes few-second maximum delays just beyond the Moon. https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays%2C%20Disruptions%2C%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf |
| `ui.yaml` environments.mars_transit | SOURCED | NASA ASCEND paper: Earth–Mars one-way delays vary from 0 to 22 minutes over a mission. https://ntrs.nasa.gov/api/citations/20220013418/downloads/ASCEND-Communication%20Delays%2C%20Disruptions%2C%20and%20Blackouts%20for%20Crewed%20Mars%20Missions.pdf |
| `ui.yaml` escalation | ASSUMPTION | Escalation ladder thresholds chosen by the team; to be reviewed with a flight-medicine source. |
