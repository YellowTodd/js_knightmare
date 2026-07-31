export const CTRL_UP = 1 << 0;
export const CTRL_DOWN = 1 << 1;
export const CTRL_LEFT = 1 << 2;
export const CTRL_RIGHT = 1 << 3;
export const CTRL_FIRE = 1 << 4;
export const CTRL_RESTART = 1 << 5;
export class Input {
    keys = new Set();
    constructor() {
        addEventListener("keydown", (event) => {
            this.keys.add(event.code);
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
                event.preventDefault();
            }
        });
        addEventListener("keyup", (event) => {
            this.keys.delete(event.code);
        });
        addEventListener("blur", () => {
            this.keys.clear();
        });
    }
    read() {
        let ctrl = 0;
        if (this.keys.has("ArrowUp"))
            ctrl |= CTRL_UP;
        if (this.keys.has("ArrowDown"))
            ctrl |= CTRL_DOWN;
        if (this.keys.has("ArrowLeft"))
            ctrl |= CTRL_LEFT;
        if (this.keys.has("ArrowRight"))
            ctrl |= CTRL_RIGHT;
        if (this.keys.has("Space"))
            ctrl |= CTRL_FIRE;
        if (this.keys.has("Enter"))
            ctrl |= CTRL_RESTART;
        return ctrl;
    }
}
