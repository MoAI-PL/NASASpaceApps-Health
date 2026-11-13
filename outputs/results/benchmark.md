### Benchmark at a false-alarm budget of 0.05 per astronaut-week (bench split, scenario sizes × 0.5 and × 1.0)

| Rank | Method | Persistence | FA / astronaut-week | Early detection (≤21 d) | Detected | Mean of median delays (d) |
|---|---|---|---|---|---|---|
| – | B1 fixed clinical thresholds | rule | 0.084 | 39% | 58% | 17.7 |
| 1 | Combined: Mahalanobis 7-day mean + AE ensemble | 3 | 0.049 | 82% | 94% | 14.9 |
| 2 | Classical Mahalanobis, 7-day mean (drift) | 3 | 0.048 | 82% | 96% | 15.3 |
| 3 | Classical Mahalanobis, 7-day mean, 3-day smoothed | 3 | 0.049 | 82% | 96% | 15.7 |
| 4 | Classical Mahalanobis, 14-day mean (drift) | 2 | 0.048 | 81% | 96% | 15.2 |
| 5 | Classical Mahalanobis, 14-day mean (drift) | 3 | 0.048 | 81% | 95% | 15.2 |
| 6 | Combined: Mahalanobis 7-day mean + AE ensemble | 2 | 0.048 | 79% | 93% | 14.8 |
| 7 | Classical Mahalanobis, 7-day mean, 3-day smoothed | 2 | 0.045 | 79% | 94% | 15.6 |
| 8 | Classical Mahalanobis, 7-day mean (drift) | 2 | 0.049 | 78% | 95% | 15.1 |
| 9 | AE ensemble x5, 300 train, 3-day smoothed | 3 | 0.048 | 68% | 87% | 16.8 |
| 10 | AE ensemble x5, 300 train | 2 | 0.049 | 67% | 86% | 17.3 |
| 11 | AE ensemble x5, 300 train, 3-day smoothed | 2 | 0.049 | 66% | 86% | 18.1 |
| 12 | AE w14 b8, 300 train | 3 | 0.048 | 65% | 92% | 18.2 |
| 13 | AE ensemble x5, 300 train | 3 | 0.046 | 64% | 85% | 17.5 |
| 14 | AE w14 b8, 300 train | 2 | 0.049 | 64% | 89% | 18.2 |
| 15 | B2 personal single-indicator, 3-day smoothed | 3 | 0.049 | 64% | 88% | 19.1 |
| 16 | AE w7 b4, 300 train | 2 | 0.049 | 63% | 89% | 19.2 |
| 17 | AE w7 b16, 300 train | 3 | 0.048 | 62% | 83% | 17.9 |
| 18 | B2 personal single-indicator (max |z|) | 3 | 0.049 | 61% | 87% | 16.9 |
| 19 | AE w7 b16, 300 train | 2 | 0.049 | 61% | 80% | 17.8 |
| 20 | B2 personal single-indicator, 3-day smoothed | 2 | 0.048 | 61% | 86% | 18.5 |
| 21 | Classical Mahalanobis, 7-day window | 3 | 0.049 | 60% | 80% | 17.7 |
| 22 | AE w7 b4, 300 train | 3 | 0.049 | 59% | 86% | 20.3 |
| 23 | AE v2 (current: w7 b8, 60 train) | 2 | 0.048 | 56% | 81% | 18.2 |
| 24 | Classical Mahalanobis, 7-day window | 2 | 0.047 | 56% | 76% | 17.7 |
| 25 | B2 personal single-indicator (max |z|) | 2 | 0.049 | 55% | 82% | 18.7 |
| 26 | AE v2 (current: w7 b8, 60 train) | 3 | 0.049 | 54% | 80% | 18.8 |
| 27 | Hybrid: max(AE 3-day smoothed, B2) percentile | 2 | 0.047 | 53% | 80% | 19.6 |
| 28 | AE w7 b8, 300 train, 5-day smoothed | 3 | 0.049 | 52% | 78% | 18.1 |
| 29 | Hybrid: max(AE, B2) percentile | 3 | 0.048 | 51% | 77% | 19.8 |
| 30 | Hybrid: max(AE 3-day smoothed, B2) percentile | 3 | 0.048 | 50% | 76% | 20.2 |
| 31 | AE w7 b8, 300 train, 5-day smoothed | 2 | 0.049 | 50% | 77% | 18.8 |
| 32 | Hybrid: max(AE, B2) percentile | 2 | 0.047 | 50% | 77% | 20.9 |
| 33 | AE w7 b8, 300 train | 3 | 0.049 | 49% | 74% | 18.6 |
| 34 | AE w7 b8, 300 train, 3-day smoothed | 2 | 0.049 | 48% | 73% | 18.9 |
| 35 | AE w7 b8, 300 train, 3-day smoothed | 3 | 0.049 | 48% | 76% | 19.2 |
| 36 | AE w7 b8, 300 train + personal fine-tuning | 3 | 0.049 | 48% | 74% | 19.5 |
| 37 | AE w7 b8, 300 train | 2 | 0.049 | 46% | 72% | 20.2 |
| 38 | AE w7 b8, 300 train + personal fine-tuning | 2 | 0.049 | 46% | 72% | 20.2 |
| 39 | AE w7 b8, 300 train, reconstruction only | 3 | 0.049 | 44% | 67% | 18.3 |
| 40 | AE w7 b8, 300 train, latent only | 3 | 0.049 | 44% | 76% | 22.2 |
| 41 | AE w7 b8, 300 train, reconstruction only | 2 | 0.048 | 43% | 68% | 18.9 |
| 42 | AE w7 b8, 300 train, latent only | 2 | 0.049 | 43% | 73% | 22.3 |
