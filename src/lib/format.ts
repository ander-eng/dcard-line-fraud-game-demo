export function fmt(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}NT$ ${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}
