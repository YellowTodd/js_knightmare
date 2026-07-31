import { GAME_VIEW_HEIGHT, SCREEN_WIDTH, TILE_SIZE } from "../config";
import type { GameState, ObjectState, ShotState } from "../types";

type MoveBossDeps = {
  stage7BaseLife: number;
  getBossSpriteForStage: (stage: number) => { x: number; y: number; w: number; h: number };
  spawnEnemyShot: (x: number, y: number, vx: number, vy: number, weapon?: number, gpr1?: number, gpr2?: number, gpr3?: number) => void;
  playSfx: (name: "terrain" | "helmet") => void;
  enqueueSpawnObject: (objId: number, x: number, y: number, extra: number) => void;
  moveBossEyes: (body: ObjectState) => void;
};

type BossFireDeps = {
  fireBossEyes: () => void;
  spawnEnemyShot: (x: number, y: number, vx: number, vy: number, weapon?: number, gpr1?: number, gpr2?: number, gpr3?: number) => void;
};

type SpawnBossDeps = {
  bossLifeByStage: (stage: number) => number;
  bossDifficultyByLevel: (difficulty: 0 | 1 | 2) => number;
  boss8EyeOffsets: ReadonlyArray<{ x: number; y: number }>;
  getBossSpriteForStage: (stage: number) => { x: number; y: number; w: number; h: number };
  allocObject: (id: number, x: number, y: number) => ObjectState | undefined;
  playBossMusic: (stage: number) => void;
  uiInGame: boolean;
};

type ActivateBossDeps = {
  uiInGame: boolean;
  playBossMusic: (stage: number) => void;
  enqueueSpawnObject: (delayTick: number, repeat: number, objId: number, x: number, y: number, extra: number) => void;
  leftDir: number;
  rightDir: number;
};

function collectBossEyeIndices(state: GameState): number[] {
  const indices: number[] = [];
  for (let i = 0; i < state.objects.length; i += 1) {
    const obj = state.objects[i];
    if (!obj || !obj.active) continue;
    if (obj.id === 50 && obj.gpr3 >= 900) {
      indices.push(i);
    }
  }
  return indices;
}

function spawnBossEyes(state: GameState, body: ObjectState, deps: SpawnBossDeps): void {
  const eyeLife = Math.max(1, Math.round(deps.bossLifeByStage(8) * deps.bossDifficultyByLevel(state.difficulty)));
  for (const [i, offset] of deps.boss8EyeOffsets.entries()) {
    const eye = deps.allocObject(50, body.x + offset.x, body.y + offset.y);
    if (!eye) continue;
    eye.life = eyeLife;
    eye.gpr1 = offset.x;
    eye.gpr2 = offset.y;
    eye.gpr3 = 900 + i;
  }
}

export function moveBossEyes(state: GameState, body: ObjectState): void {
  if (state.stage !== 8) return;
  for (const eyeIx of state.boss.eyeIndices) {
    const eye = state.objects[eyeIx];
    if (!eye || !eye.active) continue;
    eye.x = body.x + eye.gpr1;
    eye.y = body.y + eye.gpr2;
  }
}

export function spawnBoss(state: GameState, deps: SpawnBossDeps): void {
  if (state.boss.status > 0) return;
  const sprite = deps.getBossSpriteForStage(state.stage);
  const x = SCREEN_WIDTH / 2 - sprite.w / 2;
  const y = TILE_SIZE * 2;
  const body = deps.allocObject(50, x, y);
  if (!body) return;
  const baseLife = state.stage === 8 ? 6 : deps.bossLifeByStage(state.stage);
  body.life = Math.max(1, Math.round(baseLife * deps.bossDifficultyByLevel(state.difficulty)));

  const hitbox = deps.allocObject(60, x + sprite.w / 3, y + sprite.h / 3);
  if (!hitbox) return;
  hitbox.life = Math.max(1, Math.round(deps.bossLifeByStage(state.stage) * deps.bossDifficultyByLevel(state.difficulty)));
  hitbox.gpr1 = sprite.w / 3;
  hitbox.gpr2 = sprite.h / 3;
  hitbox.gpr3 = TILE_SIZE * 2;

  switch (state.stage) {
    case 1:
    case 8:
      body.gpr1 = x;
      body.gpr2 = x;
      hitbox.active = false;
      spawnBossEyes(state, body, deps);
      break;
    case 2:
    case 3:
    case 4:
      body.gpr1 = 45;
      body.gpr2 = 0;
      break;
    case 5:
      body.gpr1 = x;
      body.gpr2 = 0;
      break;
    case 6:
      body.gpr1 = x;
      body.gpr2 = x;
      break;
    case 7:
      body.x = SCREEN_WIDTH / 2 - TILE_SIZE;
      body.y = TILE_SIZE * 6;
      hitbox.gpr1 = 0;
      hitbox.gpr2 = 0;
      hitbox.gpr3 = TILE_SIZE * 2;
      break;
  }

  state.boss.status = 1;
  state.boss.animStage = state.stage === 3 ? 2 : 0;
  state.boss.bodyIndex = state.objects.indexOf(body);
  state.boss.hitboxIndex = state.objects.indexOf(hitbox);
  state.boss.eyeIndices = state.stage === 8 ? collectBossEyeIndices(state) : [];
  state.boss.life = body.life;
  state.boss.cleared = false;
  state.boss.tick = 0;
  state.boss.shieldActive = state.stage === 5;
  state.boss.nextFireTick = 0;
  if (deps.uiInGame) deps.playBossMusic(state.stage);
}

