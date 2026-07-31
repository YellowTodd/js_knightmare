import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./config";
import { KnightmareTsPort } from "./game";

const canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#game canvas not found");
}

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.style.width = `${CANVAS_WIDTH * 2}px`;
canvas.style.height = `${CANVAS_HEIGHT * 2}px`;

const game = new KnightmareTsPort(canvas);
void game.start();
