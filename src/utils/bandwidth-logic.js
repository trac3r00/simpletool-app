export function toBytes(value, unit, binary = false) {
  const multipliers = {
    B: 1,
    KB: binary ? 1024 : 1e3,
    MB: binary ? 1024 ** 2 : 1e6,
    GB: binary ? 1024 ** 3 : 1e9,
    TB: binary ? 1024 ** 4 : 1e12,
    KiB: 1024,
    MiB: 1024 ** 2,
    GiB: 1024 ** 3,
    TiB: 1024 ** 4,
  };
  if (!Number.isFinite(value) || value <= 0 || !(unit in multipliers)) {
    return null;
  }
  return value * multipliers[unit];
}

export function toBitsPerSecond(value, unit) {
  if (!Number.isFinite(value) || value <= 0 || !["bps", "Kbps", "Mbps", "Gbps", "Tbps"].includes(unit)) {
    return null;
  }
  if (unit === "bps") return value;
  if (unit === "Kbps") return value * 1e3;
  if (unit === "Mbps") return value * 1e6;
  if (unit === "Gbps") return value * 1e9;
  return value * 1e12;
}

export function calculateTransferTime(bytes, bitsPerSecond, efficiencyPercent = 100) {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0 ||
    !Number.isFinite(bitsPerSecond) ||
    bitsPerSecond <= 0 ||
    !Number.isFinite(efficiencyPercent) ||
    efficiencyPercent <= 0 ||
    efficiencyPercent > 100
  ) {
    return null;
  }
  return (bytes * 8) / (bitsPerSecond * (efficiencyPercent / 100));
}
