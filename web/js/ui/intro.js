export function createIntroState(screenHeight, screenRows, tileSize) {
    return {
        stage: 0,
        logoY: screenHeight,
        logoTargetY: (screenRows * tileSize) / 2 - (tileSize * 5) / 2,
        timer: 0
    };
}
export function updateIntroState(state, firePressed) {
    if (firePressed) {
        return { next: state, enterMenu: true, latchFire: true };
    }
    const next = { ...state };
    if (next.stage === 0) {
        // Source show_intro(): y -= 200 * g_delta_time
        // Main loop runs at 120 Hz, so this is ~1.666px per tick.
        next.logoY -= 200 / 120;
        if (next.logoY <= next.logoTargetY) {
            next.logoY = next.logoTargetY;
            next.stage = 1;
            // Source pause 300ms
            next.timer = 36;
        }
    }
    else if (next.stage === 1) {
        next.timer -= 1;
        if (next.timer <= 0) {
            next.stage = 2;
            // Source pause 2000ms
            next.timer = 240;
        }
    }
    else {
        next.timer -= 1;
        if (next.timer <= 0) {
            return { next, enterMenu: true, latchFire: false };
        }
    }
    return { next, enterMenu: false, latchFire: false };
}
