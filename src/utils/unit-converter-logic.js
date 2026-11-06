// Factors are exact by definition (NIST SP 811 appendix B, SI Brochure 9th ed.)
// except mmHg and BTU, which carry NIST's published values. Each category's base
// unit has factor 1. Temperature is affine and handled by convertUnit.
export const UNIT_CATEGORIES = [
  { id: "length", icon: "straighten", units: [
    ["m", "Meter (m)", 1], ["km", "Kilometer (km)", 1000], ["cm", "Centimeter (cm)", 0.01],
    ["mm", "Millimeter (mm)", 0.001], ["um", "Micrometer (µm)", 1e-6], ["nm", "Nanometer (nm)", 1e-9],
    ["mi", "Mile (mi)", 1609.344], ["nmi", "Nautical mile (nmi)", 1852], ["yd", "Yard (yd)", 0.9144],
    ["ft", "Foot (ft)", 0.3048], ["in", "Inch (in)", 0.0254],
  ] },
  { id: "weight", icon: "monitor_weight", units: [
    ["kg", "Kilogram (kg)", 1], ["g", "Gram (g)", 0.001], ["mg", "Milligram (mg)", 1e-6],
    ["ton", "Metric Ton (t)", 1000], ["lb", "Pound (lb)", 0.45359237], ["oz", "Ounce (oz)", 0.028349523125],
    ["st", "Stone (st)", 6.35029318], ["ust", "Short ton (US ton)", 907.18474],
  ] },
  { id: "temperature", icon: "thermostat", units: [
    ["c", "Celsius (°C)", null], ["f", "Fahrenheit (°F)", null], ["k", "Kelvin (K)", null],
  ] },
  { id: "volume", icon: "water_drop", units: [
    ["l", "Liter (L)", 1], ["ml", "Milliliter (mL)", 0.001], ["m3", "Cubic Meter (m³)", 1000],
    ["gal", "Gallon (US gal)", 3.785411784], ["qt", "Quart (US qt)", 0.946352946],
    ["pt", "Pint (US pt)", 0.473176473], ["cup", "Cup (US cup)", 0.2365882365],
    ["floz", "Fl. Ounce (US fl oz)", 0.0295735295625], ["tbsp", "Tablespoon (US tbsp)", 0.01478676478125],
    ["tsp", "Teaspoon (US tsp)", 0.00492892159375], ["ukgal", "Gallon (UK gal)", 4.54609],
  ] },
  { id: "area", icon: "crop_square", units: [
    ["m2", "Sq. Meter (m²)", 1], ["km2", "Sq. Kilometer (km²)", 1e6], ["cm2", "Sq. Centimeter (cm²)", 0.0001],
    ["ha", "Hectare (ha)", 10000], ["acre", "Acre (acre)", 4046.8564224], ["mi2", "Sq. Mile (mi²)", 2589988.110336],
    ["ft2", "Sq. Foot (ft²)", 0.09290304], ["in2", "Sq. Inch (in²)", 0.00064516],
  ] },
  { id: "speed", icon: "speed", units: [
    ["ms", "Meter/sec (m/s)", 1], ["kmh", "Kilometer/hr (km/h)", 1 / 3.6], ["mph", "Mile/hr (mph)", 0.44704],
    ["kn", "Knot (kn)", 1852 / 3600], ["fts", "Foot/sec (ft/s)", 0.3048],
  ] },
  { id: "time", icon: "schedule", units: [
    ["s", "Second (s)", 1], ["ms", "Millisecond (ms)", 0.001], ["min", "Minute (min)", 60],
    ["hr", "Hour (hr)", 3600], ["day", "Day (day)", 86400], ["week", "Week (week)", 604800],
    ["month", "Month (avg, 30.436875 d)", 2629746], ["year", "Year (avg, 365.2425 d)", 31556952],
  ] },
  { id: "data", icon: "storage", units: [
    ["B", "Byte (B)", 1], ["bit", "Bit (b)", 0.125],
    ["KB", "Kilobyte (KB = 1000 B)", 1e3], ["MB", "Megabyte (MB)", 1e6], ["GB", "Gigabyte (GB)", 1e9],
    ["TB", "Terabyte (TB)", 1e12], ["PB", "Petabyte (PB)", 1e15],
    ["KiB", "Kibibyte (KiB = 1024 B)", 1024], ["MiB", "Mebibyte (MiB)", 1048576],
    ["GiB", "Gibibyte (GiB)", 1073741824], ["TiB", "Tebibyte (TiB)", 1099511627776],
    ["PiB", "Pebibyte (PiB)", 1125899906842624],
  ] },
  { id: "pressure", icon: "compress", units: [
    ["Pa", "Pascal (Pa)", 1], ["kPa", "Kilopascal (kPa)", 1000], ["bar", "Bar (bar)", 100000],
    ["atm", "Atmosphere (atm)", 101325], ["psi", "PSI (psi)", (0.45359237 * 9.80665) / (0.0254 * 0.0254)],
    ["mmHg", "mmHg (mmHg)", 133.322387415],
  ] },
  { id: "energy", icon: "bolt", units: [
    ["J", "Joule (J)", 1], ["kJ", "Kilojoule (kJ)", 1000], ["cal", "Calorie (cal, thermochemical)", 4.184],
    ["kcal", "Kilocalorie (kcal)", 4184], ["Wh", "Watt-hour (Wh)", 3600], ["kWh", "Kilowatt-hour (kWh)", 3600000],
    ["BTU", "BTU (IT)", 1055.05585262], ["eV", "Electronvolt (eV)", 1.602176634e-19],
  ] },
];

// Returns the converted number, or null when the input is not finite, a unit id
// is unknown, or a temperature lies below absolute zero.
export function convertUnit(categories, categoryId, value, fromId, toId) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return null;
  const from = category.units.find((u) => u[0] === fromId);
  const to = category.units.find((u) => u[0] === toId);
  if (!from || !to) return null;

  if (categoryId === "temperature") {
    let kelvin;
    if (fromId === "c") kelvin = value + 273.15;
    else if (fromId === "f") kelvin = ((value - 32) * 5) / 9 + 273.15;
    else kelvin = value;
    if (kelvin < -1e-9) return null;
    if (fromId === toId) return value;
    if (toId === "k") return kelvin;
    if (toId === "c") return kelvin - 273.15;
    return ((kelvin - 273.15) * 9) / 5 + 32;
  }

  if (fromId === toId) return value;
  return (value * from[2]) / to[2];
}

export function formatUnitResult(num) {
  if (typeof num !== "number" || !Number.isFinite(num)) return "";
  if (num === 0) return "0";
  return String(parseFloat(num.toPrecision(12)));
}
