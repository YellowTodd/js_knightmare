# Knightmare TS Port Manual Regression

Last updated: 2026-02-18

## Run setup
1. `cd web`
2. `npm install`
3. `npm run dev`
4. Start from stage 1, difficulty Normal.

## Stage-by-stage checks (1..9)
1. Stage intro appears, gameplay starts with no HUD overlap.
2. Map scroll and collision boundaries match original.
3. Mid-stage enemies spawn in expected lanes and timing windows.
4. Boss appears at stage end, boss BGM switches correctly.
5. Boss clear flow: blink/death -> portal -> next stage.

## Focus checks for current parity scope
1. Stage 3 boss:
- 48-tick shield/vulnerable cycle.
- Hitbox disabled during shielded half, enabled during vulnerable half.
- Wing frame changes only in vulnerable half.
2. Stage 6 boss:
- Terrain open action every 300 ticks at stop point.
- Terrain object rises in stepped timing, then holds and disappears.
3. Stage 8 boss:
- Eye open/close cadence per-eye.
- Eye shots fire only when eye is open.
- Closed eyes do not take damage.

## Common system checks
1. Player walk animation updates while moving.
2. Enemy sprite frame toggles are visible (not static single frame).
3. Red death pulse reacts to player fire timing.
4. Shield durability sprite changes at expected thresholds.
5. Power-up timer expiry restores base player state.

## End conditions
1. Stage 9 clear transitions to ending text/music.
2. Game over returns to menu correctly.
3. Menu restart path does not break BGM/SFX.

## Execution Log (2026-02-18)
Environment:
1. `npm run check` passed.
2. `npm run build` passed.

Stage 1..9 playthrough log:
1. Stage 1: Pending manual verification.
2. Stage 2: Pending manual verification.
3. Stage 3: Pending manual verification.
4. Stage 4: Pending manual verification.
5. Stage 5: Pending manual verification.
6. Stage 6: Pending manual verification.
7. Stage 7: Pending manual verification.
8. Stage 8: Pending manual verification.
9. Stage 9: Pending manual verification.

Final checklist run status:
1. Boss kill -> portal -> next stage timing: Pending manual verification.
2. Power-up expiry, shield degradation visuals: Pending manual verification.
3. Game over / ending return flow: Pending manual verification.
