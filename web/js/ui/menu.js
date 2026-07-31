import { CTRL_DOWN, CTRL_FIRE, CTRL_LEFT, CTRL_RIGHT, CTRL_UP } from "../input.js";
export function createMenuState() {
    return {
        item: 0,
        latch: false,
        selectedDifficulty: 1,
        selectedStartStage: 1,
        startBlinkTick: 0
    };
}
export function updateMenuState(state, ctrl) {
    const next = { ...state };
    if (next.startBlinkTick > 0) {
        next.startBlinkTick -= 1;
        if (next.startBlinkTick <= 0) {
            return { next, action: "start_campaign" };
        }
        return { next, action: "none" };
    }
    if (ctrl === 0) {
        next.latch = false;
        return { next, action: "none" };
    }
    if (next.latch) {
        return { next, action: "none" };
    }
    next.latch = true;
    if ((ctrl & CTRL_UP) !== 0)
        next.item = Math.max(0, next.item - 1);
    if ((ctrl & CTRL_DOWN) !== 0)
        next.item = Math.min(3, next.item + 1);
    if ((ctrl & CTRL_LEFT) !== 0) {
        if (next.item === 1)
            next.selectedDifficulty = Math.max(0, next.selectedDifficulty - 1);
        if (next.item === 2)
            next.selectedStartStage = Math.max(1, next.selectedStartStage - 1);
    }
    if ((ctrl & CTRL_RIGHT) !== 0) {
        if (next.item === 1)
            next.selectedDifficulty = Math.min(2, next.selectedDifficulty + 1);
        if (next.item === 2)
            next.selectedStartStage = Math.min(8, next.selectedStartStage + 1);
    }
    if ((ctrl & CTRL_FIRE) !== 0) {
        if (next.item === 0) {
            next.startBlinkTick = 240;
            return { next, action: "none" };
        }
        if (next.item === 3) {
            return { next, action: "back_to_intro" };
        }
    }
    return { next, action: "none" };
}
