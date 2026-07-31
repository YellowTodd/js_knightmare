# TypeScript Port (WIP)

This is a staged port of the MMBasic version in `src/km.bas`.

## Current scope

- Loads original binary map files from `src/maps/*.map`
- Uses original tilesets from `src/tiles/*.png`
- Implements a fixed 120Hz game tick
- Implements map scrolling and player movement/collision baseline
- Implements player firing with cooldown and shot updates
- Includes weapon-dependent shot patterns (1-11 baseline behavior)
- Spawns and updates enemies `1..16` plus crystals/blocks during map scroll
- Implements collisions (`player <-> objects/blocks/enemy shots`, `shot <-> enemy/blocks`)
- Adds enemy projectile baseline and shield collision handling
- Adds temporary power-up timer and shield durability state
- Adds crystal property cycling and pickup rules aligned to `power_ups.inc`
- Adds block system baseline (`id 22`): hit count, rewards, freeze, clear effects
- Adds stage clear and game over state flow with transitions between stages
- Adds expanded enemy fire patterns (targeted, spread, radial baseline by enemy type)
- Adds boss baseline flow: row triggers, spawn/activate, hitbox damage, defeat -> stage clear
- Adds stage-dependent boss movement/fire/shield behavior baseline (stages 1-8)
- Adds stage 8 multi-eye boss behavior baseline (eye spawn, per-eye fire, eye-based defeat)
- Adds intro/menu/stage-ready UI flow state machine integrated with gameplay loop
- Adds SFX event baseline (`shot`, `hit`, `death`, `crystal`, `boss`) and ending screen flow
- Adds BGM controller baseline with UI/stage/boss/ending transition hooks
- Adds stage 9 final cutscene baseline (princess spawn, portal auto-move, ending transition)
- Adds menu options for difficulty/start stage and wires them into gameplay difficulty scaling

## Run

```bash
npm install
npm run dev
```

## Next port targets

1. Boss per-stage unique mechanics full parity (`boss.inc` detailed behavior and helpers)
2. Menu/intro/cutscene full parity with original
3. Audio parity (MOD playback compatibility and precise timing/loop parity)
4. Action queue parity for delayed scripted events
5. Pixel-perfect tuning against original timings and collision boxes
