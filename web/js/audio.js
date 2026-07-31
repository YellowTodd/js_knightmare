const SFX_URL = {
    shot: "./sfx/shot.wav",
    boomerang: "./sfx/shot_boomerang.wav",
    sword: "./sfx/shot_sword.wav",
    fire_arrow: "./sfx/shot_fire_arrow.wav",
    flame: "./sfx/shot_flame.wav",
    enemy_kill: "./sfx/enemy_kill.wav",
    player_death: "./sfx/player_death.wav",
    points: "./sfx/points.wav",
    crystal: "./sfx/chrystal.wav",
    power_up_hit: "./sfx/power_up_hit.wav",
    power_up_ending: "./sfx/power_up_ending.wav",
    shield: "./sfx/shield.wav",
    new_life: "./sfx/new_life.wav",
    kill_all_enemies: "./sfx/kill_all_enemies.wav",
    block_hit: "./sfx/block_hit.wav",
    block_open: "./sfx/block_open.wav",
    split: "./sfx/split.wav",
    skeleton_restored: "./sfx/skeleton_restored.wav",
    freeze_tick: "./sfx/freeze_tick.wav",
    boss_hit: "./sfx/boss_hit.wav",
    boss_kill: "./sfx/boss_kill.wav",
    boss_shield: "./sfx/boss_shield.wav",
    helmet: "./sfx/helmet.wav",
    terrain: "./sfx/terrain.wav",
    red_death: "./sfx/red_death.wav"
};
export class AudioController {
    cache = new Map();
    enabled = true;
    constructor() {
        addEventListener("keydown", () => {
            // Browsers require a user gesture before audio playback.
            void this.unlockAll();
        }, { once: true });
    }
    async playSfx(id) {
        if (!this.enabled)
            return;
        const audio = await this.load(id);
        try {
            audio.currentTime = 0;
            await audio.play();
        }
        catch {
            // Ignore blocked autoplay errors.
        }
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    async load(id) {
        const cached = this.cache.get(id);
        if (cached)
            return cached;
        const audio = new Audio(SFX_URL[id]);
        audio.preload = "auto";
        this.cache.set(id, audio);
        return audio;
    }
    async unlockAll() {
        const ids = Object.keys(SFX_URL);
        for (const id of ids) {
            await this.load(id);
        }
    }
}
