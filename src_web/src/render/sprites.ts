import { TILE_SIZE } from "../config";
import type { ObjectState, ShotState } from "../types";

export type SpriteRect = { x: number; y: number; w: number; h: number };
export type ShotRenderSprite = SpriteRect & { rot?: 0 | 1 | 2 | 3 };
export type ObjectRenderSprite = SpriteRect & { flipX?: boolean };

const SHOT_ARROW_SPRITE = { x: 209, y: 50, w: 5, h: 13 };
const SHOT_TWIN_ARROW_SPRITE = { x: 210, y: 66, w: 12, h: 13 };
const SHOT_TRIPLE_FLAME_SPRITE = { x: 218, y: 54, w: 4, h: 10 };
const SHOT_BOOMERANG_SPRITE = { x: 209, y: 35, w: 5, h: 10 };
const SHOT_BOOMERANG_ALT_SPRITE = { x: 218, y: 37, w: 10, h: 5 };
const SHOT_SWORD_SPRITE = { x: 225, y: 48, w: 6, h: 16 };
const SHOT_DOUBLE_SWORD_SPRITE = { x: 226, y: 64, w: 13, h: 16 };
const SHOT_FIRE_ARROW_SPRITE = { x: 232, y: 49, w: 8, h: 14 };
const SHOT_ENEMY_DOT_SPRITE = { x: 22, y: 38, w: 4, h: 4 };
const SHOT_ENERGY_RAY_SPRITE = { x: 35, y: 35, w: 10, h: 10 };
const SHOT_BONE_1_SPRITE = { x: 50, y: 37, w: 12, h: 6 };
const SHOT_BONE_2_SPRITE = { x: 66, y: 35, w: 11, h: 11 };
const SHOT_BONE_3_SPRITE = { x: 85, y: 34, w: 6, h: 12 };
const SHOT_WHITE_EXPLOSION_SPRITE = { x: 99, y: 35, w: 9, h: 9 };
const SHOT_BIG_EXPLOSION_SPRITE = { x: 112, y: 120, w: 16, h: 16 };
const SHOT_ARROW_V_SPRITE = { x: 133, y: 34, w: 5, h: 14 };
const SHOT_ARROW_H_SPRITE = { x: 145, y: 38, w: 13, h: 5 };
const SHOT_ARROW_D_SPRITE = { x: 163, y: 35, w: 11, h: 11 };
const SHOT_AXE_SPRITE = { x: 177, y: 34, w: 13, h: 13 };
const SHOT_SCYTHE_SPRITE = { x: 48, y: 120, w: 16, h: 16 };
const BLOB_SPRITE = { x: 1, y: 17, w: 14, h: 14 };
const BAT_SPRITE = { x: 32, y: 16, w: 16, h: 11 };
const KNIGHT_SPRITE = { x: 64, y: 16, w: 16, h: 16 };
const CLOUD_SPRITE = { x: 113, y: 17, w: 14, h: 14 };
const BLUE_DEMON_SPRITE = { x: 144, y: 16, w: 16, h: 16 };
const SKELETON_SPRITE = { x: 176, y: 16, w: 16, h: 16 };
const DEMON_SPRITE = { x: 240, y: 17, w: 16, h: 15 };
const DEATH_GHOST_SPRITE = { x: 16, y: 136, w: 15, h: 16 };
const ZOMBIE_SPRITE = { x: 64, y: 136, w: 16, h: 16 };
const GHOST_SPRITE = { x: 16, y: 120, w: 16, h: 16 };
const YELLOW_THING_SPRITE = { x: 209, y: 2, w: 13, h: 13 };
const RED_THING_SPRITE = { x: 224, y: 1, w: 15, h: 14 };
const SORCERER_SPRITE = { x: 0, y: 120, w: 16, h: 16 };
const RED_DEATH_GHOST_SPRITE = { x: 32, y: 136, w: 15, h: 16 };
const FIRE_SPRITE = { x: 112, y: 104, w: 16, h: 16 };
const TERRAIN_SPRITE = { x: 240, y: 192, w: 16, h: 8 };
export const PRINCESS_SPRITE = { x: 0, y: 136, w: 16, h: 24 };
const WEAPON_CRYSTAL_SPRITE = { x: 0, y: 64, w: 16, h: 16 };
const POWER_CRYSTAL_SPRITE = { x: 0, y: 80, w: 16, h: 16 };
const BLOCK_TRANSPARENT_SPRITE = { x: 96, y: 144, w: 16, h: 16 };

