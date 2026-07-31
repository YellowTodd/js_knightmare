import {
  CANVAS_WIDTH,
  BLOB_SPEED_Y,
  CANVAS_HEIGHT,
  GAME_VIEW_HEIGHT,
  GAME_TICK_MS,
  HUD_HEIGHT,
  HUD_TOP,
  MAP_COLS,
  MAP_ROWS_0,
  PLAYER_INIT_COL,
  PLAYER_INIT_ROW,
  PLAYER_INIT_SPEED,
  PLAYER_MAX_SPEED,
  PLAYER_SHOT_SPEED_Y,
  SCREEN_HEIGHT,
  SCREEN_OFFSET,
  SCREEN_ROWS,
  SCREEN_WIDTH,
  SHOT_COOLDOWN_MS,
  TILE_SIZE
} from "./config";
import { AudioController } from "./audio";
import { MusicController } from "./music";
import { CTRL_DOWN, CTRL_FIRE, CTRL_LEFT, CTRL_RESTART, CTRL_RIGHT, CTRL_UP, Input } from "./input";
import { loadMapTileset, loadStageMap, mapCollide, renderMap } from "./map";
import { renderHud as drawHud, renderPhaseOverlay as drawPhaseOverlay, renderUiOverlay as drawUiOverlay } from "./render/ui";
import {
  beginGameClip,
  endGameClip,
  renderBlocks as drawBlocks,
  renderEnemyShots as drawEnemyShots,
  renderFinalPortal as drawFinalPortal,
  renderObjects as drawObjects,
  renderPlayer as drawPlayer,
  renderShield as drawShield,
  renderShots as drawShots
} from "./render/world";
import {
  getAnimatedObjectSprite as resolveAnimatedObjectSprite,
  getAnimatedShotSprite as resolveAnimatedShotSprite,
  getObjectSprite as resolveObjectSprite,
  PRINCESS_SPRITE,
  getShotSprite as resolveShotSprite
} from "./render/sprites";
import { processCollisions as runCollisionSystem } from "./systems/combat";
import {
  activateBoss as runActivateBoss,
  bossFire as runBossFire,
  fireBossEyes as runFireBossEyes,
  hitBossObject as runHitBossObject,
  moveBoss as runMoveBoss,
  moveBossEyes as runMoveBossEyes,
  spawnBoss as runSpawnBoss
} from "./systems/boss";
import { enemiesFire as runEnemiesFire } from "./systems/enemies";
import { spawnQueuedObject as runSpawnQueuedObject, spawnRowObjects as runSpawnRowObjects } from "./systems/spawn";
import { createInitialPlayer, type GameState, type ObjectState, type ShotState } from "./types";
import { createIntroState, updateIntroState, type IntroState } from "./ui/intro";
import { createMenuState, updateMenuState, type MenuState } from "./ui/menu";

const PLAYER_SPRITE = { x: 0, y: 0, w: TILE_SIZE * 2, h: TILE_SIZE * 2 };
const SHOT_ARROW_SPRITE = { x: 209, y: 50, w: 5, h: 13 };
const SHOT_TWIN_ARROW_SPRITE = { x: 210, y: 66, w: 12, h: 13 };
const SHOT_TRIPLE_FLAME_SPRITE = { x: 218, y: 54, w: 4, h: 10 };
const SHOT_BOOMERANG_SPRITE = { x: 209, y: 35, w: 5, h: 10 };
const SHOT_BOOMERANG_ALT_SPRITE = { x: 218, y: 37, w: 10, h: 5 };
const SHOT_SWORD_SPRITE = { x: 225, y: 48, w: 6, h: 16 };
const SHOT_DOUBLE_SWORD_SPRITE = { x: 226, y: 64, w: 13, h: 16 };
const SHOT_FIRE_ARROW_SPRITE = { x: 232, y: 49, w: 8, h: 14 };
const SHOT_ENEMY_DOT_SPRITE = { x: 22, y: 38, w: 4, h: 4 };
const SHIELD_SPRITE = { x: 136, y: 48, w: 16, h: 7 };
const BOSS_EYE_SPRITE = { x: 176, y: 128, w: 16, h: 16 };
const BLOCK_BASE_SPRITE = { x: 0, y: 104, w: 16, h: 16 };
const BLOCK_TRANSPARENT_SPRITE = { x: 96, y: 144, w: 16, h: 16 };
const BOSS_STAGE_SPRITE: Record<number, { x: number; y: number; w: number; h: number }> = {
  1: { x: 0, y: 0, w: 40, h: 40 },
  2: { x: 80, y: 0, w: 40, h: 40 },
  3: { x: 200, y: 0, w: 40, h: 40 },
  4: { x: 0, y: 80, w: 40, h: 48 },
  5: { x: 120, y: 80, w: 40, h: 48 },
  6: { x: 0, y: 128, w: 40, h: 48 },
  7: { x: 0, y: 56, w: 16, h: 16 },
  8: { x: 80, y: 128, w: 48, h: 48 }
};
const DEFAULT_BOSS_SPRITE = { x: 0, y: 0, w: 40, h: 40 };
const BOSS_LIFE = [0, 20, 48, 30, 48, 40, 40, 40, 24];
const BOSS_DIFFICULTY = [0.5, 1, 1.5] as const;
const SHOOT_CHANCE: Record<0 | 1 | 2, number[]> = {
  0: [0.3, 0.3, 0.4, 0.4, 0.5, 0.5, 0.6, 0.6, 0.6],
  1: [0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.8],
  2: [0.7, 0.7, 0.8, 0.8, 0.9, 0.9, 1, 1, 1]
};
const SHIELD_MAX_HITS = 30;
const BLOCK_HITS = 5;
const NEW_LIFE_POINTS = 100000;
const LEFT = -1;
const RIGHT = 1;
const PLAYER_SKIN1_X_L = 0;
const PLAYER_SKIN1_X_R = TILE_SIZE * 2;
const objectsTilesetUrl = "./tiles/objects.png";
const bossTilesetUrl = "./tiles/bosses.png";

export class KnightmareTsPort {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input = new Input();

  private state!: GameState;
  private mapTileset!: HTMLImageElement;
  private objectsTileset!: HTMLImageElement;
  private bossTileset!: HTMLImageElement;

