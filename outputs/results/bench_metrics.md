### Selection split (bench)

P_yellow = 92.0, persistence = 3 days. Synthetic data calibrated on published sources — proof of concept, not clinical validation.

| Scenario | n | Detected Model / B1 / B2 | Median delay (days) Model / B1 / B2 | Lead vs B1: median (both detected) · only Model | Lead vs B2: median (both detected) · only Model |
|---|---|---|---|---|---|
| S1 | 30 | 100% / 47% / 100% | 12 / 18 / 21 | +5.5 d (n=14) · 16 | +8 d (n=30) · 0 |
| S2 | 30 | 100% / 90% / 100% | 14.5 / 13 / 14 | +0 d (n=27) · 3 | -1 d (n=30) · 0 |
| S3 | 30 | 100% / 60% / 93% | 11 / 19 / 16.5 | +6 d (n=18) · 12 | +6.5 d (n=28) · 2 |

False alarms per astronaut-week (healthy days after calibration): Model 0.041, B1 0.084, B2 0.021.

### Sensitivity to scenario size (detection rate Model / B1 / B2)

| Scale | S1 | S2 | S3 |
|---|---|---|---|
| × 0.5 | 100% / 40% / 47% | 73% / 63% / 60% | 93% / 50% / 47% |
| × 1.0 | 100% / 47% / 100% | 100% / 90% / 100% | 100% / 60% / 93% |
| × 1.5 | 100% / 67% / 100% | 100% / 100% / 100% | 100% / 87% / 100% |

### False-alarm-matched comparison with B2 (model at P_yellow = 95, Model 0.021 vs B2 0.021 false alarms per astronaut-week)

| Scale | S1: detected Model / B2 | S2: detected Model / B2 | S3: detected Model / B2 |
|---|---|---|---|
| × 0.5 | 100% / 47% | 57% / 60% | 87% / 47% |
| × 1.0 | 100% / 100% | 100% / 100% | 100% / 93% |
| × 1.5 | 100% / 100% | 100% / 100% | 100% / 100% |
