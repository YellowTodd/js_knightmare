import { CANVAS_HEIGHT, CANVAS_WIDTH, GAME_VIEW_HEIGHT, HUD_TOP, SCREEN_HEIGHT, SCREEN_OFFSET, SCREEN_WIDTH, TILE_SIZE } from "../config.js";
import { drawBitmapText, drawBitmapTextCentered } from "./text.js";
const MENU_PANEL_SPRITE = { x: 112, y: 160, w: TILE_SIZE * 11, h: TILE_SIZE * 3 };
const MENU_CURSOR_SPRITE = { x: 112, y: 184, w: TILE_SIZE, h: TILE_SIZE };
const centerX = (tileCols, offsetTiles = 0) => SCREEN_WIDTH / 2 - (TILE_SIZE * tileCols) / 2 + offsetTiles * TILE_SIZE;
const centerY = (tileRows, offsetTiles = 0) => SCREEN_HEIGHT / 2 - (TILE_SIZE * tileRows) / 2 + offsetTiles * TILE_SIZE;
export function renderHud(ctx, state, objectsTileset) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, GAME_VIEW_HEIGHT, SCREEN_WIDTH, CANVAS_HEIGHT - GAME_VIEW_HEIGHT);
    const score = String(Math.max(0, Math.floor(state.score))).padStart(2, "0");
    const hiscore = String(Math.max(0, Math.floor(state.hiscore))).padStart(2, "0");
    const rest = String(Math.max(0, state.player.lives)).padStart(2, "0");
    const stage = String(Math.max(1, state.stage)).padStart(2, "0");
    drawBitmapText(ctx, objectsTileset, "   SCORE  HISCORE  REST  STAGE", 0, HUD_TOP);
    const row = Array.from({ length: 32 }, () => " ");
    const placeRight = (endCol, value) => {
        const start = Math.max(0, endCol - value.length + 1);
        for (let i = 0; i < value.length && start + i < row.length; i += 1) {
            row[start + i] = value[i] ?? " ";
        }
    };
    // Match original HUD alignment: each value is right-aligned under its label.
    placeRight(7, score);
    placeRight(16, hiscore);
    placeRight(22, rest);
    placeRight(29, stage);
    drawBitmapText(ctx, objectsTileset, row.join(""), 0, HUD_TOP + TILE_SIZE);
}
export function renderPhaseOverlay(ctx, objectsTileset, uiMode, state) {
    if (uiMode !== "in_game")
        return;
    if (state.phase === "playing")
        return;
    if (state.phase === "player_dead")
        return;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, SCREEN_WIDTH, GAME_VIEW_HEIGHT);
    const text = state.phase === "stage_clear" ? `STAGE ${state.stage} CLEAR` : "GAME OVER";
    drawBitmapTextCentered(ctx, objectsTileset, text, SCREEN_WIDTH / 2, Math.floor(GAME_VIEW_HEIGHT / 2));
}
export function renderUiOverlay(ctx, objectsTileset, params) {
    if (params.bossBlinkGray) {
        ctx.fillStyle = "#6a6a6a";
        ctx.fillRect(0, 0, SCREEN_WIDTH, CANVAS_HEIGHT);
    }
    if (params.uiMode === "in_game")
        return;
    if (params.uiMode === "intro") {
        ctx.fillStyle = "#204c95";
        ctx.fillRect(-SCREEN_OFFSET, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const logoW = TILE_SIZE * 11;
        const logoH = params.introStage >= 2 ? TILE_SIZE * 5 : TILE_SIZE * 3;
        ctx.drawImage(objectsTileset, 0, 160, logoW, logoH, SCREEN_WIDTH / 2 - logoW / 2, params.introLogoY, logoW, logoH);
    }
    else if (params.uiMode === "menu") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, SCREEN_WIDTH, CANVAS_HEIGHT);
        const diffLabel = params.selectedDifficulty === 0 ? "EASY" : params.selectedDifficulty === 1 ? "NORMAL" : "HARD";
        const menuTextY0 = 76;
        const menuLineHeight = 16;
        const menuTextX = TILE_SIZE * 6;
        const panelX = centerX(11);
        const panelY = centerY(3, -6);
        drawBitmapTextCentered(ctx, objectsTileset, "KNIGHTMARE", SCREEN_WIDTH / 2, centerY(1, -8));
        drawBitmapTextCentered(ctx, objectsTileset, "ORIGINAL GAME BY KONAMI(C) 1986", SCREEN_WIDTH / 2, centerY(1, 8));
        drawBitmapTextCentered(ctx, objectsTileset, "MMBASIC VERSION BY", SCREEN_WIDTH / 2, centerY(1, 10));
        drawBitmapTextCentered(ctx, objectsTileset, "LEONARDO BERARDINO 2025", SCREEN_WIDTH / 2, centerY(1, 11));
        drawBitmapTextCentered(ctx, objectsTileset, "MUSIC BY H0FFMAN", SCREEN_WIDTH / 2, centerY(1, 12));
        ctx.drawImage(objectsTileset, MENU_PANEL_SPRITE.x, MENU_PANEL_SPRITE.y, MENU_PANEL_SPRITE.w, MENU_PANEL_SPRITE.h, panelX, panelY, MENU_PANEL_SPRITE.w, MENU_PANEL_SPRITE.h);
        ctx.drawImage(objectsTileset, MENU_CURSOR_SPRITE.x, MENU_CURSOR_SPRITE.y, MENU_CURSOR_SPRITE.w, MENU_CURSOR_SPRITE.h, menuTextX + TILE_SIZE, menuTextY0 + 1 + params.menuItem * menuLineHeight, MENU_CURSOR_SPRITE.w, MENU_CURSOR_SPRITE.h);
        const showStart = params.menuStartBlinkTick <= 0 || Math.floor(params.menuStartBlinkTick / 6) % 2 === 1;
        drawBitmapText(ctx, objectsTileset, `${showStart ? "  START GAME        " : "                    "}`, menuTextX, menuTextY0);
        drawBitmapText(ctx, objectsTileset, `  DIFFICULTY: ${diffLabel}`, menuTextX, menuTextY0 + menuLineHeight);
        drawBitmapText(ctx, objectsTileset, `  STAGE: ${params.selectedStartStage}`, menuTextX, menuTextY0 + menuLineHeight * 2);
        drawBitmapText(ctx, objectsTileset, "  QUIT", menuTextX, menuTextY0 + menuLineHeight * 3);
    }
    else if (params.uiMode === "stage_ready") {
        drawBitmapTextCentered(ctx, objectsTileset, `STAGE ${params.stage}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 4);
        drawBitmapTextCentered(ctx, objectsTileset, "GET READY", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 16);
    }
    else if (params.uiMode === "ending") {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, SCREEN_WIDTH, CANVAS_HEIGHT);
        drawBitmapTextCentered(ctx, objectsTileset, "LOVE IS FOREVER...", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 4);
        drawBitmapTextCentered(ctx, objectsTileset, "THANK YOU FOR PLAYING", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 16);
    }
}
