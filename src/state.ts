export type Mode = 'energie' | 'innen' | 'kaelte' | 'geraeusch' | 'kosten';
export type Lang = 'de' | 'en';
export type EnergieMode = 'heizen' | 'kuehlen';
export type HpState = 'heat' | 'cool' | 'error' | 'off';
export type HouseSize = 'klein' | 'mittel' | 'gross';
export type InnenStep = 1 | 2 | 3 | 4;

export interface KioskState {
  mode: Mode;
  lang: Lang;
  energieMode: EnergieMode;
  hpState: HpState;
  /** Active outside-temp stop for Energie/Heizen (-15, -7, 2, 7, 12 °C) */
  heatTempC: number;
  /** Active outside-temp stop for Energie/Kühlen (18, 25, 30, 35, 40 °C) */
  coolTempC: number;
  kaelteTempC: number;
  geraeuschDistanceM: number;
  houseSize: HouseSize;
  innenStep: InnenStep;
  innenPumpOpen: boolean;
  /** Persisted "Wärmestrom anzeigen" preference for the Innen heat-pump mode */
  innenShowHeat: boolean;
}

export const DEFAULT_STATE: KioskState = {
  mode: 'energie',
  lang: 'de',
  energieMode: 'heizen',
  hpState: 'heat',
  heatTempC: 7,
  coolTempC: 30,
  kaelteTempC: -7,
  geraeuschDistanceM: 5,
  houseSize: 'mittel',
  innenStep: 1,
  innenPumpOpen: false,
  innenShowHeat: true,
};

type Listener = (s: KioskState, prev: KioskState) => void;

class Store {
  private s: KioskState = { ...DEFAULT_STATE };
  private listeners = new Set<Listener>();

  get(): Readonly<KioskState> {
    return this.s;
  }

  set(patch: Partial<KioskState>): void {
    const prev = this.s;
    const next = { ...prev, ...patch };
    if (shallowEqual(prev, next)) return;
    this.s = next;
    this.listeners.forEach((fn) => fn(next, prev));
  }

  reset(): void {
    this.set({ ...DEFAULT_STATE });
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

function shallowEqual(a: KioskState, b: KioskState): boolean {
  const keys = Object.keys(a) as (keyof KioskState)[];
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export const store = new Store();
