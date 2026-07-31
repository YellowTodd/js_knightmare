# Knightmare 1:1 Port Checklist

Last updated: 2026-02-18

## 1) Boss parity (priority: high)
- [x] Stage 3 shield/vulnerable 48-tick cycle and timed fire
- [x] Stage 5 helmet open/close timing baseline (200/300 tick) + shield SFX
- [x] Stage 5/6/7/8 boss sprite animation offsets baseline in render
- [x] Stage 6 terrain-opening action baseline (queue spawn + SFX)
- [x] Stage 8 eye open/close cadence baseline (render + fire gating)
- [x] Stage 8 eye fire-rate formula parity (`130+10*i`, first eye quarter-rate)
- [x] Stage 3 wing animation and hitbox visibility transitions
- [x] Stage 6 terrain-opening visual timing (8-tick step + hold/despawn window)
- [x] Stage 8 eye blink/fire micro-timing (open-state hit gating + tuned fire rates)

## 2) Special enemy / special shot timing (priority: high)
- [x] Player walk cycle
- [x] Base enemy frame toggles (most ids)
- [x] Boomerang frame switching baseline
- [x] Crystal animation table baseline
- [x] Ghost / red-death special timing parity
- [x] Red-death pulse baseline tied to player fire + SFX cadence
- [~] Enemy special shots (bone/axe/scythe/explosion) full frame parity
  - Current: bone/axe/explosion counters restored to source-like 6-tick animation cadence; axe 8-phase tile/rot sequence aligned; boomerang 12-phase frame/rot cycle aligned; scythe frame cycle tied to `g_anim_tick`-equivalent.
  - Remaining: side-by-side capture verification for all 4 special shots.

## 3) Menu / layout pixel parity (priority: high)
- [x] Intro slide-in baseline
- [x] Menu panel/cursor sprite baseline
- [x] Remove non-original menu item (`SHOW INTRO` -> `QUIT`)
- [~] HUD and gameplay area separation
  - Current: separated with bottom HUD region
  - Current+: HUD label/value alignment tuned; SCORE/HISCORE right-aligned with `00` initial format.
  - Remaining: verify exact original vertical composition per scene
- [ ] Final pixel-tuning pass with side-by-side capture (menu/intro/stage HUD)

## 4) Source-level regression by inc file (priority: high)
- [x] `boss.inc`
- [~] `objects.inc`
- [~] `map.inc`
- [~] `collision.inc`
  - Current: player shot vs enemy shot cancel path added for breakable enemy shots (bone/scythe), matching source `hit_shot()` behavior; player touch on first 3 shot slots now clears boomerang as in source collision path.
- [~] `screen.inc`
  - Current: menu/intro coordinates now follow source `center_x/center_y` formulas; intro slide speed and hold timings aligned (200 px/s, 300ms + 2000ms).
  - Remaining: side-by-side pixel capture pass for final text/logo/cursor offsets.
- [x] `music.inc` (OGG-first playback with fallback)
- [x] `queue.inc`
- [ ] Final playthrough checklist:
  - [ ] Stage 1..9 clear with expected transitions
  - [ ] Boss kill -> portal -> next stage timing
  - [ ] Power-up expiry, shield degradation visuals
  - [ ] Game over / ending return flow

## Notes
- `src/music/*.mod` archived to `archive/music_mod_backup`.
- Runtime playback uses `src/music/*.ogg` first.
- `queue.inc` parity handled in TS action queue (`repeat/interval/delay`, boss blink, portal move, shield/object spawn, boss skin replace).
