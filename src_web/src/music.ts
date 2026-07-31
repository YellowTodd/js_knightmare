const STAGE_TRACKS = [
  "01-gamestart",
  "02-bgm1",
  "04-bgm2",
  "06-prince_of_maresia",
  "08-tavern_funk",
  "10-another_level",
  "12-xakt",
  "14-positive_trek",
  "16-last_hurdle",
  "25-ending"
] as const;

const BOSS_TRACKS = [
  "",
  "03-boss1",
  "05-boss2",
  "07-bat_rock",
  "09-blind_panic",
  "11-more_boss",
  "13-under_his_eyes",
  "15-boss_fronty_ii",
  "17-manbow_reprise",
  "25-ending"
] as const;

export type SongId = "title" | "stage_intro" | "game_over" | "ending" | "silence";

export class MusicController {
  private current?: HTMLAudioElement;
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  async playUiSong(song: SongId): Promise<void> {
    let file = "";
    let loop = true;
    switch (song) {
      case "title":
        file = "24-title";
        loop = false;
        break;
      case "stage_intro":
        file = STAGE_TRACKS[0];
        loop = false;
        break;
      case "game_over":
        file = "20-gameover";
        loop = false;
        break;
      case "ending":
        file = "25-ending";
        break;
      case "silence":
        file = "26-silence";
        break;
    }
    await this.playFile(file, loop);
  }

  async playStage(stage: number): Promise<void> {
    const file = STAGE_TRACKS[Math.max(0, Math.min(STAGE_TRACKS.length - 1, stage))] ?? "";
    await this.playFile(file, true);
  }

  async playBoss(stage: number): Promise<void> {
    const file = BOSS_TRACKS[Math.max(0, Math.min(BOSS_TRACKS.length - 1, stage))] ?? "";
    if (!file) return;
    await this.playFile(file, true);
  }

  stop(): void {
    if (!this.current) return;
    this.current.pause();
    this.current.currentTime = 0;
    this.current = undefined;
  }

  private async playFile(file: string, loop: boolean): Promise<void> {
    if (!this.enabled || file.length === 0) return;
    this.stop();
    const candidates = [`./music/${file}.ogg`, `./music/${file}.mp3`, `./music/${file}.wav`];
    for (const url of candidates) {
      const audio = new Audio(url);
      audio.loop = loop;
      try {
        await audio.play();
        this.current = audio;
        return;
      } catch {
        // Try next candidate format.
      }
    }
  }
}