const WEAPON_ANIM = [
  [0, 1, 0, 2],
  [3, 4, 3, 1],
  [5, 6, 5, 1],
  [7, 8, 7, 1],
  [9, 10, 9, 1],
  [11, 12, 11, 1]
] as const;
const PUP_ANIM = [
  [0, 1, 0, 2],
  [3, 4, 3, 5],
  [6, 7, 6, 8],
  [9, 10, 9, 11],
  [12, 13, 12, 14]
] as const;

export function getShotSprite(weapon: number): SpriteRect {
  switch (weapon) {
    case 23:
      return SHOT_ENEMY_DOT_SPRITE;
    case 24:
      return SHOT_ENERGY_RAY_SPRITE;
    case 25:
      return SHOT_BONE_1_SPRITE;
    case 28:
      return SHOT_WHITE_EXPLOSION_SPRITE;
    case 29:
      return SHOT_ARROW_V_SPRITE;
    case 30:
      return SHOT_ARROW_H_SPRITE;
    case 31:
      return SHOT_ARROW_D_SPRITE;
    case 32:
      return SHOT_AXE_SPRITE;
    case 33:
      return SHOT_SCYTHE_SPRITE;
    case 2:
    case 7:
      return SHOT_TWIN_ARROW_SPRITE;
    case 3:
    case 8:
      return SHOT_TRIPLE_FLAME_SPRITE;
    case 4:
    case 9:
      return SHOT_BOOMERANG_SPRITE;
    case 5:
      return SHOT_SWORD_SPRITE;
    case 10:
      return SHOT_DOUBLE_SWORD_SPRITE;
    case 6:
    case 11:
      return SHOT_FIRE_ARROW_SPRITE;
    default:
      return SHOT_ARROW_SPRITE;
  }
}

export function getAnimatedShotSprite(shot: ShotState, timerTick = 0): ShotRenderSprite {
  const animTick = Math.floor(timerTick / 6);
  if (shot.weapon === 25) {
    const phase = Math.abs(Math.floor(shot.gpr1)) % 4;
    if (phase === 3) return { ...SHOT_BONE_2_SPRITE, rot: 2 };
    if (phase === 2) return SHOT_BONE_3_SPRITE;
    if (phase === 1) return SHOT_BONE_2_SPRITE;
    return SHOT_BONE_1_SPRITE;
  }
  if (shot.weapon === 28) {
    if (shot.vx === 0 && shot.vy === 0) {
      if (Math.abs(Math.floor(shot.gpr1)) % 6 > 2) {
        return { ...SHOT_BIG_EXPLOSION_SPRITE, x: SHOT_BIG_EXPLOSION_SPRITE.x + TILE_SIZE * 2 };
      }
      return SHOT_BIG_EXPLOSION_SPRITE;
    }
    return SHOT_WHITE_EXPLOSION_SPRITE;
  }
  if (shot.weapon === 32) {
    const phase = Math.abs(Math.floor(shot.gpr1)) % 8;
    // Source cadence (objects.inc):
    // mod 0/1 -> rot0, base tile
    // mod 2/3 -> rot1, base tile
    // mod 4/5 -> rot0, alt tile
    // mod 6/7 -> rot1, alt tile
    if (phase < 2) return { ...SHOT_AXE_SPRITE, rot: 0 };
    if (phase < 4) return { ...SHOT_AXE_SPRITE, rot: 1 };
    if (phase < 6) return { ...SHOT_AXE_SPRITE, x: SHOT_AXE_SPRITE.x + TILE_SIZE * 2, rot: 0 };
    return { ...SHOT_AXE_SPRITE, x: SHOT_AXE_SPRITE.x + TILE_SIZE * 2, rot: 1 };
  }
  if (shot.weapon === 33) {
    return { ...SHOT_SCYTHE_SPRITE, x: SHOT_SCYTHE_SPRITE.x + TILE_SIZE * 2 * (animTick % 4) };
  }
  if (shot.weapon === 4 || shot.weapon === 9) {
    // Source cadence (objects.inc animate_shots):
    // counter mod 12 -> 0: tile43 rot0, 3: tile44 rot0, 6: tile43 rot3, 9: tile44 rot3.
    const phase = Math.abs(Math.floor(shot.gpr1)) % 12;
    if (phase < 3) return { ...SHOT_BOOMERANG_SPRITE, rot: 0 };
    if (phase < 6) return { ...SHOT_BOOMERANG_ALT_SPRITE, rot: 0 };
    if (phase < 9) return { ...SHOT_BOOMERANG_SPRITE, rot: 3 };
    return { ...SHOT_BOOMERANG_ALT_SPRITE, rot: 3 };
  }
  return getShotSprite(shot.weapon);
}