export function activateBoss(state: GameState, deps: ActivateBossDeps): void {
  if (state.boss.status !== 1) return;
  state.boss.status = 2;
  const hitbox = state.objects[state.boss.hitboxIndex];
  if (state.stage === 3 && hitbox) {
    state.boss.shieldActive = true;
    hitbox.active = false;
  }
  if (deps.uiInGame) deps.playBossMusic(state.stage);
  if (state.stage === 1) {
    deps.enqueueSpawnObject(180, 1, 5, 0, TILE_SIZE * 4, deps.rightDir);
    deps.enqueueSpawnObject(390, 1, 5, SCREEN_WIDTH - TILE_SIZE * 2, TILE_SIZE * 4, deps.leftDir);
    deps.enqueueSpawnObject(570, 1, 5, 0, TILE_SIZE * 4, deps.rightDir);
  } else if (state.stage === 7) {
    deps.enqueueSpawnObject(240, 1, 4, SCREEN_WIDTH / 2 - TILE_SIZE, TILE_SIZE * 5, 0);
    deps.enqueueSpawnObject(480, 1, 4, SCREEN_WIDTH / 2 - TILE_SIZE, TILE_SIZE * 5, 0);
  }
}

export function moveBoss(state: GameState, deltaSeconds: number, deps: MoveBossDeps): void {
  if (state.boss.status < 2) return;
  const body = state.objects[state.boss.bodyIndex];
  const hitbox = state.objects[state.boss.hitboxIndex];
  if (!body || !hitbox || !body.active) return;

  state.boss.tick += 1;
  const sprite = deps.getBossSpriteForStage(state.stage);
  const rightEdge = SCREEN_WIDTH - sprite.w - TILE_SIZE * 4;

  switch (state.stage) {
    case 1:
    case 8: {
      if (Math.floor(body.x) === Math.floor(body.gpr2)) {
        if (state.boss.tick % 150 === 0) {
          body.gpr2 = Math.min(Math.max(state.player.x - TILE_SIZE * 2, TILE_SIZE * 4), rightEdge);
        }
      } else {
        body.x += Math.sign(body.gpr2 - body.x) * 60 * deltaSeconds;
      }
      break;
    }
    case 2:
    case 3:
    case 4: {
      const speedX = state.stage === 2 ? 1.2 : 1.8;
      const speedY = state.stage === 2 ? 9 : 3.6;
      const movHeight = state.stage === 2 ? 6 : 12;
      const baseY = state.stage === 2 ? TILE_SIZE * 5 : TILE_SIZE * 6;
      const iniPos = (SCREEN_WIDTH - TILE_SIZE * 6) / 2;
      body.gpr1 += 60 * deltaSeconds * speedX;
      body.gpr2 += 60 * deltaSeconds * speedY;
      body.x = iniPos + (iniPos - TILE_SIZE * 4) * Math.sin((body.gpr1 * Math.PI) / 180);
      body.y = baseY + movHeight * Math.cos((body.gpr2 * Math.PI) / 180);
      if (state.stage === 3) {
        if (state.timerTick % 6 === 0) {
          const cycleTick = Math.floor(state.timerTick / 6) % 48;
          if (cycleTick === 0) {
            state.boss.shieldActive = true;
            hitbox.active = false;
          } else if (cycleTick === 24) {
            state.boss.shieldActive = false;
            hitbox.active = true;
          }
          if (cycleTick === 34) {
            const ox = body.x + TILE_SIZE * 2;
            const oy = body.y + TILE_SIZE * 2;
            const dx = state.player.x + TILE_SIZE - ox;
            const dy = state.player.y + TILE_SIZE - oy;
            const angle = Math.atan2(dx, -dy);
            for (let i = -60; i <= 60; i += 20) {
              const a = angle - (i * Math.PI) / 180;
              deps.spawnEnemyShot(ox, oy, Math.sin(a) * 110, -Math.cos(a) * 110, 28);
            }
          }
        }
      }
      break;
    }
    case 5: {
      if (state.boss.tick % 200 === 0) {
        body.gpr2 = body.x > state.player.x ? -120 : 120;
        if (body.x <= TILE_SIZE * 4 && body.gpr2 < 0) body.gpr2 = -body.gpr2;
        if (body.x >= rightEdge && body.gpr2 > 0) body.gpr2 = -body.gpr2;
        body.gpr3 = 0;
        state.boss.shieldActive = true;
      }
      if (body.gpr3 === 0 && state.boss.tick % 300 === 0) {
        body.gpr3 = -1;
        state.boss.shieldActive = false;
        deps.playSfx("helmet");
      }
      if (body.gpr2 !== 0) {
        const dir = body.gpr2 < 0 ? -1 : 1;
        body.gpr2 -= dir;
        body.x += dir * 60 * deltaSeconds;
        body.x = Math.min(Math.max(body.x, TILE_SIZE * 4), rightEdge);
      }
      break;
    }
    case 6: {
      if (Math.floor(body.x) === Math.floor(body.gpr2)) {
        if (state.boss.tick % 300 === 0) {
          deps.playSfx("terrain");
          deps.enqueueSpawnObject(49, body.x + TILE_SIZE * 2, body.y + TILE_SIZE * 6, 0);
          let dir = body.x > state.player.x ? -1 : 1;
          if (Math.floor(body.x) <= TILE_SIZE * 4) dir = 1;
          if (Math.floor(body.x) >= rightEdge) dir = -1;
          body.gpr2 = Math.min(Math.max(body.x + TILE_SIZE * 9 * dir, TILE_SIZE * 4), rightEdge);
        }
      } else {
        body.x += Math.sign(body.gpr2 - body.x) * 60 * deltaSeconds;
      }
      break;
    }
    case 7: {
      const speed = 30 + (deps.stage7BaseLife - body.life);
      if (body.gpr2 === 0 || state.boss.tick % 200 === 0 || body.x < TILE_SIZE * 4 || body.x > SCREEN_WIDTH - TILE_SIZE * 6) {
        body.gpr2 = Math.random() * 360;
      }
      body.x += Math.cos((body.gpr2 * Math.PI) / 180) * speed * deltaSeconds;
      body.y += Math.sin((body.gpr2 * Math.PI) / 180) * speed * deltaSeconds;
      if (body.y > GAME_VIEW_HEIGHT + 1) {
        body.x = SCREEN_WIDTH / 2 - TILE_SIZE;
        body.y = TILE_SIZE * 5;
      }
      break;
    }
  }

  if (hitbox.active) {
    hitbox.x = body.x + hitbox.gpr1;
    hitbox.y = body.y + hitbox.gpr2;
  }
  deps.moveBossEyes(body);
}

