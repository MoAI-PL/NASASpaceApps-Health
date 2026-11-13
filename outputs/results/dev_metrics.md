### Confirmation split (dev, thresholds frozen)

P_yellow = 92.0, persistence = 3 days. Synthetic data calibrated on published sources — proof of concept, not clinical validation.

| Scenario | n | Detected Model / B1 / B2 | Median delay (days) Model / B1 / B2 | Lead vs B1: median (both detected) · only Model | Lead vs B2: median (both detected) · only Model |
|---|---|---|---|---|---|
| S1 | 10 | 100% / 60% / 100% | 11 / 29 / 18.5 | +18.5 d (n=6) · 4 | +7.5 d (n=10) · 0 |
| S2 | 10 | 100% / 90% / 100% | 13 / 16 / 13.5 | -1 d (n=9) · 1 | -1.5 d (n=10) · 0 |
| S3 | 10 | 100% / 80% / 90% | 8.5 / 18.5 / 15 | +7 d (n=8) · 2 | +8 d (n=9) · 1 |

False alarms per astronaut-week (healthy days after calibration): Model 0.072, B1 0.093, B2 0.031.

### Sensitivity to scenario size (detection rate Model / B1 / B2)

| Scale | S1 | S2 | S3 |
|---|---|---|---|
| × 0.5 | 100% / 30% / 60% | 90% / 50% / 50% | 100% / 40% / 60% |
| × 1.0 | 100% / 60% / 100% | 100% / 90% / 100% | 100% / 80% / 90% |
| × 1.5 | 100% / 70% / 100% | 100% / 90% / 100% | 100% / 90% / 100% |

### False-alarm-matched comparison with B2 (model at P_yellow = 96, Model 0.028 vs B2 0.031 false alarms per astronaut-week)

| Scale | S1: detected Model / B2 | S2: detected Model / B2 | S3: detected Model / B2 |
|---|---|---|---|
| × 0.5 | 100% / 60% | 50% / 50% | 80% / 60% |
| × 1.0 | 100% / 100% | 100% / 100% | 100% / 90% |
| × 1.5 | 100% / 100% | 100% / 100% | 100% / 100% |
