import { GAME_VIEW_HEIGHT, MAP_COLS, MAP_ROWS, SCREEN_ROWS, SCREEN_WIDTH, TILE_SIZE, TILES_COLS, TILES_OFFSET } from "./config";
import type { GameState } from "./types";

const mapsTilesetUrl = "./tiles/maps.png";

export async function loadStageMap(stage: number): Promise<Uint16Array> {
  const response = await fetch(`./maps/stage${stage}.map`);
  if (!response.ok) {
    throw new Error(`Failed to load map for stage ${stage}`);
  }
  const buffer = await response.arrayBuffer();
  const dataView = new DataView(buffer);
  const map = new Uint16Array(MAP_COLS * MAP_ROWS);
  for (let i = 0; i < map.length; i += 1) {
    map[i] = dataView.getUint16(i * 2, false);
  }
  return map;
}

export async function loadMapTileset(): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = mapsTilesetUrl;
  await image.decode();
  return image;
}

export function isSolidTile(map: Uint16Array, row: number, col: number): boolean {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) {
    return false;
  }
  const tile = map[row * MAP_COLS + col];
  return tile !== undefined && (tile & 0x80) !== 0;
}

export function mapCollide(state: GameState, px: number, py: number): boolean {
  let x = Math.floor(px);
  if (px - x >= 0.9) {
    x += 1;
  }

  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor((py - state.tilePx) / TILE_SIZE) + state.mapScrollRow + 1;

  let collide =
    isSolidTile(state.map, row, col) ||
    isSolidTile(state.map, row, col + 2) ||
    isSolidTile(state.map, row + 1, col) ||
    isSolidTile(state.map, row + 1, col + 2);

  // Horizontal wrapping collision guard, same intent as original map_collide().
  if (!collide && x < 0) {
    collide =
      isSolidTile(state.map, row - 1, MAP_COLS - 1) ||
      isSolidTile(state.map, row + 4, MAP_COLS - 1);
  }
  if (!collide && x > SCREEN_WIDTH - TILE_SIZE * 2) {
    collide = isSolidTile(state.map, row - 1, 0) || isSolidTile(state.map, row + 4, 0);
  }

  return collide;
}

export function renderMap(ctx: CanvasRenderingContext2D, state: GameState, tileset: CanvasImageSource): void {
  const stageOffset = TILES_OFFSET[state.stage - 1] ?? 0;
  const topWorldRow = state.mapScrollRow;

  ctx.clearRect(0, 0, SCREEN_WIDTH, GAME_VIEW_HEIGHT);

  for (let screenRow = -1; screenRow <= SCREEN_ROWS + 1; screenRow += 1) {
    const worldRow = topWorldRow + screenRow;
    if (worldRow < 0 || worldRow >= MAP_ROWS) {
      continue;
    }

    const y = screenRow * TILE_SIZE + state.tilePx;
    for (let col = 0; col < MAP_COLS; col += 1) {
      const tileData = state.map[worldRow * MAP_COLS + col] ?? 0;
      const tile = tileData & 0x7f;
      const tx = (tile % TILES_COLS) * TILE_SIZE;
      const ty = Math.floor(tile / TILES_COLS) * TILE_SIZE + stageOffset;

      ctx.drawImage(tileset, tx, ty, TILE_SIZE, TILE_SIZE, col * TILE_SIZE, y, TILE_SIZE, TILE_SIZE);
    }
  }
}
