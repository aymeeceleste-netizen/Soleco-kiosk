export interface ModeView {
  hero: HTMLElement;
  caption: HTMLElement;
  control: HTMLElement;
  destroy(): void;
}

export type ModeFactory = () => ModeView;