export function bossFire(state: GameState, deps: BossFireDeps): void {
  if (state.boss.status < 2) return;
  const body = state.objects[state.boss.bodyIndex];
  if (!body || !body.active) return;
  const tick = state.timerTick;
  let delay = 120;
  switch (state.stage) {
    case 1:
      delay = 70;
      break;
    case 2:
    case 4:
      delay = 120;
      break;
    case 3:
      return;
    case 5:
      delay = 70;
      break;
    case 6:
      delay = 70;
      break;
    case 7:
      delay = 70;
      break;
    case 8:
      deps.fireBossEyes();
      return;
  }
  if (tick % delay !== 0) return;

  const dx = state.player.x + TILE_SIZE - (body.x + TILE_SIZE * 2);
  const dy = state.player.y + TILE_SIZE - (body.y + TILE_SIZE * 2);
  const len = Math.hypot(dx, dy) || 1;
  const ox = body.x + TILE_SIZE * 2;
  const oy = body.y + TILE_SIZE * 2;
  if (state.stage === 2) {
    deps.spawnEnemyShot(ox, oy, 0, 0, 33, ox, body.y + TILE_SIZE * 8, 0);
    return;
  }
  if (state.stage === 4 || state.stage === 6) {
    deps.spawnEnemyShot(ox, oy, (dx / len) * 110, (dy / len) * 110, 28);
    return;
  }
  if (state.stage === 5) {
    const leftX = body.x - TILE_SIZE;
    const rightX = body.x + TILE_SIZE * 5;
    deps.spawnEnemyShot(leftX, oy, 0, 100, 32);
    deps.spawnEnemyShot(rightX, oy, 0, 100, 32);
    return;
  }
  deps.spawnEnemyShot(ox, oy, (dx / len) * 110, (dy / len) * 110);
}

