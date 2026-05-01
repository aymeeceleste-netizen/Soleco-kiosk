import type { Lang } from './state';

type Dict = {
  brand: string;
  modes: {
    energie: { label: string; sub: string };
    innen: { label: string; sub: string };
    kaelte: { label: string; sub: string };
    geraeusch: { label: string; sub: string };
    kosten: { label: string; sub: string };
  };
  shellPlaceholderCaption: string;
  shellPlaceholderControl: string;
  energie: {
    caption: string;
    captionCool: string;
    electricityIn: string;
    fromAir: string;
    heatOut: string;
    coolOut: string;
    heizen: string;
    kuehlen: string;
    cop: string;
    notAvailable: string;
  };
  kosten: {
    captionHeat: string;
    billOil: string;
    billHp: string;
    perMonth: string;
    perYear: string;
    saveHeadline: (chf: string, years: number) => string;
    saveSub: (perMonth: string) => string;
    tangiblesIntro: string;
    tangibleSki: string;
    tangibleSkiSub: string;
    tangibleCruise: string;
    tangibleCruiseSub: string;
    tangibleKitchen: string;
    tangibleKitchenSub: string;
    sizeKlein: string;
    sizeMittel: string;
    sizeGross: string;
    cta: string;
  };
  innen: {
    captionDefault: string;
    captionPump: string;
    stops: { 1: { name: string; desc: string }; 2: { name: string; desc: string }; 3: { name: string; desc: string }; 4: { name: string; desc: string } };
    pumpHint: string;
    pumpClose: string;
  };
  kaelte: {
    caption: string;
    statusPill: (cop: string) => string;
    chartTitle: string;
    barHp: string;
    barOil: string;
    barElectric: string;
    perChf: string;
    objectionKill: string;
  };
  geraeusch: {
    caption: string;
    distance: (m: number) => string;
    refs: { gespraech: string; kuehlschrank: string; bibliothek: string; unhoerbar: string };
  };
  qr: {
    title: string;
    subtitle: string;
    close: string;
  };
  comingSoon: string;
};

const de: Dict = {
  brand: 'SOLECO',
  modes: {
    energie: { label: 'Energie', sub: '1 kWh → 5 kWh' },
    innen: { label: 'Innen', sub: 'Folge der Wärme' },
    kaelte: { label: 'Kälte', sub: 'Bis −25 °C' },
    geraeusch: { label: 'Geräusch', sub: 'Leiser als ein Kühlschrank' },
    kosten: { label: 'Kosten', sub: 'Ihre Ersparnis' },
  },
  shellPlaceholderCaption: 'Tippen Sie einen Modus, um zu starten.',
  shellPlaceholderControl: 'Modus wählen',
  energie: {
    caption:
      'Wärmepumpe macht keine Wärme — sie holt sie aus der Luft. Wie eine Velopumpe rückwärts.',
    captionCool: 'Im Sommer arbeitet sie umgekehrt: Sie holt Wärme aus dem Haus.',
    electricityIn: '1 kWh Strom',
    fromAir: 'aus der Luft (gratis)',
    heatOut: 'kWh Wärme',
    coolOut: 'kWh Kühlung',
    heizen: 'Heizen',
    kuehlen: 'Kühlen',
    cop: 'COP',
    notAvailable: 'Bei dieser Aussentemperatur wird nicht gekühlt.',
  },
  kosten: {
    captionHeat: 'Heizkosten: Heizöl gegen Wärmepumpe',
    billOil: 'Heizöl',
    billHp: 'Wärmepumpe',
    perMonth: '/Monat',
    perYear: 'pro Jahr',
    saveHeadline: (chf, years) => `Sie sparen CHF ${chf} in ${years} Jahren`,
    saveSub: (perMonth) => `Berechnung: CHF ${perMonth}/Monat × 240 Monate`,
    tangiblesIntro: 'Damit zahlen Sie zum Beispiel:',
    tangibleSki: 'Ski-Saison',
    tangibleSkiSub: '4 Pässe Familie',
    tangibleCruise: 'Mittelmeer-Kreuzfahrt',
    tangibleCruiseSub: '4 Personen, 1 Woche',
    tangibleKitchen: 'neue Küche',
    tangibleKitchenSub: 'Schweizer Mittelklasse',
    sizeKlein: 'Klein 120 m²',
    sizeMittel: 'Mittel 180 m²',
    sizeGross: 'Gross 250 m²',
    cta: 'Berechnung mitnehmen →',
  },
  qr: {
    title: 'Scannen Sie den Code für Ihre persönliche Berechnung',
    subtitle: 'Inklusive einem unverbindlichen Beratungsangebot',
    close: 'Schliessen',
  },
  innen: {
    captionDefault: 'Folge der Wärme — vier Stationen, ein geschlossener Kreis.',
    captionPump: 'Druck macht heiss — wie eine Velopumpe.',
    stops: {
      1: { name: 'Aussenluft', desc: 'Selbst bei −15 °C steckt Wärme in der Luft.' },
      2: { name: 'Verdampfer', desc: 'Das Kältemittel nimmt diese Wärme auf und verdampft.' },
      3: { name: 'Kompressor', desc: 'Druck verdichtet das Gas — und macht es heiss.' },
      4: { name: 'Kondensator', desc: 'Die Wärme geht ans Heizungswasser. Kreis schliesst sich.' },
    },
    pumpHint: 'Tippen Sie auf den Kompressor',
    pumpClose: 'Schliessen',
  },
  kaelte: {
    caption: 'Funktioniert bis −25 °C. Wärmepumpe schlägt Öl und Strom bei jeder Temperatur.',
    statusPill: (cop) => `COP ${cop} — funktioniert`,
    chartTitle: 'Wärme pro 1 CHF Energie',
    barHp: 'Wärmepumpe',
    barOil: 'Heizöl',
    barElectric: 'Elektroheizung',
    perChf: 'kWh pro CHF',
    objectionKill: 'Auch im kältesten Winter führt die Wärmepumpe.',
  },
  geraeusch: {
    caption: 'Aussengerät, A-bewertet (EN 12102).',
    distance: (m) => `In ${m} m Abstand`,
    refs: {
      gespraech: 'wie ein leises Gespräch',
      kuehlschrank: 'leiser als ein Kühlschrank',
      bibliothek: 'wie eine Bibliothek',
      unhoerbar: 'fast unhörbar',
    },
  },
  comingSoon: 'In Vorbereitung',
};

