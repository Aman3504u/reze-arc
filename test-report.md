# Reze Arc — Test Report

**Session**: https://app.devin.ai/sessions/929998dcd9df47fa9d7e6b6f5223cf96
**PRs**: [#3](https://github.com/Aman3504u/reze-arc/pull/3) (→ `main`) and [#2](https://github.com/Aman3504u/reze-arc/pull/2) (→ `feat/cinematic-timeline`), both include fix commit `dad04e5`

## Summary

Tested the full five-act scroll experience and then re-verified after a `useMemo` → `useEffect` fix flagged by Devin Review. All assertions pass.

## Escalations

- **CI on PR #3 never runs**: the repo's default branch is still `feat/cinematic-timeline`; GitHub Actions only fires on PRs to `main`. Fix: either merge / close `feat/cinematic-timeline` and switch default to `main`, or manually re-target PR #3 to `main` (PR #2 and #3 both have the fix commit, pick one).
- **One bug found & fixed mid-test**: the initial run showed unexpected "pale window-sized plane" in Act I and "large pink rectangle" in Act II. Devin Review independently identified the root cause (`useMemo` running before refs attach, leaving all 1400 rain + 220 petal instances at identity matrix). Fixed in `dad04e5`. Verified in the second recording.

## Results

| Test | Result |
|---|---|
| A1 — Audio gate renders and dismisses on click | Pass |
| A2 — Scroll progresses through five acts in order with correct JP/EN captions | Pass |
| A3 — Act IV ignition (white core) at ~60%, fallout at ~70% | Pass |
| A4 — **Reversibility**: scroll backward retracts debris back into the ignition core | Pass (headline) |
| A5 — Act V またね title visible at 100% | Pass |
| A6 — Mute toggle flips HUD label SOUND ON ↔ SILENT | Pass |
| A7 (post-fix) — Rain renders as scattered streaks, not one pale cube | Pass |
| A8 (post-fix) — Petals render as many small planes, not one giant plane | Pass |
| A9 (post-fix) — Act IV debris regression | Pass |

## Visual evidence

### Bug → Fix

| 🔴 BEFORE (broken `useMemo`) | 🟢 AFTER (`useEffect` fix, `dad04e5`) |
|---|---|
| ![BUG: Act I pale plane](https://app.devin.ai/attachments/783ced0a-be97-4f92-a3d7-69e070418c96/screenshot_f45643a6fae94b2296a331364292fc23.png) | ![FIX: Act I rain scattered](https://app.devin.ai/attachments/0c9c56d7-f110-4765-958a-e5ca95bee054/screenshot_fa119b4388684f2f9a5d3017c26d48ac.png) |
| Giant pale unit cube in café — 1400 rain instances frozen at identity matrix | Hundreds of fine vertical streaks across a cylindrical volume |
| ![BUG: Act II pink plane](https://app.devin.ai/attachments/fa39af41-7d4d-465e-bbf8-e8cc738adda3/screenshot_cf897aba2cb544b4ac32a25fb45a0c7d.png) | ![FIX: Act II petals scattered](https://app.devin.ai/attachments/17e0800f-95d7-4497-ba20-2d54db95cc9f/screenshot_03a94611991e41c1881e150579222ac0.png) |
| Single 4×4 pink plane at origin — 220 petal instances frozen at identity matrix | ~220 small pink petals at varied scales and rotations |

### Regression — Act IV detonation (unchanged)

![Act IV — 78% fallout](https://app.devin.ai/attachments/4ebae81c-1abb-43f7-a61b-d90be4a32245/screenshot_3f5094ecf3f240f7974a30a47147d5d0.png)

## Recordings

- First pass (full five-act playthrough + backward detonation rewind): https://app.devin.ai/attachments/4e6b11a1-b8af-4286-b8e4-64d73920d446/rec-cd976385-c16c-4ee6-88f4-bcce0bd983ac-subtitled.mp4
- Post-fix re-verification (rain + petals + Act IV regression): https://app.devin.ai/attachments/da31bff7-6fcd-4c5b-a4dd-d2b1c9bef5d0/rec-4aa88d3f-da6a-4f47-b2ff-ab1cb57fc337-subtitled.mp4
