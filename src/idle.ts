import { DEFAULT_STATE, store } from './state';

/**
 * 20-second idle reset. Any user touch or pointer activity resets the timer.
 * On expiry the kiosk returns to default state (Energie / Heizen / DE / +7 °C).
 *
 * Mode-level remount/teardown happens in shell.ts when state.mode changes —
 * we just push DEFAULT_STATE here.
 */

const IDLE_MS = 20_000;

export function installIdleReset(root: HTMLElement): () => void {
  let timer: number | undefined;

  const bump = (): void => {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      store.set({ ...DEFAULT_STATE });
    }, IDLE_MS);
  };

  const events: (keyof DocumentEventMap)[] = ['pointerdown', 'pointermove', 'touchstart'];
  events.forEach((ev) => root.addEventListener(ev, bump, { passive: true }));
  bump();

  return () => {
    if (timer !== undefined) window.clearTimeout(timer);
    events.forEach((ev) => root.removeEventListener(ev, bump));
  };
}
