import { PLAYER_INIT_COL, PLAYER_INIT_ROW, PLAYER_INIT_SPEED, TILE_SIZE } from "./config";

export type PlayerState = {
  x: number;
  y: number;
  speed: number;
  powerUp: number;
  weapon: number;
  lives: number;
  shieldHits: number;
};

export type ShotState = {
  active: boolean;
  weapon: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  gpr1: number;
  gpr2: number;
  gpr3: number;
};

export type ObjectState = {
  active: boolean;
  id: number;
  x: number;
  y: number;
  life: number;
  gpr1: number;
  gpr2: number;
  gpr3: number;
};

export type GameState = {
  difficulty: 0 | 1 | 2; // 0 easy, 1 normal, 2 hard
  stage: number;
  map: Uint16Array;
  mapScrollRow: number;
  tilePx: number;
  timerTick: number;
  phase: "playing" | "player_dead" | "stage_clear" | "game_over" | "final_cutscene";
  phaseTimer: number;
  score: number;
  hiscore: number;
  lastPlayerShotMs: number;
  fireDown: boolean;
  powerUpTimer: number;
  freezeTimer: number;
  player: PlayerState;
  shots: ShotState[];
  enemyShots: ShotState[];
  objects: ObjectState[];
  blocks: ObjectState[];
  actionQueue: Array<{
    active: boolean;
    action:
      | "spawn_object"
      | "spawn_enemy_shot"
      | "set_phase"
      | "clear_enemy_shots"
      | "kill_all_enemies"
      | "move_to_portal"
      | "replace_boss_skin"
      | "spawn_shield"
      | "boss_blink"
      | "replace_block";
    executeAtTick: number;
    intervalTick: number;
    repeat: number;
    p1: number;
    p2: number;
    p3: number;
    p4: number;
  }>;
  boss: {
    status: number; // 0 none, 1 waiting, 2 active
    animStage: number;
    bodyIndex: number;
    hitboxIndex: number;
    eyeIndices: number[];
    life: number;
    cleared: boolean;
    tick: number;
    shieldActive: boolean;
    nextFireTick: number;
  };
};

export const createInitialPlayer = (): PlayerState => ({
  x: PLAYER_INIT_COL * TILE_SIZE,
  y: PLAYER_INIT_ROW * TILE_SIZE,
  speed: PLAYER_INIT_SPEED,
  powerUp: 0,
  weapon: 1,
  lives: 2,
  shieldHits: 0
});
