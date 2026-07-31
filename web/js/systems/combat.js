function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function intersectsWithPadding(a, b, pad) {
    return a.x < b.x + b.w + pad && a.x + a.w > b.x - pad && a.y < b.y + b.h + pad && a.y + a.h > b.y - pad;
}
function shrinkRect(rect, inset) {
    return {
        x: rect.x + inset,
        y: rect.y + inset,
        w: Math.max(1, rect.w - inset * 2),
        h: Math.max(1, rect.h - inset * 2)
    };
}
export function processCollisions(state, deps) {
    if (deps.controlLocked)
        return;
    const playerRect = deps.playerRect;
    // Source collision.inc: player collision checks first 3 shot slots and
    // destroys boomerang if player touches it.
    for (let i = 0; i < Math.min(3, state.shots.length); i += 1) {
        const shot = state.shots[i];
        if (!shot || !shot.active)
            continue;
        const shotSprite = deps.getShotSprite(shot.weapon);
        const shotRect = { x: shot.x, y: shot.y, w: shotSprite.w, h: shotSprite.h };
        if (!intersects(playerRect, shotRect))
            continue;
        if (shot.weapon === 4 || shot.weapon === 9) {
            shot.active = false;
        }
    }
    for (const block of state.blocks) {
        if (!block.active)
            continue;
        const blockRect = { x: block.x, y: block.y, w: deps.blockRectSize.w, h: deps.blockRectSize.h };
        if (!intersects(playerRect, blockRect))
            continue;
        deps.collectBlockBonus(block);
    }
    for (const object of state.objects) {
        if (!object.active)
            continue;
        let objRect = deps.getObjectRect(object);
        if (object.id > 0 && object.id < 20) {
            objRect = shrinkRect(objRect, 2);
        }
        if (!intersects(playerRect, objRect))
            continue;
        const prevLives = state.player.lives;
        deps.hitPlayer(object);
        if (!object.active)
            continue;
        if (state.player.lives < prevLives)
            return;
    }
    for (const shot of state.shots) {
        if (!shot.active)
            continue;
        const sprite = deps.getShotSprite(shot.weapon);
        const shotRect = { x: shot.x, y: shot.y, w: sprite.w, h: sprite.h };
        let hitBlock = false;
        for (const block of state.blocks) {
            if (!block.active)
                continue;
            const blockRect = { x: block.x, y: block.y, w: deps.blockRectSize.w, h: deps.blockRectSize.h };
            if (!intersects(shotRect, blockRect))
                continue;
            deps.hitBlock(block);
            if (!deps.isSuperWeapon(shot.weapon)) {
                shot.active = false;
            }
            hitBlock = true;
            break;
        }
        if (hitBlock)
            continue;
        for (const object of state.objects) {
            if (!object.active)
                continue;
            if (object.id === 51)
                continue;
            if (object.id >= 22 && object.id < 50)
                continue;
            if (!intersects(shotRect, deps.getObjectRect(object)))
                continue;
            deps.hitObject(shot, object);
            break;
        }
        if (!shot.active)
            continue;
        for (const enemyShot of state.enemyShots) {
            if (!enemyShot.active)
                continue;
            // Source collision.inc hit_shot(): only bone(25) and scythe(33) are breakable by player shots.
            if (enemyShot.weapon !== 25 && enemyShot.weapon !== 33)
                continue;
            const enemySprite = deps.getShotSprite(enemyShot.weapon);
            const enemyRect = { x: enemyShot.x, y: enemyShot.y, w: enemySprite.w, h: enemySprite.h };
            if (!intersects(shotRect, enemyRect))
                continue;
            enemyShot.active = false;
            shot.active = false;
            break;
        }
    }
}
