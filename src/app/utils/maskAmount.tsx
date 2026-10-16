export function maskAmount(
  value: number | string | null | undefined,
  isVisible: boolean,
  currency: string | undefined,
): string {
  if (!isVisible) return `${currency ?? ""} XXXX.XX`;

  return `${currency ?? ""} ${Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}