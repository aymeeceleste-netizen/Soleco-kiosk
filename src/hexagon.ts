import type { HpState } from './state';

/**
 * The hexagon is the brand's heartbeat. CSS clip-path renders a regular
 * pointy-top hexagon whose color, glow and breathing rate change with state.
 * Position is set by the parent container (hero stage). The component itself
 * is just the visual.
 */
export class Hexagon {
  readonly el: HTMLDivElement;
  private state: HpState = 'heat';

  constructor() {
    const el = document.createElement('div');
    el.className = 'hexagon';
    el.dataset.state = this.state;

    const core = document.createElement('div');
    core.className = 'hexagon__core';
    el.appendChild(core);

    this.el = el;
  }

  setState(state: HpState): void {
    if (state === this.state) return;
    this.state = state;
    this.el.dataset.state = state;
  }

  getState(): HpState {
    return this.state;
  }
}
