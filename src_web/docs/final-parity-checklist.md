# Knightmare TS Port: Final 1:1 Parity Checklist

## 1. Boss Detail Parity (Stage 3/6/8)

- [x] Stage 3 wing/shield cycle uses animation cadence (`g_anim_tick` equivalent: every 6 ticks).
- [x] Stage 3 hitbox/shield toggle points aligned (`cycle 0/24`), and mid-cycle fire point aligned (`34`).
- [x] Stage 6 boss render frame cadence aligned to animation tick cadence.
- [x] Stage 8 body animation cadence aligned to animation tick cadence.
- [x] Stage 8 eye fire cadence aligned to global timer cadence (`g_timer` equivalent).
- [x] Stage 8 first-eye rapid-fire cadence corrected (fast eye + slower side eyes).

## 2. Special Enemy / Special Shot Micro Timing

- [x] Red Death pulse timing moved to animation-step cadence instead of frame cadence.
- [x] Red Death SFX cadence aligned to animation timer rhythm.
- [x] Boomerang frame cycle speed aligned to `animate_shots()` style cadence.
- [ ] Remaining non-dot special enemy shot visual forms (bone/axe/scythe/explosion) are still simplified in TS and need full sprite+behavior parity.

## 3. Menu / Screen Pixel-Level Tuning (including HUD split)

- [x] Menu credits split into original two lines (`MMBASIC VERSION BY` / `LEONARDO BERARDINO 2025`).
- [x] Menu text row baselines retuned to original row spacing (`START`, `DIFFICULTY`, `STAGE`, `QUIT`).
- [x] Menu cursor Y stepping aligned to original 16px row step.
- [x] Start blink duration retuned to original-length feel (longer blink window).
- [ ] Final visual pixel match still needs side-by-side capture comparison for browser scaling differences.

## 4. INC-Unit Regression + Stage 1~9 Playthrough

### Automated regression executed
- [x] `npm run check`
- [x] `npm run build`

### Manual playthrough checklist (to verify in runtime)
- [ ] Stage 1: boss entry, cloud spawn queue, death/respawn flow
- [ ] Stage 2: boss skin replacement timing at HP thresholds
- [ ] Stage 3: shield/hitbox switch and wing frame alternation
- [ ] Stage 4: boss skin replacement timing and projectile cadence
- [ ] Stage 5: helmet open/close window + shield blocking timing
- [ ] Stage 6: terrain open timing + boss movement target updates
- [ ] Stage 7: boss movement vector changes + flip frame cadence
- [ ] Stage 8: eye open/close cadence + per-eye fire cadence + last-eye flow
- [ ] Stage 9: final sequence and portal/princess flow

