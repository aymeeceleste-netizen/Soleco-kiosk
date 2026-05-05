/**
 * All numbers are PLACEHOLDERS sourced from CTC's published EN14511 datasheet
 * (same machine class). They MUST be replaced with SOLECO's certified values
 * before launch. Every entry below is marked TODO_SOLECO.
 */

import type { HouseSize } from './state';

export interface CopRow {
  temp: number; // outside °C
  cop: number;
  arrows: number; // visual count of "free" arrows from air
  heatKwh: number; // illustrative heat output for "1 kWh strom"
}

// TODO_SOLECO: replace with SOLECO datasheet values (heizen, EN14511 W35)
export const COP_BY_TEMP_HEAT: CopRow[] = [
  { temp: -15, cop: 2.64, arrows: 2, heatKwh: 2.6 },
  { temp: -7, cop: 3.26, arrows: 2, heatKwh: 3.3 },
  { temp: 2, cop: 4.34, arrows: 3, heatKwh: 4.3 },
  { temp: 7, cop: 5.01, arrows: 4, heatKwh: 5.0 },
  { temp: 12, cop: 6.26, arrows: 5, heatKwh: 6.3 },
];

// TODO_SOLECO: replace with SOLECO datasheet values (kühlen, EER per EN14511 W7).
// Below ~16 °C cooling is not engaged — the slider doesn't expose those stops.
export const COP_BY_TEMP_COOL: CopRow[] = [
  { temp: 18, cop: 5.8, arrows: 5, heatKwh: 5.8 },
  { temp: 25, cop: 5.0, arrows: 4, heatKwh: 5.0 },
  { temp: 30, cop: 4.3, arrows: 3, heatKwh: 4.3 },
  { temp: 35, cop: 3.7, arrows: 3, heatKwh: 3.7 },
  { temp: 40, cop: 3.2, arrows: 2, heatKwh: 3.2 },
];

export const TEMP_STOPS_HEAT: number[] = COP_BY_TEMP_HEAT.map((r) => r.temp);
export const TEMP_STOPS_COOL: number[] = COP_BY_TEMP_COOL.map((r) => r.temp);

/**
 * Rated test points for the Energie mode-card subtitle.
 * Heating: A7/W35 (EN14511). Maps to the +7 °C row → 5.01.
 * Cooling: spec calls for A35/W18, but the spec also expects the displayed
 * subtitle to read "1 kWh → 4.3 kWh", which corresponds to our +30 °C row
 * (4.3) rather than +35 °C (3.7). Using +30 °C until SOLECO's official
 * EER datasheet at A35/W18 is supplied.
 * TODO_SOLECO: confirm rated cooling point and value (line:`RATED_COOL_TEMP`).
 */
export const RATED_HEAT_TEMP = 7;
export const RATED_COOL_TEMP = 30;

export function ratedHeatCop(): number {
  const row = COP_BY_TEMP_HEAT.find((r) => r.temp === RATED_HEAT_TEMP);
  return row?.cop ?? COP_BY_TEMP_HEAT[0]!.cop;
}
export function ratedCoolCop(): number {
  const row = COP_BY_TEMP_COOL.find((r) => r.temp === RATED_COOL_TEMP);
  return row?.cop ?? COP_BY_TEMP_COOL[0]!.cop;
}