export function fireBossEyes(state: GameState, isBossEyeOpen: (index: number, eye: ObjectState) => boolean, spawnEnemyShot: (x: number, y: number, vx: number, vy: number) => void): void {
  for (const [i, eyeIx] of state.boss.eyeIndices.entries()) {
    const eye = state.objects[eyeIx];
    if (!eye || !eye.active || eye.life <= 0) continue;
    if (!isBossEyeOpen(i, eye)) continue;
    // Original MMBasic boss.inc:
    // i=2..7 (eyes), fire_rate = 130 + 10*i, with eye #2 using fire_rate/4.
    // Here i=0..5 maps to source eyeId=2..7.
    const eyeId = i + 2;
    let fireRate = 130 + 10 * eyeId;
    if (eyeId === 2) fireRate = Math.floor(fireRate / 4);
    if (state.timerTick % fireRate !== 0) continue;
    const dx = state.player.x + TILE_SIZE - (eye.x + TILE_SIZE);
    const dy = state.player.y + TILE_SIZE - (eye.y + TILE_SIZE);
    const len = Math.hypot(dx, dy) || 1;
    spawnEnemyShot(eye.x + TILE_SIZE, eye.y + TILE_SIZE, (dx / len) * 105, (dy / len) * 105);
  }
}

type BossHitDeps = {
  bossLifeByStage: (stage: number) => number;
  isSuperWeapon: (weapon: number) => boolean;
  isBossEyeOpen: (index: number, eye: ObjectState) => boolean;
  playSfx: (name: "boss_shield" | "boss_hit") => void;
  addScore: (points: number) => void;
  enqueueReplaceBossSkin: (skinOffset: number) => void;
  startBossDeathSequence: () => void;
};

function isBossShieldBlocking(state: GameState): boolean {
  if (!state.boss.shieldActive) return false;
  if (state.stage === 3) return true;
  if (state.stage === 5) return true;
  return false;
}

function hitBossEye(state: GameState, eye: ObjectState, shot: ShotState | undefined, eyeIndex: number, deps: BossHitDeps): void {
  const body = state.objects[state.boss.bodyIndex];
  if (!body || !body.active) return;
  if (!deps.isBossEyeOpen(eyeIndex, eye)) return;
  const damage = shot && deps.isSuperWeapon(shot.weapon) ? 2 : 1;
  eye.life -= damage;
  if (eye.life > 0) {
    deps.playSfx("boss_hit");
    return;
  }
  eye.life = 0;
  eye.active = false;
  body.life -= 1;
  state.boss.life = body.life;
  if (body.life > 0) return;

  state.boss.cleared = true;
  deps.addScore(10000);
  deps.startBossDeathSequence();
}

export function hitBossObject(state: GameState, object: ObjectState, shot: ShotState | undefined, deps: BossHitDeps): void {
  if (state.boss.status < 2) return;
  const body = state.objects[state.boss.bodyIndex];
  const hitbox = state.objects[state.boss.hitboxIndex];
  if (!body || !hitbox || !body.active) return;
  const target = object.id === 60 ? object : hitbox;
  const objectIndex = state.objects.indexOf(object);
  const eyeIndex = state.stage === 8 ? state.boss.eyeIndices.indexOf(objectIndex) : -1;
  const isEye = eyeIndex >= 0;
  if (state.stage === 8) {
    if (!isEye) return;
    hitBossEye(state, object, shot, eyeIndex, deps);
    return;
  }

  if (isBossShieldBlocking(state)) {
    deps.playSfx("boss_shield");
    return;
  }

  const damage = shot && deps.isSuperWeapon(shot.weapon) ? 2 : 1;
  target.life -= damage;
  if ((state.stage === 2 || state.stage === 4 || state.stage === 3) && target.life > 0) {
    const aux = Math.max(1, Math.floor((deps.bossLifeByStage(state.stage) ?? 20) / 3));
    if ((state.stage === 2 || state.stage === 4) && target.life % aux === 0) {
      const skinOffset = Math.floor(target.life / aux) <= 1 ? TILE_SIZE * 10 : TILE_SIZE * 5;
      deps.enqueueReplaceBossSkin(skinOffset);
    }
    if (state.stage === 3 && (target.life === aux || target.life === aux * 2)) {
      state.boss.animStage = Math.min(4, state.boss.animStage + 1);
    }
  }
  if (target.life > 0) {
    deps.playSfx("boss_hit");
    return;
  }

  body.life -= 1;
  target.life = Math.max(1, (deps.bossLifeByStage(state.stage) ?? 20) / 3);
  state.boss.life = body.life;
  if (body.life > 0) return;

  state.boss.cleared = true;
  deps.addScore(10000);
  deps.startBossDeathSequence();
}
