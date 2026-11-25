type DiscountType = "percent" | "flat";

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON * Math.abs(value)) * 100) / 100;

export function calculateInvoiceTotals(
  subtotal: number,
  discountAmount: number,
  discountType: DiscountType | null,
  taxPercentage: number,
  shippingFee: number,
) {
  const invoiceSubtotal = roundMoney(subtotal);
  const discount =
    discountType === "percent"
      ? roundMoney(invoiceSubtotal * roundMoney(discountAmount) / 100)
      : roundMoney(discountAmount);
  const taxableAmount = discountType === null
    ? invoiceSubtotal
    : Math.max(0, invoiceSubtotal - discount);
  const tax = roundMoney(taxableAmount * roundMoney(taxPercentage) / 100);
  return {
    subtotal: invoiceSubtotal,
    discount,
    tax,
    total: roundMoney(invoiceSubtotal - discount + tax + roundMoney(shippingFee)),
  };
}
