export type InvoiceStatus = "Active" | "Completed" | "Rejected";

export interface InvoiceItem {
  id?: number | string;
  invoice_id?: number | string;
  item_description: string;
  unit_cost: number | string;
  quantity: number | string;
  total_amount?: number | string;
  total?: number | string;

  // Optional aliases for compatibility with different API responses
  description?: string;
  item_name?: string;
  rate?: number | string;
  unit_price?: number | string;
  qty?: number | string;

  [key: string]: unknown;
}

export interface InvoiceCurrency {
  id?: number | string;
  sn?: string;
  customerid?: string;
  country_name?: string;
  currency?: string;
  symbol?: string;
}

export interface AddInvoicePayload {
  invoice_number: string;
  purchase_order: string;
  company_details: string;
  bill_to: string;
  currency_id: number;
  invoice_date: string;
  due_date: string;
  notes_payment_terms: string;
  bank_account_details: string;
  tax_percentage: number;
  discount_type: "percent" | "flat";
  discount_amount: number;
  shipping_fee: number;
  items: InvoiceItem[];
}

export type UpdateInvoicePayload = Partial<AddInvoicePayload> & {
  status?: InvoiceStatus;
};

export interface InvoiceResponse
  extends Omit<
    Partial<AddInvoicePayload>,
    "tax_percentage" | "discount_amount" | "shipping_fee" | "items"
  > {
  id?: number | string;
  sn?: string | number;
  customerid?: string;

  status?: InvoiceStatus;
  Status?: InvoiceStatus;

  currency_symbol?: string;
  currency?: string | InvoiceCurrency;

  tax_percentage?: number | string;
  discount_amount?: number | string;
  shipping_fee?: number | string;

  subtotal?: number | string;
  total_amount?: number | string;
  grand_total?: number | string;

  items?: InvoiceItem[];
  invoice_items?: InvoiceItem[];
  invoiceItems?: InvoiceItem[];
  details?: InvoiceItem[];

  [key: string]: unknown;
}

export interface InvoiceApiResponse {
  message?: string;
  data?: InvoiceResponse;
}
