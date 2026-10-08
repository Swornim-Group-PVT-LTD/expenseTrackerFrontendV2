export interface InvoiceItem {
  item_description: string;
  unit_cost: number;
  quantity: number;
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
  discount_amount: number;
  shipping_fee: number;
  items: InvoiceItem[];
}

// Invoice Response
export interface InvoiceResponse extends AddInvoicePayload {
  id: number;
  sn: string;
  customerid: string;
  created_at?: string;
  updated_at?: string;
}