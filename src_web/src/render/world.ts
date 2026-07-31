import { GAME_VIEW_HEIGHT, SCREEN_WIDTH, TILE_SIZE } from "../config";
import type { GameState, ObjectState, ShotState } from "../types";
import type { ObjectRenderSprite, ShotRenderSprite } from "./sprites";

const SHIELD_SPRITE = { x: 136, y: 48, w: 16, h: 7 };
const PLAYER_SPRITE = { x: 0, y: 0, w: TILE_SIZE * 2, h: TILE_SIZE * 2 };
const PLAYER_SKIN1_X_L = 0;
const PLAYER_SKIN1_X_R = TILE_SIZE * 2;
const BOSS_EYE_SPRITE = { x: 176, y: 128, w: 16, h: 16 };
const isQuestionBonus = (object: ObjectState): boolean => (object.id === 20 || object.id === 21) && object.gpr2 <= 2;
const isForegroundPickup = (object: ObjectState): boolean => (object.id === 20 || object.id === 21) && object.gpr2 > 2;

export function renderFinalPortal(
  ctx: CanvasRenderingContext2D,
  finalPortalActive: boolean,
  finalPortalX: number,
  finalPortalY: number
): void {
  if (!finalPortalActive) return;
  ctx.save();
  ctx.strokeStyle = "#7fd9ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(finalPortalX + TILE_SIZE, finalPortalY + TILE_SIZE * 2, TILE_SIZE * 1.6, TILE_SIZE * 1.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function renderObjects(
  ctx: CanvasRenderingContext2D,
  objectsTileset: HTMLImageElement,
  bossTileset: HTMLImageElement,
  objects: ObjectState[],
  stage: number,
  bossSpriteOffsetX: number,
  getAnimatedObjectSprite: (object: ObjectState) => ObjectRenderSprite,
  getBossSpriteForStage: (stage: number) => { x: number; y: number; w: number; h: number },
  getBossRenderAnimState: (body: ObjectState) => { xOffset: number; yOffset: number; flipX: boolean },
  getBossEyeRenderState: (index: number, eye: ObjectState) => { xOffset: number; yOffset: number; visible: boolean; flipX: boolean }
): void {
  // Layer 1: background terrain effect (id 49).
  // Render first so active entities do not get hidden under it.
  for (const object of objects) {
    if (!object.active || object.id !== 49) continue;
    renderObjectSprite(
      ctx,
      object,
      objectsTileset,
      bossTileset,
      stage,
      bossSpriteOffsetX,
      getAnimatedObjectSprite,
      getBossSpriteForStage,
      getBossRenderAnimState,
      getBossEyeRenderState
    );
  }

  // Layer 2: background bonus crystal forms ("?" group) under active entities.
  for (const object of objects) {
    if (!object.active || !isQuestionBonus(object)) continue;
    renderObjectSprite(
      ctx,
      object,
      objectsTileset,
      bossTileset,
      stage,
      bossSpriteOffsetX,
      getAnimatedObjectSprite,
      getBossSpriteForStage,
      getBossRenderAnimState,
      getBossEyeRenderState
    );
  }

  // Layer 3: all regular objects (enemies, boss, effects, etc.).
  for (const object of objects) {
    if (!object.active || object.id === 49 || isQuestionBonus(object) || isForegroundPickup(object)) continue;
    renderObjectSprite(
      ctx,
      object,
      objectsTileset,
      bossTileset,
      stage,
      bossSpriteOffsetX,
      getAnimatedObjectSprite,
      getBossSpriteForStage,
      getBossRenderAnimState,
      getBossEyeRenderState
    );
  }

  // Layer 4: foreground pickups (includes visible P power-up forms).
  for (const object of objects) {
    if (!object.active || !isForegroundPickup(object)) continue;
    renderObjectSprite(
      ctx,
      object,
      objectsTileset,
      bossTileset,
      stage,
      bossSpriteOffsetX,
      getAnimatedObjectSprite,
      getBossSpriteForStage,
      getBossRenderAnimState,
      getBossEyeRenderState
    );
  }
}

