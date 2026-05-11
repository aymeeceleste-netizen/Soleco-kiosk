export interface ModeView {
  /**
   * Optional per-tab kicker + heroline element. When provided, the shell
   * mounts it into `.vD-header` (replacing the auto-generated default).
   * Modes redesigned to the Rev. 2 system canonical should provide this.
   */
  header?: HTMLElement;
  hero: HTMLElement;
  caption: HTMLElement;
  control: HTMLElement;
  destroy(): void;
}

export type ModeFactory = () => ModeView;