  private lastFrame = 0;
  private tickAccumulator = 0;
  private restartDown = false;
  private readonly audio = new AudioController();
  private readonly music = new MusicController();
  private uiMode: "intro" | "menu" | "stage_ready" | "in_game" | "ending" = "intro";
  private uiTimer = 180;
  private introUi: IntroState = createIntroState(CANVAS_HEIGHT - 1, SCREEN_ROWS, TILE_SIZE);
  private menuUi: MenuState = createMenuState();
  private finalPortalActive = false;
  private finalPortalX = SCREEN_WIDTH / 2 - TILE_SIZE;
  private finalPortalY = TILE_SIZE;
  private controlLocked = false;
  private bossSpriteOffsetX = 0;
  private bossBlinkGray = false;
  private playerAnimCounter = 0;
  private playerMovedTick = false;
  private redDeathPulseTick = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;
  }

  async start(): Promise<void> {
    this.mapTileset = await loadMapTileset();
    this.objectsTileset = await this.loadObjectsTileset();
    this.bossTileset = await this.loadBossTileset();
    await this.startStage(1, {
      score: 0,
      hiscore: 0,
      player: createInitialPlayer(),
      difficulty: this.menuUi.selectedDifficulty
    });
    this.uiMode = "intro";
    this.uiTimer = 0;
    this.introUi = createIntroState(CANVAS_HEIGHT - 1, SCREEN_ROWS, TILE_SIZE);
    this.menuUi = createMenuState();

    this.lastFrame = performance.now();
    requestAnimationFrame(this.loop);
  }

  private readonly loop = (time: number): void => {
    const frameDt = Math.min(50, time - this.lastFrame);
    this.lastFrame = time;
    this.tickAccumulator += frameDt;

    while (this.tickAccumulator >= GAME_TICK_MS) {
      this.tickAccumulator -= GAME_TICK_MS;
      this.update(GAME_TICK_MS / 1000);
    }

    this.render();
    requestAnimationFrame(this.loop);
  };

  private async startStage(
    stage: number,
    carry?: { score: number; hiscore: number; player: ReturnType<typeof createInitialPlayer>; difficulty: 0 | 1 | 2; startRow?: number }
  ): Promise<void> {
    const map = await loadStageMap(stage);
    const player = carry ? { ...carry.player } : createInitialPlayer();
    const defaultStartRow = Math.max(0, MAP_ROWS_0 - SCREEN_ROWS - 2);
    const startRow = Math.max(0, Math.min(defaultStartRow, carry?.startRow ?? defaultStartRow));
    this.state = {
      difficulty: carry?.difficulty ?? this.menuUi.selectedDifficulty,
      stage,
      map,
      mapScrollRow: startRow,
      tilePx: 0,
      timerTick: 0,
      phase: "playing",
      phaseTimer: 0,
      score: carry?.score ?? 0,
      hiscore: carry?.hiscore ?? 0,
      lastPlayerShotMs: -SHOT_COOLDOWN_MS,
      fireDown: false,
      powerUpTimer: -1,
      freezeTimer: -1,
      player,
      shots: this.createShotPool(13),
      enemyShots: this.createShotPool(16),
      objects: this.createObjectPool(32),
      blocks: this.createObjectPool(16),
      actionQueue: this.createActionQueue(48),
      boss: {
        status: 0,
        animStage: 0,
        bodyIndex: -1,
        hitboxIndex: -1,
        eyeIndices: [],
        life: 0,
        cleared: false,
        tick: 0,
        shieldActive: false,
        nextFireTick: 0
      }
    };
    this.finalPortalActive = false;
    this.controlLocked = false;
    this.bossSpriteOffsetX = 0;
    this.bossBlinkGray = false;
    this.playerAnimCounter = 0;
    this.playerMovedTick = false;
    this.redDeathPulseTick = 0;
    this.seedInitialBlocks();
    if (stage === 9) {
      this.spawnPrincess();
    }
  }

  private update(deltaSeconds: number): void {
    this.state.timerTick += 1;
    const ctrl = this.input.read();

    if ((ctrl & CTRL_RESTART) !== 0) {
      if (!this.restartDown) {
        this.restartDown = true;
        this.uiMode = "menu";
        this.uiTimer = 0;
        void this.music.playUiSong("title");
      }
      return;
    }
    this.restartDown = false;

    if (this.uiMode !== "in_game") {
      this.updateUiMode(ctrl);
      return;
    }

    if (this.state.phase !== "playing") {
      this.updatePhaseState(deltaSeconds);
      return;
    }

    if (this.state.freezeTimer < 0 && this.state.mapScrollRow >= -1 && this.state.timerTick % 16 === 0) {
      this.scrollMap();
    }

    this.playerMovedTick = false;
    this.processInput(ctrl, deltaSeconds);
    this.updatePlayerAnimationTick();
    this.moveShots(deltaSeconds);
    this.moveEnemyShots(deltaSeconds);
    this.moveObjects(deltaSeconds);
    this.moveBlocks();
    this.moveBoss(deltaSeconds);
    if (this.state.timerTick % 250 === 0 && (this.state.stage > 1 || this.state.mapScrollRow < 125)) {
      this.enemiesFire();
    }
    this.bossFire();
    this.processPowerUpTimer();
    this.processFreezeTimer(deltaSeconds);
    if (this.state.timerTick % 6 === 0 && this.redDeathPulseTick > 0) {
      this.redDeathPulseTick += 1;
      if (this.redDeathPulseTick > 40) {
        this.redDeathPulseTick = 0;
      }
    }
    if (this.state.timerTick % 120 === 0 && this.hasActiveRedDeathGhost()) {
      void this.audio.playSfx("red_death");
    }
    this.processActionQueue();
    this.processCollisions();
  }

  private updateUiMode(ctrl: number): void {
    switch (this.uiMode) {
      case "intro": {
        const { next, enterMenu, latchFire } = updateIntroState(this.introUi, (ctrl & CTRL_FIRE) !== 0);
        this.introUi = next;
        if (enterMenu) this.enterMenu(latchFire);
        break;
      }
      case "menu": {
        const { next, action } = updateMenuState(this.menuUi, ctrl);
        this.menuUi = next;
        if (action === "start_campaign") {
          this.startCampaign();
        } else if (action === "back_to_intro") {
          this.music.stop();
          this.uiMode = "intro";
          this.introUi = createIntroState(CANVAS_HEIGHT - 1, SCREEN_ROWS, TILE_SIZE);
          this.uiTimer = 0;
        }
        break;
      }
      case "stage_ready":
        this.uiTimer -= 1;
        if (this.uiTimer <= 0 || (ctrl & CTRL_FIRE) !== 0) {
          this.uiMode = "in_game";
          if (this.state.boss.status >= 1) {
            void this.music.playBoss(this.state.stage);
          } else {
            void this.music.playStage(this.state.stage);
          }
        }
        break;
      case "ending":
        this.uiTimer -= 1;
        if (this.uiTimer <= 0 || (ctrl & CTRL_FIRE) !== 0) {
          this.uiMode = "menu";
          void this.music.playUiSong("title");
        }
        break;
    }
  }

  private startCampaign(): void {
    void this.startStage(this.menuUi.selectedStartStage, {
      score: 0,
      hiscore: this.state?.hiscore ?? 0,
      player: createInitialPlayer(),
      difficulty: this.menuUi.selectedDifficulty
    }).then(() => {
      this.uiMode = "stage_ready";
      this.uiTimer = 120;
      this.menuUi = { ...this.menuUi, latch: false };
      void this.music.playUiSong("stage_intro");
    });
  }

  private enterMenu(latchFire: boolean): void {
    this.uiMode = "menu";
    this.menuUi = { ...this.menuUi, item: 0, latch: latchFire, startBlinkTick: 0 };
    this.introUi = { ...this.introUi, stage: 2 };
    void this.music.playUiSong("title");
  }

  private updatePhaseState(deltaSeconds: number): void {
    if (this.state.phase === "final_cutscene") {
      this.updateFinalCutscene(deltaSeconds);
      return;
    }
    if ((this.state.phase === "player_dead" || this.state.phase === "game_over") && this.state.timerTick % 6 === 0) {
      this.playerAnimCounter += 0.5;
    }

    this.state.phaseTimer -= 1;
    if (this.state.phaseTimer > 0) return;

    if (this.state.phase === "player_dead") {
      const respawnPlayer = createInitialPlayer();
      respawnPlayer.lives = this.state.player.lives;
      const respawnRow = this.calculateStartRow(this.state.mapScrollRow);
      void this.startStage(this.state.stage, {
        score: this.state.score,
        hiscore: this.state.hiscore,
        player: respawnPlayer,
        difficulty: this.state.difficulty,
        startRow: respawnRow
      }).then(() => {
        this.controlLocked = false;
        this.uiMode = "stage_ready";
        this.uiTimer = 120;
        void this.music.playUiSong("stage_intro");
      });
      return;
    }

    if (this.state.phase === "stage_clear") {
      if (this.state.stage >= 9) {
        this.uiMode = "ending";
        this.uiTimer = 420;
        this.state.phase = "playing";
        void this.music.playUiSong("ending");
        return;
      }
      void this.startStage(this.state.stage + 1, {
        score: this.state.score,
        hiscore: this.state.hiscore,
        player: this.state.player,
        difficulty: this.state.difficulty
      }).then(() => {
        this.uiMode = "stage_ready";
        this.uiTimer = 120;
        void this.music.playUiSong("stage_intro");
      });
      return;
    }

    if (this.state.phase === "game_over") {
      this.uiMode = "menu";
      this.state.phase = "playing";
      void this.music.playUiSong("game_over");
    }
  }

  private updateFinalCutscene(deltaSeconds: number): void {
    const targetX = this.finalPortalX;
    const targetY = this.finalPortalY;
    const dx = targetX - this.state.player.x;
    const dy = targetY - this.state.player.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = PLAYER_INIT_SPEED * 1.5;

    this.state.player.x += (dx / len) * speed * deltaSeconds;
    this.state.player.y += (dy / len) * speed * deltaSeconds;

    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      this.state.player.x = targetX;
      this.state.player.y = targetY;
      this.finalPortalActive = false;
      this.state.phase = "stage_clear";
      this.state.phaseTimer = 120;
    }
  }

  private processInput(ctrl: number, deltaSeconds: number): void {
    if (this.controlLocked) return;
    const nowMs = this.state.timerTick * GAME_TICK_MS;

    if ((ctrl & CTRL_FIRE) !== 0) {
      if (!this.state.fireDown) {
        this.fire(nowMs);
      }
      this.state.fireDown = true;
    } else {
      this.state.fireDown = false;
    }

    const speed = this.state.player.powerUp === 4 ? PLAYER_MAX_SPEED : this.state.player.speed;
    const moveAmount = speed * deltaSeconds;

    if ((ctrl & CTRL_LEFT) !== 0) this.tryMovePlayer(-moveAmount, 0);
    if ((ctrl & CTRL_RIGHT) !== 0) this.tryMovePlayer(moveAmount, 0);
    if ((ctrl & CTRL_UP) !== 0) this.tryMovePlayer(0, -moveAmount);
    if ((ctrl & CTRL_DOWN) !== 0) this.tryMovePlayer(0, moveAmount);
  }

  private fire(nowMs: number): void {
    if (nowMs - this.state.lastPlayerShotMs < SHOT_COOLDOWN_MS || this.state.player.powerUp === 4) {
      return;
    }

    const weapon = this.state.player.weapon;
    if ((weapon === 3 || weapon === 8) && this.hasActiveCorePlayerShots()) {
      return;
    }

    let created = false;
    let sfxName: "shot" | "boomerang" | "sword" | "fire_arrow" | "flame" = "shot";
    const x = this.state.player.x + TILE_SIZE;
    const y = this.state.player.y - SHOT_ARROW_SPRITE.h - 1;

    switch (weapon) {
      case 2:
      case 7:
        created = this.spawnShot(weapon, x - SHOT_TWIN_ARROW_SPRITE.w / 2, y, 0, PLAYER_SHOT_SPEED_Y);
        break;
      case 3:
      case 8: {
        const speed = -200;
        const spread = weapon === 3 ? 50 : 0;
        const left = this.spawnShot(weapon, x - TILE_SIZE * 2, y, -spread, speed);
        const mid = this.spawnShot(weapon, x, y - TILE_SIZE, 0, speed);
        const right = this.spawnShot(weapon, x + TILE_SIZE * 2, y, spread, speed);
        created = left || mid || right;
        sfxName = "flame";
        break;
      }
      case 4:
      case 9:
        created = this.spawnShot(weapon, x, y, x - this.state.player.x, PLAYER_SHOT_SPEED_Y);
        sfxName = "boomerang";
        break;
      case 5:
      case 10:
        created = this.spawnShot(weapon, x - TILE_SIZE / 2, y, 0, -300);
        sfxName = "sword";
        break;
      case 6:
      case 11:
        created = this.spawnShot(weapon, x - SHOT_FIRE_ARROW_SPRITE.w / 2, y, 0, -260);
        sfxName = "fire_arrow";
        break;
      default:
        created = this.spawnShot(1, x, y, 0, PLAYER_SHOT_SPEED_Y);
        break;
    }

    if (created) {
      this.state.lastPlayerShotMs = nowMs;
      void this.audio.playSfx(sfxName);
      if (this.redDeathPulseTick <= 0) {
        this.redDeathPulseTick = 1;
      }
    }
  }

  private moveShots(deltaSeconds: number): void {
    for (const shot of this.state.shots) {
      if (!shot.active) continue;

      shot.age += deltaSeconds;
      if (this.state.timerTick % 6 === 0 && (shot.weapon === 4 || shot.weapon === 9)) {
        shot.gpr1 += 1;
      }

      switch (shot.weapon) {
        case 4:
        case 9:
          shot.x = this.state.player.x + shot.vx;
          shot.vy += 150 * deltaSeconds;
          shot.y += shot.vy * deltaSeconds;
          if (shot.y < 0) shot.y = 0;
          break;
        case 5:
        case 10:
          shot.y += shot.vy * deltaSeconds;
          if (shot.age > 0.22) {
            shot.active = false;
            continue;
          }
          break;
        default:
          shot.x += shot.vx * deltaSeconds;
          shot.y += shot.vy * deltaSeconds;
          break;
      }

      const sprite = this.getShotSprite(shot.weapon);
      if (shot.y < -sprite.h || shot.y > GAME_VIEW_HEIGHT + TILE_SIZE || shot.x < -TILE_SIZE || shot.x > SCREEN_WIDTH + TILE_SIZE) {
        shot.active = false;
      }
    }

    const shieldRect = this.getShieldRect();
    const playerRect = {
      x: this.state.player.x,
      y: this.state.player.y,
      w: PLAYER_SPRITE.w,
      h: PLAYER_SPRITE.h
    };
    for (const shot of this.state.enemyShots) {
      if (!shot.active) continue;
      const sprite = this.getAnimatedShotSprite(shot);
      const shotRect = { x: shot.x, y: shot.y, w: sprite.w, h: sprite.h };

      if (shieldRect && this.intersects(shotRect, shieldRect)) {
        this.hitShield(shot);
        continue;
      }
      if (this.intersects(shotRect, playerRect)) {
        shot.active = false;
        this.killPlayer();
        return;
      }
    }
  }

  private moveEnemyShots(deltaSeconds: number): void {
    for (let i = 0; i < this.state.enemyShots.length; i += 1) {
      const shot = this.state.enemyShots[i];
      if (!shot) continue;
      if (!shot.active) continue;
      shot.age += deltaSeconds;
      if (this.state.timerTick % 6 === 0) {
        if (shot.weapon === 25 || shot.weapon === 32) {
          shot.gpr1 += 1;
        }
      }

      if (shot.weapon === 28) {
        if (shot.gpr3 > 0 && shot.vy > 0 && shot.y >= shot.gpr3) {
          shot.vx = 0;
          shot.vy = 0;
          shot.gpr3 = 0;
          shot.gpr1 = 0;
        }
        if (shot.vx === 0 && shot.vy === 0 && this.state.timerTick % 6 === 0) {
          shot.gpr1 += 1;
          if (shot.gpr1 > 18) {
            shot.active = false;
            continue;
          }
        }
      } else if (shot.weapon === 33) {
        if (this.state.timerTick % 6 === 0) {
          shot.gpr3 += i % 2 === 0 ? -1 : 1;
          if (Math.abs(shot.gpr3) > 720) {
            shot.active = false;
            continue;
          }
        }
        const rad = (shot.gpr3 * Math.PI) / 180;
        shot.x = shot.gpr1 + TILE_SIZE * 7 * Math.sin(rad);
        shot.y = shot.gpr2 + TILE_SIZE * -7 * Math.cos(rad);
      }

      if (shot.weapon !== 33) {
        shot.x += shot.vx * deltaSeconds;
        shot.y += shot.vy * deltaSeconds;
      }

      const sprite = this.getAnimatedShotSprite(shot);
      if (shot.y < -sprite.h || shot.y > GAME_VIEW_HEIGHT + TILE_SIZE || shot.x < -TILE_SIZE || shot.x > SCREEN_WIDTH + TILE_SIZE) {
        shot.active = false;
      }
    }
  }

  private moveObjects(deltaSeconds: number): void {
    for (const object of this.state.objects) {
      if (!object.active) continue;
      if (this.state.freezeTimer >= 0 && object.id < 20) continue;

      switch (object.id) {
        case 1:
          object.y += BLOB_SPEED_Y * deltaSeconds;
          break;
        case 2:
        case 3:
        case 14:
          object.gpr1 += 120 * deltaSeconds;
          object.x += Math.sin((object.gpr1 * Math.PI) / 180) * 70 * deltaSeconds * object.gpr3 * (object.id === 3 ? 1.5 : 1);
          object.y += (object.id === 14 ? -35 : 65) * deltaSeconds;
          break;
        case 4:
          if (object.gpr3 === 0) {
            object.y += 40 * deltaSeconds;
            if (this.state.player.y - object.y < 55) {
              object.gpr3 = object.x > SCREEN_WIDTH / 2 ? -1 : 1;
              object.gpr2 = object.x;
            }
          } else {
            object.x += 40 * deltaSeconds * object.gpr3;
            if (Math.abs(object.x - object.gpr2) > 48) {
              object.gpr3 = 0;
            }
          }
          break;
        case 5:
          object.gpr1 += 130 * deltaSeconds;
          object.x += Math.sin((object.gpr1 * Math.PI) / 180) * 24 * deltaSeconds * object.gpr3;
          object.y += 20 * deltaSeconds;
          break;
        case 6:
          if (object.gpr3 === 0 && this.state.player.y - object.y < 55) {
            object.gpr3 = object.x > this.state.player.x ? -1 : 1;
          }
          object.x += 70 * deltaSeconds * object.gpr3;
          object.y += 70 * deltaSeconds;
          break;
        case 7:
          if (Math.abs(object.gpr3) > 1) {
            object.gpr1 += deltaSeconds;
            object.x += Math.sign(object.gpr3) * 120 * deltaSeconds;
            object.y += (object.gpr1 < 0.35 ? -50 : 90) * deltaSeconds;
            if (object.gpr1 > 1.2) {
              object.active = false;
            }
            break;
          }
          object.y += 15 * deltaSeconds;
          break;
        case 8: {
          if (object.gpr3 === 0) {
            const dir = object.x > this.state.player.x ? LEFT : RIGHT;
            object.gpr3 = dir;
          }
          object.x += 160 * deltaSeconds * object.gpr3;
          object.y += 160 * deltaSeconds;
          break;
        }
        case 9:
          object.gpr1 += 90 * deltaSeconds;
          object.x += Math.sin((object.gpr1 * Math.PI) / 180) * 65 * deltaSeconds * object.gpr3;
          object.y += 80 * deltaSeconds;
          break;
        case 10:
          if (Math.abs(object.gpr2) === 1000) {
            object.gpr1 += deltaSeconds;
            object.gpr3 += Math.sign(object.gpr2) * 280 * deltaSeconds;
            object.x += object.gpr3 * deltaSeconds;
            object.y += 65 * deltaSeconds;
            if (object.gpr1 > 1.4) {
              object.active = false;
            }
            break;
          }
          object.y += 25 * deltaSeconds;
          break;
        case 11:
          {
            const prevX = object.x;
            const span = SCREEN_WIDTH / 2 - TILE_SIZE * 2;
            const cosv = Math.cos((object.gpr1 * Math.PI) / 180);
            if (object.x <= SCREEN_WIDTH / 2) {
              object.x = span * -cosv;
            } else {
              object.x = (SCREEN_WIDTH - TILE_SIZE * 2) + span * -cosv;
            }
            object.gpr3 = object.x > prevX ? RIGHT : LEFT;
            if (object.x < 0) object.x = SCREEN_WIDTH - TILE_SIZE * 2;
            if (object.x > SCREEN_WIDTH - TILE_SIZE * 2) object.x = 0;
            object.gpr1 += 90 * deltaSeconds;
          }
          object.y += 31 * deltaSeconds;
          break;
        case 12: {
          const dx = this.state.player.x - object.x;
          const dy = this.state.player.y - object.y;
          const len = Math.hypot(dx, dy) || 1;
          object.x += (dx / len) * 120 * deltaSeconds;
          object.y += (dy / len) * 120 * deltaSeconds;
          break;
        }
        case 13:
          object.x += 140 * deltaSeconds * object.gpr3;
          object.y += 50 * deltaSeconds;
          if (object.x <= 0) object.gpr3 = RIGHT;
          if (object.x >= SCREEN_WIDTH - TILE_SIZE * 2) object.gpr3 = LEFT;
          break;
        case 15:
          object.y += 20 * deltaSeconds;
          break;
        case 16:
          object.x += object.gpr3 * deltaSeconds;
          object.y += 20 * deltaSeconds;
          break;
        case 34:
          if (this.state.timerTick % 6 === 0) {
            object.gpr1 += 1;
          }
          if (object.gpr1 > 15) {
            object.active = false;
          }
          break;
        case 49:
          if (this.state.timerTick % 6 === 0 && Math.floor(this.state.timerTick / 6) % 8 === 0) {
            object.gpr1 += 1;
          }
          if (object.gpr1 > 22) {
            object.active = false;
          }
          break;
        case 20:
        case 21:
          object.y += BLOB_SPEED_Y * deltaSeconds;
          break;
      }

      if (object.y > GAME_VIEW_HEIGHT + TILE_SIZE * 2) {
        object.active = false;
      }
    }
  }

  private moveBlocks(): void {
    for (const block of this.state.blocks) {
      if (!block.active) continue;
      if (block.y > GAME_VIEW_HEIGHT + TILE_SIZE * 2) {
        block.active = false;
      }
    }
  }

  private processCollisions(): void {
    runCollisionSystem(this.state, {
      controlLocked: this.controlLocked,
      playerRect: {
        x: this.state.player.x,
        y: this.state.player.y,
        w: PLAYER_SPRITE.w,
        h: PLAYER_SPRITE.h
      },
      blockRectSize: {
        w: BLOCK_BASE_SPRITE.w,
        h: BLOCK_BASE_SPRITE.h
      },
      getShotSprite: (weapon) => this.getShotSprite(weapon),
      getObjectRect: (object) => this.getObjectRect(object),
      isSuperWeapon: (weapon) => this.isSuperWeapon(weapon),
      collectBlockBonus: (block) => this.collectBlockBonus(block),
      hitPlayer: (object) => this.hitPlayer(object),
      hitBlock: (block) => this.hitBlock(block),
      hitObject: (shot, object) => this.hitObject(shot, object)
    });
  }

  private killPlayer(): void {
    if (this.state.phase !== "playing") return;
    this.state.player.lives -= 1;
    this.playerAnimCounter = 0;
    this.state.player.powerUp = 0;
    this.state.player.shieldHits = 0;
    this.state.powerUpTimer = -1;
    this.state.freezeTimer = -1;
    this.clearEnemyShots();
    this.controlLocked = true;

    if (this.state.player.lives < 0) {
      this.state.phase = "game_over";
      this.state.phaseTimer = 240;
    } else {
      this.state.phase = "player_dead";
      this.state.phaseTimer = 120;
    }
    void this.audio.playSfx("player_death");
  }

  private hitPlayer(object: ObjectState): void {
    if (object.id === 50 || object.id === 51) {
      return;
    }

    if (object.id === 20) {
      this.collectWeaponCrystal(object);
      object.active = false;
      return;
    }

    if (object.id === 21) {
      this.collectPowerCrystal(object);
      object.active = false;
      return;
    }
    if (object.id === 34) {
      return;
    }

    if (this.state.player.powerUp === 2) {
      return;
    }

    if (this.state.player.powerUp === 4) {
      this.hitObject(undefined, object);
      return;
    }

    this.killPlayer();
  }

  private hitObject(shot: ShotState | undefined, object: ObjectState): void {
    if (shot && !this.isSuperWeapon(shot.weapon)) {
      shot.active = false;
    }

    if (object.id === 20) {
      object.gpr2 = (object.gpr2 + 1) % 8;
      if (shot) void this.audio.playSfx("power_up_hit");
      return;
    }
    if (object.id === 21) {
      object.gpr2 = (object.gpr2 + 1) % 7;
      if (shot) void this.audio.playSfx("power_up_hit");
      return;
    }
    if (object.id >= 50) {
      this.hitBossObject(object, shot);
      return;
    }

    if (object.id === 7 && object.life > 1 && Math.abs(object.gpr3) === 1) {
      object.active = false;
      void this.audio.playSfx("split");
      this.spawnSkeletonSplit(object.x, object.y);
      return;
    }

    if (object.id === 10 && object.life > 1 && Math.abs(object.gpr2) !== 1000) {
      object.active = false;
      void this.audio.playSfx("split");
      this.spawnZombieSplit(object.x, object.y);
      return;
    }

    object.life -= 1;
    if (object.life <= 0) {
      if (object.id < 20) {
        this.startFireAnimation(object.x, object.y);
      }
      object.active = false;
      this.addScore(object.id < 20 ? 10 : 100);
      if (object.id < 20) void this.audio.playSfx("enemy_kill");
    }
  }

  private startFireAnimation(x: number, y: number): void {
    const fire = this.allocObject(34, x, y);
    if (!fire) return;
    fire.life = 1;
    fire.gpr1 = 0;
    fire.gpr2 = 0;
    fire.gpr3 = 0;
  }

  private spawnSkeletonSplit(x: number, y: number): void {
    const left = this.allocObject(7, x, y);
    if (left) {
      left.life = 1;
      left.gpr1 = 0;
      left.gpr2 = 0;
      left.gpr3 = LEFT * 2;
    }
    const right = this.allocObject(7, x, y);
    if (right) {
      right.life = 1;
      right.gpr1 = 0;
      right.gpr2 = 0;
      right.gpr3 = RIGHT * 2;
    }
  }

  private spawnZombieSplit(x: number, y: number): void {
    const left = this.allocObject(10, x, y);
    if (left) {
      left.life = 1;
      left.gpr1 = 0;
      left.gpr2 = -1000;
      left.gpr3 = 0;
    }
    const right = this.allocObject(10, x, y);
    if (right) {
      right.life = 1;
      right.gpr1 = 0;
      right.gpr2 = 1000;
      right.gpr3 = 0;
    }
  }

  private hitBossObject(object: ObjectState, shot: ShotState | undefined): void {
    runHitBossObject(this.state, object, shot, {
      bossLifeByStage: (stage) => BOSS_LIFE[stage] ?? 20,
      isSuperWeapon: (weapon) => this.isSuperWeapon(weapon),
      isBossEyeOpen: (index, eye) => this.isBossEyeOpen(index, eye),
      playSfx: (name) => {
        void this.audio.playSfx(name);
      },
      addScore: (points) => this.addScore(points),
      enqueueReplaceBossSkin: (skinOffset) => {
        this.enqueueAction("replace_boss_skin", 1, 1, 0, skinOffset);
      },
      startBossDeathSequence: () => this.startBossDeathSequence()
    });
  }

  private hitBlock(block: ObjectState): void {
    const maxHits = this.blockMaxHits(block);
    if (block.life >= maxHits) return;
    block.life += 1;
    if (block.life < maxHits) {
      void this.audio.playSfx("block_hit");
    } else {
      void this.audio.playSfx("block_open");
    }
    if (block.life >= maxHits && block.gpr2 === 5) {
      this.makeBlockSolidFromScreen(block.x, block.y);
    } else if (block.life >= maxHits && block.gpr2 === 7) {
      this.makeBridgeGroundFromScreen(block.x, block.y);
      block.active = false;
    }
  }

  private collectBlockBonus(block: ObjectState): void {
    const maxHits = this.blockMaxHits(block);
    if (block.life < maxHits) return;
    if (block.gpr2 > 4) return;

    switch (block.gpr2) {
      case 1:
        this.addScore(500);
        void this.audio.playSfx("points");
        break;
      case 2:
        this.enqueueAction("kill_all_enemies", 1);
        this.enqueueAction("clear_enemy_shots", 1);
        void this.audio.playSfx("kill_all_enemies");
        break;
      case 3:
        this.state.player.lives += 1;
        void this.audio.playSfx("new_life");
        break;
      case 4:
        this.state.freezeTimer = 10;
        this.enqueueAction("clear_enemy_shots", 1);
        break;
    }

    block.gpr2 = 6;
    block.life = maxHits;
    const blockIndex = this.state.blocks.indexOf(block);
    if (blockIndex >= 0) {
      this.enqueueAction("replace_block", 1, 1, 0, blockIndex);
    }
  }

  private blockMaxHits(block: ObjectState): number {
    if (block.gpr2 === 6) return 0;
    return block.gpr2 > 1 && block.gpr2 < 5 ? BLOCK_HITS * 2 : BLOCK_HITS;
  }

  private makeBlockSolidFromScreen(x: number, y: number): void {
    const cell = this.toMapCell(x, y);
    if (!cell) return;
    this.makeTileSolid(cell.row, cell.col, true);
    this.makeTileSolid(cell.row, cell.col + 1, true);
    this.makeTileSolid(cell.row + 1, cell.col, true);
    this.makeTileSolid(cell.row + 1, cell.col + 1, true);
  }

  private makeBridgeGroundFromScreen(x: number, y: number): void {
    const cell = this.toMapCell(x, y);
    if (!cell) return;
    let row = cell.row + 1;
    const col = cell.col - 1;
    for (let i = 0; i < 4; i += 1) {
      this.makeTileSolid(row, col, false);
      this.makeTileSolid(row, col + 1, false);
      this.makeTileSolid(row, col + 2, false);
      this.makeTileSolid(row, col + 3, false);
      row -= 1;
    }
  }

  private toMapCell(x: number, y: number): { row: number; col: number } | undefined {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor((y - this.state.tilePx) / TILE_SIZE) + this.state.mapScrollRow + 1;
    if (row < 0 || row >= MAP_ROWS_0 || col < 0 || col >= 31) return undefined;
    return { row, col };
  }

  private makeTileSolid(row: number, col: number, solid: boolean): void {
    if (row < 0 || col < 0 || row * 32 + col >= this.state.map.length) return;
    const ix = row * 32 + col;
    const value = this.state.map[ix] ?? 0;
    this.state.map[ix] = solid ? (value | 0x80) : (value & 0xff7f);
  }

  private addScore(points: number): void {
    const beforeBucket = Math.floor(this.state.score / NEW_LIFE_POINTS);
    this.state.score += points;
    if (this.state.score > this.state.hiscore) {
      this.state.hiscore = this.state.score;
    }
    const afterBucket = Math.floor(this.state.score / NEW_LIFE_POINTS);
    if (afterBucket > beforeBucket) {
      this.state.player.lives += afterBucket - beforeBucket;
      void this.audio.playSfx("new_life");
    }
  }

  private killAllEnemies(): void {
    for (const object of this.state.objects) {
      if (!object.active) continue;
      if (object.id > 0 && object.id < 20) {
        object.active = false;
        this.addScore(10);
      }
    }
  }

  private clearEnemyShots(): void {
    for (const shot of this.state.enemyShots) {
      shot.active = false;
    }
  }

  private collectWeaponCrystal(object: ObjectState): void {
    const weaponRank = object.gpr2;
    if (weaponRank <= 2) {
      this.addScore(1000);
      void this.audio.playSfx("points");
      return;
    }
    this.addScore(200);
    void this.audio.playSfx("crystal");
    const weapon = weaponRank - 1;
    if (weapon === 5 && this.state.player.speed < PLAYER_MAX_SPEED) {
      this.state.player.speed = Math.min(PLAYER_MAX_SPEED, this.state.player.speed + 20);
    }
    if (this.state.player.weapon === weapon || this.state.player.weapon === weapon + 5) {
      this.state.player.weapon = Math.min(11, weapon + 5);
    } else {
      this.state.player.weapon = weapon;
    }
  }

  private collectPowerCrystal(object: ObjectState): void {
    switch (object.gpr2) {
      case 0:
      case 1:
      case 2:
        this.addScore(1000);
        void this.audio.playSfx("points");
        break;
      case 3:
        this.state.player.speed = Math.min(PLAYER_MAX_SPEED, this.state.player.speed + 20);
        this.addScore(200);
        break;
      case 4:
        this.enqueueAction("spawn_shield", 1);
        this.addScore(200);
        break;
      case 5:
        this.state.player.powerUp = 2;
        this.state.powerUpTimer = 45;
        this.addScore(200);
        break;
      case 6:
        this.state.player.powerUp = 4;
        this.state.powerUpTimer = 45;
        this.addScore(200);
        break;
      default:
        this.addScore(200);
        break;
    }
    if (object.gpr2 >= 3) void this.audio.playSfx("crystal");
  }

  private hitShield(shot: ShotState): void {
    shot.active = false;
    if (this.state.player.shieldHits <= 0) return;
    let force = 1;
    if (shot.weapon === 32 || shot.weapon === 33) {
      force = 3;
    } else if (shot.weapon === 28 && shot.vx === 0 && shot.vy === 0) {
      force = 3;
    }
    this.state.player.shieldHits -= force;
    void this.audio.playSfx("shield");
    if (this.state.player.shieldHits <= 0) {
      this.state.player.shieldHits = 0;
      if (this.state.player.powerUp === 1) {
        this.state.player.powerUp = 0;
      }
    }
  }

  private spawnShield(): void {
    this.state.player.powerUp = 1;
    this.state.player.shieldHits = SHIELD_MAX_HITS;
  }

  private processPowerUpTimer(): void {
    if (this.state.powerUpTimer < 0) return;
    const before = this.state.powerUpTimer;
    this.state.powerUpTimer -= 0.025;
    if (before < 11) {
      const beforeWhole = Math.floor(before + 1e-6);
      const afterWhole = Math.floor(Math.max(this.state.powerUpTimer, -1) + 1e-6);
      if (beforeWhole > afterWhole && afterWhole >= 0) {
        void this.audio.playSfx("power_up_ending");
      }
    }
    if (this.state.powerUpTimer < 0) {
      this.state.player.powerUp = this.state.player.shieldHits > 0 ? 1 : 0;
      this.state.powerUpTimer = -1;
    }
  }

  private processFreezeTimer(deltaSeconds: number): void {
    if (this.state.freezeTimer < 0) return;
    const before = this.state.freezeTimer;
    this.state.freezeTimer -= deltaSeconds;
    const after = this.state.freezeTimer;
    let shouldPlayTick = false;
    if (Math.floor(before) > Math.floor(after)) {
      shouldPlayTick = true;
    }
    if (before < 4 && Math.floor(before * 2) > Math.floor(after * 2)) {
      shouldPlayTick = true;
    }
    if (shouldPlayTick) {
      void this.audio.playSfx("freeze_tick");
    }
    if (this.state.freezeTimer < 0) {
      this.state.freezeTimer = -1;
    }
  }

  private enqueueAction(
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
      | "replace_block",
    delayTick: number,
    repeat = 1,
    intervalTick = 0,
    p1 = 0,
    p2 = 0,
    p3 = 0,
    p4 = 0
  ): void {
    const slot = this.state.actionQueue.find((item) => !item.active);
    if (!slot) return;
    slot.active = true;
    slot.action = action;
    slot.executeAtTick = this.state.timerTick + delayTick;
    slot.intervalTick = intervalTick;
    slot.repeat = repeat;
    slot.p1 = p1;
    slot.p2 = p2;
    slot.p3 = p3;
    slot.p4 = p4;
  }

  private processActionQueue(): void {
    for (const item of this.state.actionQueue) {
      if (!item.active) continue;
      if (this.state.timerTick < item.executeAtTick) continue;

      switch (item.action) {
        case "spawn_object":
          this.spawnQueuedObject(item.p1, item.p2, item.p3, item.p4);
          break;
        case "spawn_enemy_shot":
          this.spawnEnemyShot(item.p1, item.p2, item.p3, item.p4);
          break;
        case "set_phase":
          this.setQueuedPhase(item.p1, item.p2);
          break;
        case "clear_enemy_shots":
          this.clearEnemyShots();
          break;
        case "kill_all_enemies":
          this.killAllEnemies();
          break;
        case "move_to_portal":
          this.startMoveToPortal();
          break;
        case "replace_boss_skin":
          this.bossSpriteOffsetX = item.p1;
          break;
        case "spawn_shield":
          this.spawnShield();
          break;
        case "boss_blink":
          this.bossBlinkGray = !this.bossBlinkGray;
          if (item.repeat <= 1) {
            this.finishBossDeathSequence();
          }
          break;
        case "replace_block":
          this.replaceBlock(item.p1);
          break;
      }

      item.repeat -= 1;
      if (item.repeat <= 0) {
        item.active = false;
      } else {
        item.executeAtTick += item.intervalTick;
      }
    }
  }

  private spawnQueuedObject(objId: number, x: number, y: number, extra: number): void {
    runSpawnQueuedObject(objId, x, y, extra, {
      allocObject: (id, ox, oy) => this.allocObject(id, ox, oy),
      spawnBlock: (bx, by, type) => this.spawnBlock(bx, by, type),
      getEnemyLife: (id) => this.getEnemyLife(id),
      playerX: this.state.player.x,
      playerY: this.state.player.y
    });
  }

  private setQueuedPhase(phaseCode: number, timer: number): void {
    if (phaseCode === 1) {
      this.state.phase = "stage_clear";
      this.state.phaseTimer = timer;
    } else if (phaseCode === 2) {
      this.state.phase = "game_over";
      this.state.phaseTimer = timer;
    }
  }

  private replaceBlock(blockIndex: number): void {
    const block = this.state.blocks[blockIndex];
    if (!block || !block.active) return;
    if (block.gpr2 === 6) {
      block.active = false;
    }
  }

  private startMoveToPortal(): void {
    this.finalPortalActive = true;
    this.state.phase = "final_cutscene";
    this.controlLocked = false;
    void this.music.playUiSong("stage_intro");
  }

  private clearActionQueue(): void {
    for (const item of this.state.actionQueue) {
      item.active = false;
      item.repeat = 0;
    }
  }

  private startBossDeathSequence(): void {
    this.controlLocked = true;
    this.clearActionQueue();
    this.clearEnemyShots();
    this.killAllEnemies();
    this.state.boss.status = 1;
    this.bossBlinkGray = false;
    this.enqueueAction("boss_blink", 1, 30, 3);
    void this.music.playUiSong("silence");
    void this.audio.playSfx("boss_kill");
  }

  private finishBossDeathSequence(): void {
    this.bossBlinkGray = false;
    const body = this.state.objects[this.state.boss.bodyIndex];
    const hitbox = this.state.objects[this.state.boss.hitboxIndex];
    if (body) body.active = false;
    if (hitbox) hitbox.active = false;
    for (const eyeIx of this.state.boss.eyeIndices) {
      const eye = this.state.objects[eyeIx];
      if (eye) eye.active = false;
    }
    this.state.boss.status = 0;
    this.enqueueAction("move_to_portal", 94);
  }

  private processBossRowTrigger(row: number): void {
    if (this.state.stage === 9) return;
    if (row === 7 && this.state.boss.status === 0) {
      this.spawnBoss();
      return;
    }
    if (row === 8) {
      this.killAllEnemies();
      this.clearEnemyShots();
    }
  }

  private spawnBoss(): void {
    this.bossSpriteOffsetX = 0;
    runSpawnBoss(this.state, {
      bossLifeByStage: (stage) => BOSS_LIFE[stage] ?? 20,
      bossDifficultyByLevel: (difficulty) => BOSS_DIFFICULTY[difficulty],
      boss8EyeOffsets: [
        { x: TILE_SIZE * 2, y: 0 },
        { x: 3, y: 6 },
        { x: TILE_SIZE * 3 + 5, y: 6 },
        { x: TILE_SIZE * 2, y: TILE_SIZE * 2 },
        { x: 3, y: TILE_SIZE * 2 + 6 },
        { x: TILE_SIZE * 3 + 5, y: TILE_SIZE * 2 + 6 }
      ],
      getBossSpriteForStage: (stage) => this.getBossSpriteForStage(stage),
      allocObject: (id, x, y) => this.allocObject(id, x, y),
      playBossMusic: (stage) => {
        void this.music.playBoss(stage);
      },
      uiInGame: this.uiMode === "in_game"
    });
  }

  private activateBoss(): void {
    runActivateBoss(this.state, {
      uiInGame: this.uiMode === "in_game",
      playBossMusic: (stage) => {
        void this.music.playBoss(stage);
      },
      enqueueSpawnObject: (delayTick, repeat, objId, x, y, extra) => {
        this.enqueueAction("spawn_object", delayTick, repeat, 0, objId, x, y, extra);
      },
      leftDir: LEFT,
      rightDir: RIGHT
    });
  }

  private moveBoss(deltaSeconds: number): void {
    runMoveBoss(this.state, deltaSeconds, {
      stage7BaseLife: BOSS_LIFE[7] ?? 40,
      getBossSpriteForStage: (stage) => this.getBossSpriteForStage(stage),
      spawnEnemyShot: (x, y, vx, vy, weapon, gpr1, gpr2, gpr3) => {
        this.spawnEnemyShot(x, y, vx, vy, weapon, gpr1, gpr2, gpr3);
      },
      playSfx: (name) => {
        void this.audio.playSfx(name);
      },
      enqueueSpawnObject: (objId, x, y, extra) => {
        this.enqueueAction("spawn_object", 1, 1, 0, objId, x, y, extra);
      },
      moveBossEyes: (body) => runMoveBossEyes(this.state, body)
    });
  }

  private bossFire(): void {
    runBossFire(this.state, {
      fireBossEyes: () => this.fireBossEyes(),
      spawnEnemyShot: (x, y, vx, vy, weapon, gpr1, gpr2, gpr3) => {
        this.spawnEnemyShot(x, y, vx, vy, weapon, gpr1, gpr2, gpr3);
      }
    });
  }

  private fireBossEyes(): void {
    runFireBossEyes(
      this.state,
      (index, eye) => this.isBossEyeOpen(index, eye),
      (x, y, vx, vy) => {
        this.spawnEnemyShot(x, y, vx, vy);
      }
    );
  }

  private enemiesFire(): void {
    runEnemiesFire(this.state, {
      shootChanceByDifficulty: SHOOT_CHANCE,
      random: () => Math.random(),
      spawnEnemyShot: (x, y, vx, vy, weapon, gpr1, gpr2, gpr3) => {
        this.spawnEnemyShot(x, y, vx, vy, weapon, gpr1, gpr2, gpr3);
      }
    });
  }

  private scrollMap(): void {
    this.scrollWorldByMap();
    this.checkScrollCollision();
    this.state.tilePx += 1;
    if (this.state.tilePx >= TILE_SIZE) {
      this.state.tilePx = 0;
      this.state.mapScrollRow -= 1;
      this.processBossRowTrigger(this.state.mapScrollRow);
      if (this.state.mapScrollRow < -1) {
        if (this.state.stage === 9) {
          this.state.phase = "final_cutscene";
          this.finalPortalActive = true;
        } else if (!this.state.boss.cleared) {
          this.activateBoss();
        } else {
          this.state.phase = "stage_clear";
          this.state.phaseTimer = 180;
        }
      } else {
        this.spawnRowObjects(this.state.mapScrollRow);
      }
    }
  }

  private scrollWorldByMap(): void {
    for (const object of this.state.objects) {
      if (object.active) object.y += 1;
    }
    for (const block of this.state.blocks) {
      if (block.active) block.y += 1;
    }
  }

  private spawnPrincess(): void {
    const princess = this.allocObject(51, SCREEN_WIDTH / 2 - PRINCESS_SPRITE.w / 2, TILE_SIZE * 2);
    if (!princess) return;
    princess.life = 1;
  }

  private spawnRowObjects(row: number): void {
    runSpawnRowObjects(this.state, row, {
      allocObject: (id, x, y) => this.allocObject(id, x, y),
      spawnBlock: (x, y, type) => this.spawnBlock(x, y, type),
      getEnemyLife: (id) => this.getEnemyLife(id),
      playerX: this.state.player.x,
      playerY: this.state.player.y
    });
  }

  private seedInitialBlocks(): void {
    // Source parity (map.inc draw_map/process_map_row with spawn=false):
    // initialize currently visible block sprites before gameplay scroll starts.
    const firstRow = this.state.mapScrollRow;
    const lastRow = Math.min(MAP_ROWS_0, this.state.mapScrollRow + SCREEN_ROWS + 1);
    for (let row = firstRow; row <= lastRow; row += 1) {
      const screenRow = row - this.state.mapScrollRow;
      const y = screenRow * TILE_SIZE + this.state.tilePx;
      for (let col = MAP_COLS - 1; col >= 0; col -= 1) {
        const tileData = this.state.map[row * MAP_COLS + col] ?? 0;
        const objId = (tileData >> 8) & 0x1f;
        if (objId !== 22) continue;
        const extra = (tileData >> 13) & 0x7;
        this.spawnBlock(col * TILE_SIZE, y, extra);
      }
    }
  }

  private calculateStartRow(currentRow: number): number {
    // Source parity (map.inc calculate_start_row).
    if (currentRow <= 10) return 0;
    const maxStartRow = Math.max(0, MAP_ROWS_0 - SCREEN_ROWS - 2);
    let row = Math.min(maxStartRow, currentRow + 5);
    let solid = true;
    while (solid && row < maxStartRow) {
      const baseRow = row + PLAYER_INIT_ROW;
      solid =
        this.isSolidAt(baseRow, PLAYER_INIT_COL) &&
        this.isSolidAt(baseRow, PLAYER_INIT_COL + 1) &&
        this.isSolidAt(baseRow + 1, PLAYER_INIT_COL) &&
        this.isSolidAt(baseRow + 1, PLAYER_INIT_COL);
      if (solid) row += 1;
    }
    return Math.max(0, Math.min(maxStartRow, row));
  }

  private isSolidAt(row: number, col: number): boolean {
    if (row < 0 || row > MAP_ROWS_0 || col < 0 || col >= MAP_COLS) return false;
    const tile = this.state.map[row * MAP_COLS + col];
    return tile !== undefined && (tile & 0x80) !== 0;
  }

  private tryMovePlayer(dx: number, dy: number): void {
    const prevX = this.state.player.x;
    const prevY = this.state.player.y;

    this.state.player.x += dx;
    this.state.player.y += dy;

    if (mapCollide(this.state, this.state.player.x, this.state.player.y)) {
      this.state.player.x = prevX;
      this.state.player.y = prevY;
    }

    if (prevX !== this.state.player.x || prevY !== this.state.player.y) {
      this.playerMovedTick = true;
    }

    if (this.state.player.x < 0) this.state.player.x = SCREEN_WIDTH - TILE_SIZE * 2;
    if (this.state.player.x > SCREEN_WIDTH - TILE_SIZE * 2) this.state.player.x = 0;
    if (this.state.player.y < TILE_SIZE * 6) this.state.player.y = TILE_SIZE * 6;
    if (this.state.player.y > GAME_VIEW_HEIGHT) this.state.player.y = GAME_VIEW_HEIGHT;
    this.checkScrollCollision();
  }

  private updatePlayerAnimationTick(): void {
    if (this.state.timerTick % 6 !== 0) return;
    const speed = this.state.player.powerUp === 4 ? PLAYER_MAX_SPEED : this.state.player.speed;
    this.playerAnimCounter += this.playerMovedTick ? 2 + speed / PLAYER_INIT_SPEED : 1;
    if (this.playerAnimCounter > 10000) {
      this.playerAnimCounter = this.playerAnimCounter % 10;
    }
  }

  private hasActiveRedDeathGhost(): boolean {
    for (const object of this.state.objects) {
      if (!object.active) continue;
      if (object.id === 16) return true;
    }
    return false;
  }

  private checkScrollCollision(): void {
    if (!mapCollide(this.state, this.state.player.x, this.state.player.y)) return;
    this.state.player.y += 2;
    if (Math.floor(this.state.player.y + TILE_SIZE / 2) > GAME_VIEW_HEIGHT) {
      this.killPlayer();
    }
  }

  private render(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.save();
    this.ctx.translate(SCREEN_OFFSET, 0);

    beginGameClip(this.ctx);
    this.ctx.save();
    // Original MMBasic pipeline blits from source Y=TILE_SIZEx2, so the gameplay view is shifted up by 16px.
    this.ctx.translate(0, -HUD_HEIGHT);
    renderMap(this.ctx, this.state, this.mapTileset);
    this.renderObjects();
    this.renderBlocks();
    this.renderShots();
    this.renderEnemyShots();
    this.renderFinalPortal();
    this.renderShield();
    this.renderPlayer();
    this.ctx.restore();
    endGameClip(this.ctx);

    this.renderHud();
    this.renderUiOverlay();
    this.renderPhaseOverlay();
    this.ctx.restore();
  }

  private renderFinalPortal(): void {
    drawFinalPortal(this.ctx, this.finalPortalActive, this.finalPortalX, this.finalPortalY);
  }

  private renderObjects(): void {
    drawObjects(
      this.ctx,
      this.objectsTileset,
      this.bossTileset,
      this.state.objects,
      this.state.stage,
      this.bossSpriteOffsetX,
      (object) => this.getAnimatedObjectSprite(object),
      this.getBossSpriteForStage.bind(this),
      this.getBossRenderAnimState.bind(this),
      this.getBossEyeRenderState.bind(this)
    );
  }

  private renderBlocks(): void {
    drawBlocks(this.ctx, this.objectsTileset, this.state.blocks, this.getBlockSprite.bind(this));
  }

  private renderShots(): void {
    drawShots(this.ctx, this.objectsTileset, this.state.shots, (shot) => this.getAnimatedShotSprite(shot));
  }

  private renderEnemyShots(): void {
    drawEnemyShots(this.ctx, this.objectsTileset, this.state.enemyShots, (shot) => this.getAnimatedShotSprite(shot));
  }

  private renderShield(): void {
    drawShield(this.ctx, this.objectsTileset, this.state);
  }

  private renderPlayer(): void {
    drawPlayer(this.ctx, this.objectsTileset, this.state, this.playerAnimCounter);
  }

  private renderHud(): void {
    drawHud(this.ctx, this.state, this.objectsTileset);
  }

  private renderPhaseOverlay(): void {
    drawPhaseOverlay(this.ctx, this.objectsTileset, this.uiMode, this.state);
  }

  private renderUiOverlay(): void {
    drawUiOverlay(this.ctx, this.objectsTileset, {
      uiMode: this.uiMode,
      stage: this.state.stage,
      bossBlinkGray: this.bossBlinkGray,
      introStage: this.introUi.stage,
      introLogoY: this.introUi.logoY,
      menuStartBlinkTick: this.menuUi.startBlinkTick,
      menuItem: this.menuUi.item,
      selectedDifficulty: this.menuUi.selectedDifficulty,
      selectedStartStage: this.menuUi.selectedStartStage
    });
  }

  private allocObject(id: number, x: number, y: number): ObjectState | undefined {
    const slot = this.state.objects.find((object) => !object.active);
    if (!slot) return undefined;

    slot.active = true;
    slot.id = id;
    slot.x = x;
    slot.y = y;
    slot.life = 1;
    slot.gpr1 = 0;
    slot.gpr2 = 0;
    slot.gpr3 = 0;
    return slot;
  }

  private spawnBlock(x: number, y: number, type: number): void {
    const slot = this.state.blocks.find((block) => !block.active);
    if (!slot) return;
    slot.active = true;
    slot.id = 22;
    slot.x = x;
    slot.y = y;
    slot.life = 0;
    slot.gpr1 = 0;
    slot.gpr2 = type;
    slot.gpr3 = this.blockMaxHits(slot);
  }

  private spawnShot(weapon: number, x: number, y: number, vx: number, vy: number): boolean {
    const slot = this.state.shots.find((shot) => !shot.active);
    if (!slot) return false;

    slot.active = true;
    slot.weapon = weapon;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.age = 0;
    slot.gpr1 = 0;
    slot.gpr2 = 0;
    slot.gpr3 = 0;
    return true;
  }

  private spawnEnemyShot(x: number, y: number, vx: number, vy: number, weapon = 23, gpr1 = 0, gpr2 = 0, gpr3 = 0): boolean {
    const slot = this.state.enemyShots.find((shot) => !shot.active);
    if (!slot) return false;
    slot.active = true;
    slot.weapon = weapon;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.age = 0;
    slot.gpr1 = gpr1;
    slot.gpr2 = gpr2;
    slot.gpr3 = gpr3;
    return true;
  }

  private getEnemyLife(objId: number): number {
    if (objId === 4 || objId === 7) return 3;
    if (objId === 20 || objId === 21) return 9999;
    return 1;
  }

  private hasActiveCorePlayerShots(): boolean {
    for (let i = 0; i < Math.min(3, this.state.shots.length); i += 1) {
      if (this.state.shots[i]?.active) return true;
    }
    return false;
  }

  private getShotSprite(weapon: number): { x: number; y: number; w: number; h: number } {
    return resolveShotSprite(weapon);
  }

  private getAnimatedShotSprite(shot: ShotState): { x: number; y: number; w: number; h: number; rot?: 0 | 1 | 2 | 3 } {
    return resolveAnimatedShotSprite(shot, this.state.timerTick);
  }

  private isSuperWeapon(weapon: number): boolean {
    return weapon === 3 || weapon === 4 || weapon === 6 || weapon === 8 || weapon === 9 || weapon === 11;
  }

  private getObjectSprite(id: number): { x: number; y: number; w: number; h: number } {
    return resolveObjectSprite(id);
  }

  private getAnimatedObjectSprite(object: ObjectState): { x: number; y: number; w: number; h: number } {
    return resolveAnimatedObjectSprite(object, this.state.timerTick, this.redDeathPulseTick);
  }

  private getBossRenderAnimState(body: ObjectState): { xOffset: number; yOffset: number; flipX: boolean } {
    if (this.state.boss.status <= 0) return { xOffset: 0, yOffset: 0, flipX: false };
    const tick = Math.floor(this.state.timerTick / 6);
    let xOffset = 0;
    let yOffset = 0;
    let flipX = false;

    switch (this.state.stage) {
      case 1:
        if (tick % 8 > 3 && this.state.boss.status !== 1) xOffset += TILE_SIZE * 5;
        break;
      case 5:
        if (tick % 10 > 4 && this.state.boss.status !== 1) xOffset += TILE_SIZE * 5;
        if (body.gpr3 < 0) xOffset += TILE_SIZE * 10;
        break;
      case 6:
        if (tick % 12 > 5 && this.state.boss.status !== 1) xOffset += TILE_SIZE * 5;
        break;
      case 7: {
        const hitbox = this.state.objects[this.state.boss.hitboxIndex];
        const life = hitbox?.life ?? 0;
        if (this.state.boss.status !== 1 && tick % 4 < 2) {
          if (life < 11) xOffset += TILE_SIZE * 4;
          else if (life < 21) xOffset += TILE_SIZE * 2;
        }
        flipX = tick % 6 > 2;
        break;
      }
      case 8:
        if (this.state.boss.status !== 1 && Math.floor(body.x) !== Math.floor(body.gpr2) && tick % 12 > 5) {
          xOffset += TILE_SIZE * 6;
        }
        break;
      case 3:
        xOffset = this.state.boss.animStage === 3 ? 80 : 200;
        yOffset = this.state.boss.animStage === 2 ? 0 : 40;
        if (tick % 48 > 23) {
          const wingTick = tick % 4;
          xOffset += wingTick < 2 || this.state.boss.status === 1 ? TILE_SIZE * 5 : TILE_SIZE * 10;
        }
        break;
    }

    return { xOffset, yOffset, flipX };
  }

  private getBossEyeRenderState(index: number, eye: ObjectState): { xOffset: number; yOffset: number; visible: boolean; flipX: boolean } {
    // Original MMBasic uses aux1 = spr_id - 15 (first eye offset starts from 0).
    const phaseOffset = Math.max(0, index);
    const cycle = 115 + phaseOffset;
    const animTick = Math.floor(this.state.timerTick / 6);
    const t = animTick % cycle;
    const life = Math.max(0, eye.life);
    const maxLife = Math.max(1, Math.round((BOSS_LIFE[8] ?? 24) * BOSS_DIFFICULTY[this.state.difficulty]));
    const xOffset = TILE_SIZE * 2 * Math.max(0, Math.min(5, Math.floor(5 - life / (maxLife / 5))));
    if (life <= 0) return { xOffset, yOffset: 0, visible: true, flipX: false };
    if (t < 3 + phaseOffset) return { xOffset, yOffset: TILE_SIZE * 2, visible: true, flipX: false };
    if (t < 103 + phaseOffset) {
      // Original code flips eye frame every 8 anim ticks while fully open.
      const flipX = Math.floor(t / 8) % 2 === 1;
      return { xOffset, yOffset: TILE_SIZE * 4, visible: true, flipX };
    }
    if (t < 112 + phaseOffset) return { xOffset, yOffset: TILE_SIZE * 2, visible: true, flipX: false };
    return { xOffset, yOffset: 0, visible: true, flipX: false };
  }

  private isBossEyeOpen(index: number, eye: ObjectState): boolean {
    if (eye.life <= 0) return false;
    // Keep hit gate in lock-step with original eye timing offsets.
    const phaseOffset = Math.max(0, index);
    const cycle = 115 + phaseOffset;
    const animTick = Math.floor(this.state.timerTick / 6);
    const t = animTick % cycle;
    return t >= 3 + phaseOffset && t < 103 + phaseOffset;
  }

  private getBossSpriteForStage(stage: number): { x: number; y: number; w: number; h: number } {
    return BOSS_STAGE_SPRITE[stage] ?? DEFAULT_BOSS_SPRITE;
  }

  private getBlockSprite(type: number, hits: number, maxHits: number): { x: number; y: number; w: number; h: number } {
    if (hits <= 0) {
      return BLOCK_TRANSPARENT_SPRITE;
    }
    if (hits < maxHits) {
      return BLOCK_BASE_SPRITE;
    }
    return {
      x: BLOCK_BASE_SPRITE.x + TILE_SIZE * 2 * type,
      y: BLOCK_BASE_SPRITE.y,
      w: BLOCK_BASE_SPRITE.w,
      h: BLOCK_BASE_SPRITE.h
    };
  }

  private getObjectRect(object: ObjectState): { x: number; y: number; w: number; h: number } {
    if (object.id === 50) {
      if (object.gpr3 >= 900) {
        return { x: object.x, y: object.y, w: BOSS_EYE_SPRITE.w, h: BOSS_EYE_SPRITE.h };
      }
      const sprite = this.getBossSpriteForStage(this.state.stage);
      return { x: object.x, y: object.y, w: sprite.w, h: sprite.h };
    }
    if (object.id === 60) {
      return { x: object.x, y: object.y, w: object.gpr3 || TILE_SIZE * 2, h: TILE_SIZE };
    }
    const sprite = this.getObjectSprite(object.id);
    return { x: object.x, y: object.y, w: sprite.w, h: sprite.h };
  }

  private getShieldRect(): { x: number; y: number; w: number; h: number } | undefined {
    if (this.state.player.shieldHits <= 0) return undefined;
    return {
      x: this.state.player.x,
      y: this.state.player.y - TILE_SIZE,
      w: SHIELD_SPRITE.w,
      h: SHIELD_SPRITE.h
    };
  }

  private intersects(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private intersectsWithPadding(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
    pad: number
  ): boolean {
    return a.x < b.x + b.w + pad && a.x + a.w > b.x - pad && a.y < b.y + b.h + pad && a.y + a.h > b.y - pad;
  }

  private createShotPool(count: number): ShotState[] {
    return Array.from({ length: count }, () => ({
      active: false,
      weapon: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      age: 0,
      gpr1: 0,
      gpr2: 0,
      gpr3: 0
    }));
  }

  private createObjectPool(count: number): ObjectState[] {
    return Array.from({ length: count }, () => ({
      active: false,
      id: 0,
      x: 0,
      y: 0,
      life: 0,
      gpr1: 0,
      gpr2: 0,
      gpr3: 0
    }));
  }

  private createActionQueue(count: number): GameState["actionQueue"] {
    return Array.from({ length: count }, () => ({
      active: false,
      action: "spawn_object",
      executeAtTick: 0,
      intervalTick: 0,
      repeat: 0,
      p1: 0,
      p2: 0,
      p3: 0,
      p4: 0
    }));
  }

  private async loadObjectsTileset(): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = objectsTilesetUrl;
    await image.decode();
    return image;
  }

  private async loadBossTileset(): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = bossTilesetUrl;
    await image.decode();
    return image;
  }
}
