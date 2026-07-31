import { PLAYER_INIT_COL, PLAYER_INIT_ROW, PLAYER_INIT_SPEED, TILE_SIZE } from "./config.js";
export const createInitialPlayer = () => ({
    x: PLAYER_INIT_COL * TILE_SIZE,
    y: PLAYER_INIT_ROW * TILE_SIZE,
    speed: PLAYER_INIT_SPEED,
    powerUp: 0,
    weapon: 1,
    lives: 2,
    shieldHits: 0
});
