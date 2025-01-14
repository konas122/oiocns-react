export function round(n: number, decimalPlaces = 2) {
  n ||= 0;
  const rounded = Math.round(n * 10 ** decimalPlaces) / 10 ** decimalPlaces;
  // rounded产生的浮点误差不足以在toFixed中产生舍入
  return parseFloat(rounded.toFixed(decimalPlaces));
}
