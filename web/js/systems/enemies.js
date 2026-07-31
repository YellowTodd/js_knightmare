import { TILE_SIZE } from "../config.js";
export function enemiesFire(state, deps) {
    if (state.freezeTimer >= 0)
        return;
    for (const object of state.objects) {
        if (!object.active || object.id <= 0 || object.id >= 20)
            continue;
        if (object.y < TILE_SIZE * 2)
            continue;
        const stageChance = deps.shootChanceByDifficulty[state.difficulty][Math.max(0, Math.min(8, state.stage - 1))] ?? 0.5;
        const chanceMul = object.id === 4 ? 1.15 : object.id === 6 ? 1.3 : object.id === 15 ? 1.5 : 1;
        const chance = Math.min(1, stageChance * chanceMul);
        if (deps.random() > chance)
            continue;
        const dx = state.player.x + TILE_SIZE - object.x;
        const dy = state.player.y + TILE_SIZE - object.y;
        const len = Math.hypot(dx, dy) || 1;
        const speed = object.id === 6 || object.id === 9 || object.id === 16 ? 100 : 70;
        const ox = object.x + TILE_SIZE;
        const oy = object.y + TILE_SIZE;
        if (object.id === 4) {
            const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
            if (angle >= 23 && angle <= 67) {
                deps.spawnEnemyShot(ox + TILE_SIZE, oy - TILE_SIZE * 2.5, (dx / len) * speed, (dy / len) * speed, 31);
            }
            else if (angle >= 292 || angle <= -23) {
                deps.spawnEnemyShot(ox - TILE_SIZE * 2, oy - TILE_SIZE * 2.5, (dx / len) * speed, (dy / len) * speed, 31);
            }
            else if (angle >= 112 && angle <= 157) {
                deps.spawnEnemyShot(ox + TILE_SIZE, oy + TILE_SIZE, (dx / len) * speed, (dy / len) * speed, 31);
            }
            else if (angle >= 202 && angle <= 247) {
                deps.spawnEnemyShot(ox - TILE_SIZE * 2, oy + TILE_SIZE, (dx / len) * speed, (dy / len) * speed, 31);
            }
            else if (angle >= 67 && angle <= 112) {
                deps.spawnEnemyShot(ox + TILE_SIZE, oy, (dx / len) * speed, (dy / len) * speed, 30);
            }
            else if (angle >= 247 && angle <= 292) {
                deps.spawnEnemyShot(ox - TILE_SIZE * 2.5, oy, (dx / len) * speed, (dy / len) * speed, 30);
            }
            else if (angle >= 157 && angle <= 202) {
                deps.spawnEnemyShot(ox, oy + TILE_SIZE, (dx / len) * speed, (dy / len) * speed, 29);
            }
            else {
                deps.spawnEnemyShot(ox, oy - TILE_SIZE * 2.5, (dx / len) * speed, (dy / len) * speed, 29);
            }
        }
        else if (object.id === 15) {
            for (let ang = 45; ang <= 315; ang += 45) {
                if (ang === 180)
                    continue;
                const rad = (ang * Math.PI) / 180;
                deps.spawnEnemyShot(ox, oy, -Math.cos(rad) * 70, Math.sin(rad) * 70);
            }
        }
        else if (object.id === 7) {
            deps.spawnEnemyShot(ox, oy, (dx / len) * speed, (dy / len) * speed, 25);
        }
        else if (object.id === 8) {
            const angle = Math.atan2(dx, -dy);
            const raySpeed = speed * 1.3;
            deps.spawnEnemyShot(ox, oy, Math.sin(angle - (30 * Math.PI) / 180) * raySpeed, -Math.cos(angle - (30 * Math.PI) / 180) * raySpeed, 24);
            deps.spawnEnemyShot(ox, oy, Math.sin(angle - (10 * Math.PI) / 180) * raySpeed, -Math.cos(angle - (10 * Math.PI) / 180) * raySpeed, 24);
            deps.spawnEnemyShot(ox, oy, Math.sin(angle + (10 * Math.PI) / 180) * raySpeed, -Math.cos(angle + (10 * Math.PI) / 180) * raySpeed, 24);
            deps.spawnEnemyShot(ox, oy, Math.sin(angle + (30 * Math.PI) / 180) * raySpeed, -Math.cos(angle + (30 * Math.PI) / 180) * raySpeed, 24);
        }
        else if (object.id === 9 || object.id === 16) {
            deps.spawnEnemyShot(ox, oy, (dx / len) * speed, (dy / len) * speed, 24);
        }
        else if (object.id === 6) {
            deps.spawnEnemyShot(ox, oy, (dx / len) * speed, (dy / len) * speed);
            deps.spawnEnemyShot(ox, oy, (dx / len) * speed * 0.85 - 20, (dy / len) * speed * 0.85);
            deps.spawnEnemyShot(ox, oy, (dx / len) * speed * 0.85 + 20, (dy / len) * speed * 0.85);
        }
        else {
            deps.spawnEnemyShot(ox, oy, (dx / len) * speed, (dy / len) * speed);
        }
        return;
    }
}