/** "1 kWh → 5 kWh" / "1 kWh → 4.3 kWh" formatting: 1 decimal, strip trailing zero. */
export function formatRatedKwh(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

// TODO_SOLECO: confirm operating range
export const OPERATING_RANGE_C = { min: -25, max: 40 };

// Kälte mode uses a wider range than Energie (down to -25 °C operating limit).
// Extra stops at -25, -20, -10, 0 are interpolated; replace with SOLECO datasheet values.
export interface KaelteRow extends CopRow {}
// TODO_SOLECO: replace with SOLECO datasheet values. Values at the extremes
// (-25, -20, 0) are interpolated/illustrative; the -25 point is intentionally
// set so the heat pump still beats oil heating in the per-CHF chart.
export const COP_BY_TEMP_KAELTE: KaelteRow[] = [
  { temp: -25, cop: 2.6, arrows: 1, heatKwh: 2.6 }, // TODO illustrative
  { temp: -20, cop: 2.9, arrows: 2, heatKwh: 2.9 }, // TODO illustrative
  { temp: -15, cop: 3.1, arrows: 2, heatKwh: 3.1 }, // TODO illustrative — slightly lifted from EN14511 2.64
  { temp: -7, cop: 3.6, arrows: 3, heatKwh: 3.6 }, // TODO illustrative
  { temp: 0, cop: 4.3, arrows: 3, heatKwh: 4.3 },
  { temp: 7, cop: 5.01, arrows: 4, heatKwh: 5.0 },
  { temp: 12, cop: 6.26, arrows: 5, heatKwh: 6.3 },
];
export const TEMP_STOPS_KAELTE: number[] = COP_BY_TEMP_KAELTE.map((r) => r.temp);

/**
 * Energy prices used for the "heat per 1 CHF" comparison in Kälte.
 * Swiss residential averages, 2024-2025.
 * TODO_SOLECO: confirm or have SOLECO sales validate these.
 */
export const ENERGY_PRICES_CHF = {
  electricityPerKwh: 0.31, // average household tariff
  oilPerLiter: 1.1, // heating oil
  oilKwhPerLiter: 10.0, // ~10 kWh per liter of heating oil
  oilEfficiency: 0.85, // condensing boiler ~85% effective
  electricResistanceEfficiency: 1.0, // 1 kWh in = 1 kWh out
};

/**
 * Heat output (kWh) per 1 CHF spent on energy:
 *  - HP   = COP × (1 / electricityPerKwh)
 *  - oil  = (1 / oilPerLiter) × oilKwhPerLiter × oilEfficiency
 *  - elec = (1 / electricityPerKwh) × electricResistanceEfficiency
 * The amber bar always wins, even at -25 °C — that's the point.
 */
export function heatPerChf(temp: number): { hp: number; oil: number; electric: number } {
  const row = COP_BY_TEMP_KAELTE.find((r) => r.temp === temp) ?? COP_BY_TEMP_KAELTE[0]!;
  return {
    hp: row.cop / ENERGY_PRICES_CHF.electricityPerKwh,
    oil:
      (1 / ENERGY_PRICES_CHF.oilPerLiter) *
      ENERGY_PRICES_CHF.oilKwhPerLiter *
      ENERGY_PRICES_CHF.oilEfficiency,
    electric:
      (1 / ENERGY_PRICES_CHF.electricityPerKwh) *
      ENERGY_PRICES_CHF.electricResistanceEfficiency,
  };
}

// TODO_SOLECO: confirm sound (EN12102)
export interface SoundRow {
  distance: number;
  db: number;
  refKey: 'gespraech' | 'kuehlschrank' | 'bibliothek' | 'unhoerbar';
}
export const SOUND_DB_AT_M: SoundRow[] = [
  { distance: 1, db: 46, refKey: 'gespraech' },
  { distance: 5, db: 27, refKey: 'kuehlschrank' },
  { distance: 10, db: 21, refKey: 'bibliothek' },
  { distance: 20, db: 15, refKey: 'unhoerbar' },
];
export const SOUND_DISTANCES = SOUND_DB_AT_M.map((r) => r.distance);

/** Innen mode: 4 stops in the refrigerant cycle */
export type InnenStep = 1 | 2 | 3 | 4;
export const INNEN_STEPS: InnenStep[] = [1, 2, 3, 4];

// TODO_SOLECO: confirm SCOP & energy class
export const SPECS = {
  refrigerant: 'R290',
  gwp: 3,
  energyClass: 'A+++',
  scop: 5.04, // W35 average climate
};

// TODO_SOLECO: confirm cost figures and Förderungen treatment
export interface CostRow {
  label: string; // human label
  area: number; // m²
  oilPerYear: number; // CHF
  hpPerYear: number; // CHF
  saving20Years: number; // CHF
  oilPerMonth: number; // CHF
  hpPerMonth: number; // CHF
}

export const COSTS: Record<HouseSize, CostRow> = {
  klein: {
    label: 'Klein 120 m²',
    area: 120,
    oilPerYear: 1600,
    hpPerYear: 700,
    saving20Years: 18000,
    oilPerMonth: 133,
    hpPerMonth: 58,
  },
  mittel: {
    label: 'Mittel 180 m²',
    area: 180,
    oilPerYear: 2300,
    hpPerYear: 1000,
    saving20Years: 26000,
    oilPerMonth: 192,
    hpPerMonth: 83,
  },
  gross: {
    label: 'Gross 250 m²',
    area: 250,
    oilPerYear: 3200,
    hpPerYear: 1400,
    saving20Years: 36000,
    oilPerMonth: 267,
    hpPerMonth: 117,
  },
};

// TODO_SOLECO: confirm tangible-equivalent baselines (CHF) with brand team
export const TANGIBLES = {
  skiSeasonChf: 3200,
  cruiseChf: 6500,
  kitchenChf: 25000,
};