const en: Dict = {
  brand: 'SOLECO',
  modes: {
    energie: { label: 'Energy', sub: '1 kWh → 5 kWh' },
    innen: { label: 'Inside', sub: 'Follow the heat' },
    kaelte: { label: 'Cold', sub: 'Down to −25 °C' },
    geraeusch: { label: 'Sound', sub: 'Quieter than a fridge' },
    kosten: { label: 'Cost', sub: 'Your savings' },
  },
  shellPlaceholderCaption: 'Tap a mode to begin.',
  shellPlaceholderControl: 'Pick a mode',
  energie: {
    caption: 'A heat pump doesn’t make heat — it moves it from the air. Like a bicycle pump in reverse.',
    captionCool: 'In summer it runs in reverse — moving heat out of the house.',
    electricityIn: '1 kWh electricity',
    fromAir: 'from the air (free)',
    heatOut: 'kWh heat',
    coolOut: 'kWh cooling',
    heizen: 'Heating',
    kuehlen: 'Cooling',
    cop: 'COP',
    notAvailable: 'Cooling is not used at this outside temperature.',
  },
  kosten: {
    captionHeat: 'Heating cost: oil vs. heat pump',
    billOil: 'Oil heating',
    billHp: 'Heat pump',
    perMonth: '/month',
    perYear: 'per year',
    saveHeadline: (chf, years) => `You save CHF ${chf} over ${years} years`,
    saveSub: (perMonth) => `Calculation: CHF ${perMonth}/month × 240 months`,
    tangiblesIntro: 'For example, that pays for:',
    tangibleSki: 'ski season',
    tangibleSkiSub: '4 family passes',
    tangibleCruise: 'Mediterranean cruise',
    tangibleCruiseSub: '4 people, 1 week',
    tangibleKitchen: 'new kitchen',
    tangibleKitchenSub: 'Swiss mid-range',
    sizeKlein: 'Small 120 m²',
    sizeMittel: 'Medium 180 m²',
    sizeGross: 'Large 250 m²',
    cta: 'Take it home →',
  },
  qr: {
    title: 'Scan the code for your personalised calculation',
    subtitle: 'Includes a non-binding consultation offer',
    close: 'Close',
  },
  innen: {
    captionDefault: 'Follow the heat — four stations, one closed loop.',
    captionPump: 'Pressure makes it hot — like a bicycle pump.',
    stops: {
      1: { name: 'Outside air', desc: 'Even at −15 °C the air still holds heat.' },
      2: { name: 'Evaporator', desc: 'Refrigerant absorbs the heat and turns into gas.' },
      3: { name: 'Compressor', desc: 'Pressure squeezes the gas — and makes it hot.' },
      4: { name: 'Condenser', desc: 'Heat passes to the water circuit. Loop closes.' },
    },
    pumpHint: 'Tap the compressor',
    pumpClose: 'Close',
  },
  kaelte: {
    caption: 'Works down to −25 °C. The heat pump beats oil and electric heating at every temperature.',
    statusPill: (cop) => `COP ${cop} — running`,
    chartTitle: 'Heat per 1 CHF of energy',
    barHp: 'Heat pump',
    barOil: 'Oil heating',
    barElectric: 'Electric heater',
    perChf: 'kWh per CHF',
    objectionKill: 'Even in the coldest winter the heat pump leads.',
  },
  geraeusch: {
    caption: 'Outdoor unit, A-weighted (EN 12102).',
    distance: (m) => `At ${m} m distance`,
    refs: {
      gespraech: 'like a quiet conversation',
      kuehlschrank: 'quieter than a fridge',
      bibliothek: 'like a library',
      unhoerbar: 'almost inaudible',
    },
  },
  comingSoon: 'Coming soon',
};

const dicts: Record<Lang, Dict> = { de, en };

export function t(lang: Lang): Dict {
  return dicts[lang];
}
