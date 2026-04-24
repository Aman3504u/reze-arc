# Reze Arc — Re-verification test plan (InstancedMesh fix)

Fix under test: `useMemo` → `useEffect` for rain (Act I) and petal (Act II) per-instance matrix initialization. Before the fix, 1400 rain streaks and 220 petals were stuck at identity matrix — a single unit cube/plane at the origin. After the fix, each instance should be placed/scaled per its seeded random values.

Evidence of old broken state: during the previous test pass, I captured screenshots showing a "pale window-sized plane" in Act I and a "giant pink rectangle" in Act II. Those are the identity-matrix primitives that Devin Review flagged.

## Primary flow (single recording)

1. Load `http://localhost:5173` (hard reload)
2. Click "BEGIN · WITH SOUND"
3. Scroll forward to ~8 % (Act I mid) — **observe rain**
4. Scroll forward to ~30 % (Act II mid) — **observe petals**
5. Scroll forward to ~70 % (Act IV) — regression sanity check

## Assertions

### A1 — Act I: rain renders as distributed streaks, not one large cube
- **Expected after fix**: many thin, vertical ~0.005 × 0.4 streaks scattered across the frame (cylindrical field r=0.8–7.5 around camera). No single large pale-blue rectangular primitive.
- **Would look identical if broken**: NO — broken state showed a visible solid pale rectangle at origin dominating the café glass.
- **Pass criteria**: zero pale-blue rectangular primitives > 100 px on any axis; rain is visible as many fine vertical streaks.

### A2 — Act II: petals render as many small planes, not one giant plane
- **Expected after fix**: ~220 small double-sided pink planes (scale 0.06–0.12) distributed in x ∈ [−6, 6], y ∈ [0.5, 6], z ∈ [−5, 2]. Gentle drift from the `useFrame` wind.
- **Would look identical if broken**: NO — broken state showed a single pink ~4 × 4 world-unit plane occluding the silhouettes.
- **Pass criteria**: no single pink primitive covering > 15 % of the screen; many small pink petals visible across the frame.

### A3 — Act IV regression: detonation still works
- **Expected**: debris instances still render at expected positions (fix didn't touch Act IV, but sanity-check that the edit didn't break the scene orchestrator or shared utilities).
- **Pass criteria**: at ~70 %, frame is filled with hundreds of small orange debris instances, not a single huge cube.

## What makes this adversarial
The assertions are binary: either you see a single huge flat primitive (broken, as in prior recording) or you see many small distributed instances (fixed). There is no intermediate visual. The pre-fix screenshots already document what "broken" looks like, so this is a direct before/after comparison.