export function getObjectSprite(id: number): SpriteRect {
  switch (id) {
    case 1:
      return BLOB_SPRITE;
    case 2:
    case 3:
    case 14:
      return BAT_SPRITE;
    case 4:
      return KNIGHT_SPRITE;
    case 5:
      return CLOUD_SPRITE;
    case 6:
      return BLUE_DEMON_SPRITE;
    case 7:
      return SKELETON_SPRITE;
    case 8:
      return DEMON_SPRITE;
    case 9:
      return DEATH_GHOST_SPRITE;
    case 10:
      return ZOMBIE_SPRITE;
    case 11:
      return GHOST_SPRITE;
    case 12:
      return YELLOW_THING_SPRITE;
    case 13:
      return RED_THING_SPRITE;
    case 15:
      return SORCERER_SPRITE;
    case 16:
      return RED_DEATH_GHOST_SPRITE;
    case 34:
      return FIRE_SPRITE;
    case 49:
      return TERRAIN_SPRITE;
    case 20:
      return WEAPON_CRYSTAL_SPRITE;
    case 21:
      return POWER_CRYSTAL_SPRITE;
    case 51:
      return PRINCESS_SPRITE;
    case 60:
      return BLOCK_TRANSPARENT_SPRITE;
    default:
      return BLOB_SPRITE;
  }
}

export function getAnimatedObjectSprite(object: ObjectState, timerTick: number, redDeathPulseTick: number): ObjectRenderSprite {
  const base = getObjectSprite(object.id);
  const animTick = Math.floor(timerTick / 6);
  const slowToggle = animTick % 6 > 2;
  let x = base.x;
  let y = base.y;
  let flipX = false;

  if (object.id >= 1 && object.id < 20) {
    switch (object.id) {
      case 11:
      case 12:
        break;
      case 4:
      case 8:
      case 9:
      case 10:
      case 15:
        // Original MMBasic uses sprite flip for these enemies instead of frame swap.
        flipX = slowToggle;
        break;
      case 16:
        if (redDeathPulseTick <= 0) {
          x = -10000;
        } else if (redDeathPulseTick > 32) {
          if (redDeathPulseTick % 2 === 1) x += TILE_SIZE * 2;
        } else if (redDeathPulseTick > 8) {
          x += TILE_SIZE * 2;
        } else if (redDeathPulseTick > 0) {
          if (redDeathPulseTick % 2 === 1) x += TILE_SIZE * 2;
        } else {
          x = -10000;
        }
        break;
      case 7:
        if (Math.abs(object.gpr3) <= 1 && slowToggle) x += TILE_SIZE * 2;
        break;
      default:
        if (slowToggle) x += TILE_SIZE * 2;
        break;
    }
  } else if (object.id === 20) {
    const frame = Math.floor(animTick / 2) % 4;
    const col = Math.max(0, Math.min(5, object.gpr2 - 2));
    x += (WEAPON_ANIM[col]?.[frame] ?? 0) * TILE_SIZE * 2;
  } else if (object.id === 21) {
    const frame = Math.floor(animTick / 2) % 4;
    const col = Math.max(0, Math.min(4, object.gpr2 - 2));
    x += (PUP_ANIM[col]?.[frame] ?? 0) * TILE_SIZE * 2;
  } else if (object.id === 34) {
    const fireAnim = [1, 0, 1, 0, 1, 0, 2, 1, 2, 1, 2, 1, 3, 2, 3, 2];
    const frame = Math.max(0, Math.min(fireAnim.length - 1, Math.floor(object.gpr1)));
    x += (fireAnim[frame] ?? 0) * TILE_SIZE * 2;
  } else if (object.id === 49) {
    const rise = Math.min(12, Math.max(0, Math.floor(object.gpr1)));
    y -= TILE_SIZE * rise;
    return { x, y, w: base.w, h: base.h + TILE_SIZE * rise, flipX };
  }

  return { x, y, w: base.w, h: base.h, flipX };
}
