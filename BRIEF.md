# SOLECO Heat Pump Kiosk — Project Brief

## What this is

An interactive touchscreen kiosk that sits next to a real SOLECO air-water heat pump at trade expos in Switzerland. Visitors tap modes to learn how the machine works, why it costs less than oil heating, and what it can do for their home. Designed so an 8-year-old will play with it and a 55-year-old homeowner will leave with the SOLECO sales rep's contact info on their phone.

**Hardware target: iPad (11" or 12.9", landscape), running the kiosk as a Progressive Web App in Guided Access mode.** Deployable to any iPad without custom hardware.

## The product

SOLECO air-water heat pump, modulating, R290 refrigerant, A+++ energy class, operates -25°C to +40°C, three sizes (small / medium / large household). Has a glowing hexagon status indicator on the front: amber = heating, blue = cooling, red = error, white = off. The hexagon is the soul of the brand — it lights the cabinet from one corner like a small forge.

## Brand

- **Name:** SOLECO
- **Identity:** Swiss product, premium positioning, minimalist, warm. Not "tech-bro dark mode" — closer to a high-end appliance brand. Calm, confident, deliberately understated.
- **Primary accent:** amber `#F6A000` (the hexagon's heating color)
- **Secondary accent:** burnt orange `#DA7112`
- **Cooling state color:** blue (use a complement to the amber that reads cleanly — start with `#2E7CF6` and adjust)
- **Neutrals:** dark grey (near black for body), pure white, warm off-white for surfaces
- **Typography:** Inter, weights 400 and 500 only (no 600/700; they'll feel heavy against the rest of the brand)
- **Trust beats:** Swiss product, 25-year operating range, Swiss after-sales service. SOLECO needs to provide: years in business, units installed in Switzerland, certifications (EHPA, EN14511), warranty terms.

## Audience

Mixed expo public in German-speaking Switzerland. Three personas the design serves:

1. **Curious 8-year-old** — 20 seconds, parent looking elsewhere, wants spectacle
2. **38-year-old parent** — 2 minutes, will read captions, cost-curious
3. **55-year-old homeowner currently on oil** — 4 minutes, kicks tires, leaves with QR code or talks to staff

## The 24-hour memory anchor

The single thing a visitor should remember the next day:

> "A heat pump doesn't make heat — it moves it. So you get more energy out than you put in."

The cost-savings story (CHF 1,300+ saved per year vs oil heating) is the *consequence* of this fact, not a separate claim. Visitors who internalize the COP paradox derive the savings themselves and trust the result. Visitors who are just told "saves money" forget within an hour.

## Visual identity — what "premium" means here

We are explicitly NOT building:

- Dark "science museum" backgrounds with neon accents
- Saturated infographic colors (rainbow bars, blue/orange/teal everywhere)
- High information density (every label, number, formula visible at once)
- Constant ambient animation (fans always spinning, arrows always flowing)
- Skeumorphic icons (cute illustrations of fridges, etc.)

We ARE building:

- **Light surfaces** (warm off-white, `#FAF8F5` or similar) — Swedish/Swiss minimalism is *light*, not dark
- **One accent color used sparingly.** Amber appears on the active state, the hexagon, and key numbers. Everything else is greys.
- **Typography carries the meaning.** A homeowner sees `21 dB` in 64px Inter weight 500, with a one-line caption underneath, and trusts it more than any chart could communicate.
- **One thing visible at a time.** The current prototype shows arrows + slider + caption + COP number + temperature. Premium version shows: the heat pump, the slider, ONE number. Captions appear when relevant.
- **Real product photography for the hero.** SOLECO's actual product photo (provided in repo as `UpdatedHeatpump_no_background.png`), not a stylized SVG. Interactive overlays painted on top.
- **The hexagon is the protagonist.** Every mode, the hexagon's state reflects what's happening. It's the kiosk's heartbeat.
- **Quiet motion.** Things move when the user touches; otherwise they sit still. The fan turns slowly when idle, faster when engaged. Sound waves emanate only when Sound mode is active. The hexagon breathes amber subtly at idle.
- **Materials, not flat fills.** The "bills" in cost mode look like real paper. The cards have depth. Subtle shadows, no gradients.

## The five modes

Order: Energie → Innen → Kälte → Geräusch → Kosten

1. **Energie** — The COP hook. "1 kWh Strom → 5 kWh Wärme." Temperature slider drives arrow count from 2.6 (at -15°C) to 6.26 (at +12°C). Includes a Heizen / Kühlen sub-toggle that reverses the diagram and changes the hexagon from amber to blue.

2. **Innen** — "Folge der Wärme." Animated loop with four labelled stops: Aussenluft → Verdampfer → Kompressor → Kondensator. A glowing particle travels the loop. Tap Kompressor to see the bicycle-pump animation (this is the gem — the moment that makes the whole concept click). Heizen/Kühlen sub-toggle reverses particle direction.

3. **Kälte** — "Funktioniert bis -25°C." Frost overlay creeps in as the visitor drags the temperature slider toward -25°C. Hero is a horizontal bar chart: "Wärme pro 1 CHF Energie" — heat pump beats oil and electric heating at every temperature. The objection killer.

4. **Geräusch** — Sound waves pulse from the heat pump. Distance ruler from 1m to 20m. At each distance the dB reads out and the comparison reframes ("wie ein Gespräch" / "leiser als ein Kühlschrank"). The weakest mode; consider whether it earns its place once you've seen the other four working in production. May get cut to four modes total.

5. **Kosten** — The conversion mode. Two utility-bill stubs side by side: oil heating CHF 192/Monat, heat pump CHF 83/Monat. Saving headline ("Sie sparen CHF 26'000 in 20 Jahren") with a calculation footnote so a skeptic can verify on their phone calculator. Three tangible cards beneath: "8x Ski-Saison, 4x Mittelmeer-Kreuzfahrt, 1x neue Küche." Three house-size buttons rescale everything. CTA opens a QR modal for the visitor to scan and take their personalised numbers home.

## Verified (placeholder) numbers

These came from CTC's published EN14511 datasheet — same machine class. **MUST be verified against SOLECO's own datasheet before launch.** Treat as illustrative, not final.

| Outside temp | COP (708-class machine) | Heat output |
|---|---|---|
| +12°C | 6.26 | 6 kWh |
| +7°C  | 5.01 | 5 kWh |
| +2°C  | 4.34 | 4 kWh |
| -7°C  | 3.26 | 3 kWh |
| -15°C | 2.64 | 2.6 kWh |

Sound: 46 dB(A) at 1m, 27 dB(A) at 5m, 21 dB(A) at 10m, ~15 dB(A) at 20m
Operating range: -25°C to +40°C
Refrigerant: R290 (GWP 3)
Energy class: A+++
Seasonal performance: SCOP 5.04 (W35 average climate)

## Cost model (Switzerland, EFH)

| Hausgrösse | Öl/Jahr | WP/Jahr | Spar/20 Jahre |
|---|---|---|---|
| Klein 120m² | CHF 1'600 | CHF 700 | CHF 18'000 |
| Mittel 180m² | CHF 2'300 | CHF 1'000 | CHF 26'000 |
| Gross 250m² | CHF 3'200 | CHF 1'400 | CHF 36'000 |

Source: cross-referenced from BEKB, EnergieSchweiz, SRF (2024-2025 figures). Confirm with SOLECO sales before launch — Förderungen (cantonal subsidies) are NOT included; if added, the savings grow.

Tangible-equivalent baselines (CHF):
- Family ski season (4 passes): ~3'200
- Mediterranean cruise for 4: ~6'500
- Mid-range Swiss kitchen renovation: ~25'000

## Hardware target

**iPad as kiosk, running a PWA via Safari Add-to-Home-Screen + Guided Access.**

- **Primary device:** iPad 11" (1194×834 logical px, landscape)
- **Also supported:** iPad Pro 12.9" (1366×1024 logical px), iPad mini (1133×744 logical px)
- **Browser:** Safari 16+ (PWA capable)
- **Touch:** single-finger only, all multi-touch gestures disabled via CSS
- **Lockdown:** iOS Guided Access (Settings → Accessibility → Guided Access)
- **Connectivity:** offline-first; works without wifi after first load via Service Worker cache
- **Power:** wired to outlet at the stand. iPads cannot run a full expo day on battery if the screen stays lit.
- **Orientation:** locked to landscape (lockdown handled at the OS level via Guided Access; PWA manifest also requests landscape)
- **Stand:** any iPad floor stand or tabletop holder. Suggested: iPad floor stand at adult chest height (~110cm), tilted ~10° toward the visitor.

### Why iPad over a dedicated kiosk

- No custom hardware needed, available everywhere
- iOS is sandboxed and stable for unattended use
- Easy to scale: 2-3 iPads for a busy expo at no extra dev cost
- Can be repurposed after the expo for other uses
- Lower total cost than a Linux kiosk PC + monitor + stand

### Trade-offs to design around

- iOS Safari can rate-limit long-running animations on memory pressure → keep animations short, dispose of unused SVG nodes between modes
- Audio playback requires user gesture (no autoplay) → Geräusch mode's audio button is tap-to-play, no automatic sound
- iOS updates can interrupt overnight if Guided Access is disabled at end of day → train staff to lock the device
- Without an MDM, anyone could in theory escape Guided Access if they know the passcode → keep the passcode secret, train staff to monitor
- Safari aggressively reclaims memory on long sessions → the 20-second idle reset also fully unmounts and remounts the active mode, garbage-collecting any leaked DOM

## Take-home page (the actual sales conversion)

When the visitor scans the QR code in Kosten mode, they hit a mobile-optimized URL: `https://soleco.ch/expo?size=mittel&lang=de` (or wherever you host it). The page shows:

- Their selected size and savings
- A 4-sentence plain-language explanation of why a heat pump saves money
- 3 bullet points of spec highlights (COP, -25°C operating, 21 dB at 10m)
- A "Beratung anfragen" form (Name, Email, Phone, Postal code) → goes into SOLECO's CRM
- A SOLECO contact phone number for the impatient
- The full SOLECO product range as a teaser

This is the actual lead-capture mechanism. The kiosk's job is to make the visitor scan it; the page's job is to convert them. Build the page in parallel with the kiosk.

## Deployment plan

**Build:** Vite produces a static `dist/` folder. One HTML, one bundled JS, one CSS, plus assets, a Service Worker, and a Web App Manifest.

**Hosting:** Deploy to Cloudflare Pages (free tier, has CDN, supports custom domain) at e.g. `https://kiosk.soleco.ch`. Or Vercel, or any static host that serves over HTTPS (PWAs require HTTPS).

**iPad setup (per device):**

1. Charge to 100%, connect to power
2. Open Safari, navigate to `https://kiosk.soleco.ch`
3. Wait for first-load to fully complete (Service Worker caches everything)
4. Tap Share → Add to Home Screen → name it "SOLECO Kiosk"
5. Close Safari, open the home screen icon (now full-screen PWA, no Safari chrome)
6. iOS Settings → Accessibility → Guided Access → enable, set 6-digit passcode
7. From inside the kiosk app, triple-click the side button to start Guided Access → kiosk is locked to this app
8. Place in stand, connect power
9. To exit at end of expo: triple-click + passcode → exit Guided Access

**End of each expo day:** triple-click out of Guided Access, plug into power overnight. The Service Worker keeps the app cached so the next day starts instantly without internet.

## Open items requiring action

1. **SOLECO brand assets** — logo (SVG), exact brand colors (verify amber/orange hex), product photography (multiple angles)
2. **SOLECO datasheet** — replace all placeholder numbers with SOLECO-certified values
3. **Förderung values per kanton** — for the take-home page (kiosk stays generic)
4. **Real product audio recording** — for Geräusch mode (optional; skip if not available)
5. **Take-home URL** — coordinate with SOLECO's web team for hosting and CRM integration
6. **Trust beats** — SOLECO years in business, units installed, certifications, warranty terms
7. **iPad procurement** — at minimum 1 iPad 11", consider 2-3 for a busy expo
8. **iPad stand** — floor stand or tabletop holder, locked or secured to prevent theft

## What's NOT in v1 (explicitly cut)

- Email capture in the kiosk (Swiss visitors will not enter email at a public kiosk; QR code only)
- Staff-flag button (operationally complex, friction-heavy)
- Detailed exploded mechanical view (replaced by Innen's heat-journey)
- Kanton selector in cost mode (kept simple to maintain interaction speed)
- Current-fuel selector (kiosk is for oil-heating households; cooled in v2 if needed)
- Audio playback by default (rare to be useful, easy to break)
- Any ambient animation longer than 6 seconds (loses kid attention)
- Multi-touch gestures (disabled via CSS, not relied on for any interaction)
- Real-time data of any kind (no live weather, no live energy prices)
- Any feature requiring an internet connection mid-session

## Build order

1. Hero illustration / product photo prepared (the SOLECO photo is in repo root)
2. Mode shell — global layout, mode strip, language toggle, hexagon component
3. Mode 1 (Energie) with Heizen/Kühlen toggle — the hardest mode; if this works, the rest follow
4. Mode 5 (Kosten) — the conversion mode; build second so the path-to-conversion exists end-to-end
5. Mode 2 (Innen) with bicycle pump animation
6. Mode 3 (Kälte) with frost overlay and bar chart
7. Mode 4 (Geräusch) — last; consider cutting after seeing modes 1–5 in real interaction
8. QR modal + take-home page — parallel to mode 5 ideally
9. PWA manifest + Service Worker for offline-first behaviour
10. Idle attractor and 20s reset behavior
11. iPad-specific testing on real hardware (battery, memory, gesture handling, Guided Access flow)
