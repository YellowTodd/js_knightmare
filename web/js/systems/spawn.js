import { GAME_VIEW_HEIGHT, SCREEN_WIDTH, TILE_SIZE } from "../config.js";
const LEFT = -1;
const RIGHT = 1;
function initializeSpawnedObject(object, objId, extra, getEnemyLife, playerX, playerY) {
    object.life = getEnemyLife(objId);
    object.gpr1 = objId === 20 || objId === 21 || objId === 49 ? 0 : 90;
    object.gpr2 = objId >= 20 ? extra : object.x;
    object.gpr3 = objId >= 20 ? 0 : object.x < SCREEN_WIDTH / 2 ? RIGHT : LEFT;
    if (objId === 11) {
        if (object.x < SCREEN_WIDTH / 2) {
            object.x = 0;
            object.gpr1 = 90;
        }
        else {
            object.x = SCREEN_WIDTH;
            object.gpr1 = 270;
        }
    }
    if (objId === 16) {
        const dx = object.x - playerX;
        const dy = object.y - playerY - 200;
        const angle = Math.atan2(dx, dy);
        object.gpr3 = 40 * Math.sin(-angle);
    }
    if (objId === 14) {
        object.y = GAME_VIEW_HEIGHT - TILE_SIZE * 4;
    }
}
export function spawnQueuedObject(objId, x, y, extra, deps) {
    if (objId <= 0)
        return;
    if (objId === 22) {
        deps.spawnBlock(x, y, extra);
        return;
    }
    const object = deps.allocObject(objId, x, y);
    if (!object)
        return;
    initializeSpawnedObject(object, objId, extra, deps.getEnemyLife, deps.playerX, deps.playerY);
}
export function spawnRowObjects(state, row, deps) {
    if (row < 0)
        return;
    // Keep source ordering (map.inc): right-to-left spawn pass.
    for (let col = 31; col >= 0; col -= 1) {
        const tileData = state.map[row * 32 + col] ?? 0;
        const objId = (tileData >> 8) & 0x1f;
        const extra = (tileData >> 13) & 0x7;
        if (objId === 0)
            continue;
        if (objId === 22) {
            deps.spawnBlock(col * TILE_SIZE, 0, extra);
            continue;
        }
        if ((objId >= 1 && objId <= 16) || objId === 20 || objId === 21) {
            const spawnX = objId === 20 || objId === 21 ? Math.min(SCREEN_WIDTH - TILE_SIZE * 6, Math.max(TILE_SIZE * 4, state.player.x)) : col * TILE_SIZE;
            const spawnY = 0;
            const objExtra = state.difficulty === 0 && objId !== 20 && objId !== 21 ? Math.min(3, extra) : extra;
            const object = deps.allocObject(objId, spawnX, spawnY);
            if (!object)
                continue;
            initializeSpawnedObject(object, objId, objExtra, deps.getEnemyLife, deps.playerX, deps.playerY);
        }
    }
}
