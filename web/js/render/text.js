import { TILE_SIZE } from "../config.js";
const SYMBOLS_X = 0;
const SYMBOLS_Y = 48;
const NUMBERS_X = 24;
const NUMBERS_Y = 48;
const LETTERS_X = 0;
const LETTERS_Y = 56;
function drawGlyph(ctx, tileset, ch, x, y) {
    const c = ch.charCodeAt(0);
    let sx = -1;
    let sy = -1;
    if (c >= 32 && c <= 33) {
        sx = SYMBOLS_X + (c - 32) * TILE_SIZE;
        sy = SYMBOLS_Y;
    }
    else if (c >= 40 && c <= 41) {
        sx = NUMBERS_X + (c - 29) * TILE_SIZE;
        sy = NUMBERS_Y;
    }
    else if (c === 46) {
        sx = NUMBERS_X - TILE_SIZE;
        sy = NUMBERS_Y;
    }
    else if (c >= 48 && c <= 58) {
        sx = NUMBERS_X + (c - 48) * TILE_SIZE;
        sy = NUMBERS_Y;
    }
    else if (c >= 65 && c <= 90) {
        sx = LETTERS_X + (c - 65) * TILE_SIZE;
        sy = LETTERS_Y;
    }
    else if (c >= 97 && c <= 122) {
        sx = LETTERS_X + (c - 97) * TILE_SIZE;
        sy = LETTERS_Y;
    }
    if (sx < 0 || sy < 0)
        return;
    ctx.drawImage(tileset, sx, sy, TILE_SIZE, TILE_SIZE, x, y, TILE_SIZE, TILE_SIZE);
}
export function drawBitmapText(ctx, tileset, text, x, y) {
    for (let i = 0; i < text.length; i += 1) {
        drawGlyph(ctx, tileset, text[i] ?? " ", x + i * TILE_SIZE, y);
    }
}
export function drawBitmapTextCentered(ctx, tileset, text, centerX, y) {
    const w = text.length * TILE_SIZE;
    drawBitmapText(ctx, tileset, text, Math.round(centerX - w / 2), y);
}