function renderObjectSprite(
  ctx: CanvasRenderingContext2D,
  object: ObjectState,
  objectsTileset: HTMLImageElement,
  bossTileset: HTMLImageElement,
  stage: number,
  bossSpriteOffsetX: number,
  getAnimatedObjectSprite: (object: ObjectState) => ObjectRenderSprite,
  getBossSpriteForStage: (stage: number) => { x: number; y: number; w: number; h: number },
  getBossRenderAnimState: (body: ObjectState) => { xOffset: number; yOffset: number; flipX: boolean },
  getBossEyeRenderState: (index: number, eye: ObjectState) => { xOffset: number; yOffset: number; visible: boolean; flipX: boolean }
): void {
  if (object.id === 60) return;
  if (object.id === 50) {
    if (object.gpr3 >= 900) {
      const eyeIndex = Math.max(0, Math.min(5, object.gpr3 - 900));
      const eyeAnim = getBossEyeRenderState(eyeIndex, object);
      if (!eyeAnim.visible) return;
      if (eyeAnim.flipX) {
        ctx.save();
        ctx.translate(object.x + BOSS_EYE_SPRITE.w, object.y);
        ctx.scale(-1, 1);
        ctx.drawImage(
          bossTileset,
          BOSS_EYE_SPRITE.x + eyeAnim.xOffset,
          BOSS_EYE_SPRITE.y + eyeAnim.yOffset,
          BOSS_EYE_SPRITE.w,
          BOSS_EYE_SPRITE.h,
          0,
          0,
          BOSS_EYE_SPRITE.w,
          BOSS_EYE_SPRITE.h
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          bossTileset,
          BOSS_EYE_SPRITE.x + eyeAnim.xOffset,
          BOSS_EYE_SPRITE.y + eyeAnim.yOffset,
          BOSS_EYE_SPRITE.w,
          BOSS_EYE_SPRITE.h,
          object.x,
          object.y,
          BOSS_EYE_SPRITE.w,
          BOSS_EYE_SPRITE.h
        );
      }
      return;
    }
    const bossSprite = getBossSpriteForStage(stage);
    const anim = getBossRenderAnimState(object);
    const sx = bossSprite.x + bossSpriteOffsetX + anim.xOffset;
    const sy = bossSprite.y + anim.yOffset;
    if (anim.flipX) {
      ctx.save();
      ctx.translate(object.x + bossSprite.w, object.y);
      ctx.scale(-1, 1);
      ctx.drawImage(bossTileset, sx, sy, bossSprite.w, bossSprite.h, 0, 0, bossSprite.w, bossSprite.h);
      ctx.restore();
    } else {
      ctx.drawImage(bossTileset, sx, sy, bossSprite.w, bossSprite.h, object.x, object.y, bossSprite.w, bossSprite.h);
    }
    return;
  }

  if (object.id === 49 && object.gpr1 > 16) {
    // Match original hold window behavior: terrain stays logically alive
    // but is not rendered until despawn.
    return;
  }

  const sprite = getAnimatedObjectSprite(object);
  const needFlip = (object.id === 11 && object.gpr3 < 0) || sprite.flipX === true;
  if (needFlip) {
    ctx.save();
    ctx.translate(object.x + sprite.w, object.y);
    ctx.scale(-1, 1);
    ctx.drawImage(objectsTileset, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, sprite.w, sprite.h);
    ctx.restore();
  } else {
    ctx.drawImage(objectsTileset, sprite.x, sprite.y, sprite.w, sprite.h, object.x, object.y, sprite.w, sprite.h);
  }
}

export function renderBlocks(
  ctx: CanvasRenderingContext2D,
  objectsTileset: HTMLImageElement,
  blocks: ObjectState[],
  getBlockSprite: (type: number, hits: number, maxHits: number) => { x: number; y: number; w: number; h: number }
): void {
  for (const block of blocks) {
    if (!block.active) continue;
    const sprite = getBlockSprite(block.gpr2, block.life, block.gpr3);
    ctx.drawImage(objectsTileset, sprite.x, sprite.y, sprite.w, sprite.h, block.x, block.y, sprite.w, sprite.h);
  }
}

export function renderShots(
  ctx: CanvasRenderingContext2D,
  objectsTileset: HTMLImageElement,
  shots: ShotState[],
  getAnimatedShotSprite: (shot: ShotState) => ShotRenderSprite
): void {
  for (const shot of shots) {
    if (!shot.active) continue;
    const sprite = getAnimatedShotSprite(shot);
    drawShot(ctx, objectsTileset, sprite, shot.x, shot.y);
  }
}

export function renderEnemyShots(
  ctx: CanvasRenderingContext2D,
  objectsTileset: HTMLImageElement,
  enemyShots: ShotState[],
  getAnimatedShotSprite: (shot: ShotState) => ShotRenderSprite
): void {
  for (const shot of enemyShots) {
    if (!shot.active) continue;
    const sprite = getAnimatedShotSprite(shot);
    drawShot(ctx, objectsTileset, sprite, shot.x, shot.y);
  }
}

function drawShot(ctx: CanvasRenderingContext2D, objectsTileset: HTMLImageElement, sprite: ShotRenderSprite, x: number, y: number): void {
  const rot = sprite.rot ?? 0;
  if (rot === 0) {
    ctx.drawImage(objectsTileset, sprite.x, sprite.y, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
    return;
  }
  ctx.save();
  ctx.translate(x + sprite.w / 2, y + sprite.h / 2);
  ctx.rotate((Math.PI / 2) * rot);
  ctx.drawImage(objectsTileset, sprite.x, sprite.y, sprite.w, sprite.h, -sprite.w / 2, -sprite.h / 2, sprite.w, sprite.h);
  ctx.restore();
}

export function renderShield(ctx: CanvasRenderingContext2D, objectsTileset: HTMLImageElement, state: GameState): void {
  if (state.player.shieldHits <= 0) return;
  let shieldX = SHIELD_SPRITE.x;
  if (state.player.shieldHits <= 10) {
    shieldX += TILE_SIZE * 4;
  } else if (state.player.shieldHits <= 20) {
    shieldX += TILE_SIZE * 2;
  }
  ctx.drawImage(
    objectsTileset,
    shieldX,
    SHIELD_SPRITE.y,
    SHIELD_SPRITE.w,
    SHIELD_SPRITE.h,
    state.player.x,
    state.player.y - TILE_SIZE,
    SHIELD_SPRITE.w,
    SHIELD_SPRITE.h
  );
}

export function renderPlayer(ctx: CanvasRenderingContext2D, objectsTileset: HTMLImageElement, state: GameState, playerAnimCounter: number): void {
  const deathAnim = [0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 14, 16, 18, 20, 22, 22, 22, 22, 22, 22];
  const isDeadAnim = state.phase === "player_dead" || state.phase === "game_over";
  const walkX = isDeadAnim ? PLAYER_SKIN1_X_R : playerAnimCounter % 10 < 5 ? PLAYER_SKIN1_X_L : PLAYER_SKIN1_X_R;
  let powerOffset = 0;
  if (isDeadAnim) {
    const deathIx = Math.max(0, Math.min(deathAnim.length - 1, Math.floor(playerAnimCounter)));
    powerOffset = (deathAnim[deathIx] ?? deathAnim[deathAnim.length - 1] ?? 0) * TILE_SIZE;
  } else if (state.player.powerUp > 1 && (state.powerUpTimer > 10 || state.powerUpTimer - Math.floor(state.powerUpTimer) > 0.5)) {
    powerOffset = TILE_SIZE * 2 * state.player.powerUp;
  }

  ctx.drawImage(
    objectsTileset,
    walkX + powerOffset,
    PLAYER_SPRITE.y,
    PLAYER_SPRITE.w,
    PLAYER_SPRITE.h,
    state.player.x,
    state.player.y,
    PLAYER_SPRITE.w,
    PLAYER_SPRITE.h
  );
}

export function beginGameClip(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, SCREEN_WIDTH, GAME_VIEW_HEIGHT);
  ctx.clip();
}

export function endGameClip(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}
