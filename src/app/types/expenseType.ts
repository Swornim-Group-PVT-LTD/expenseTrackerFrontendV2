export interface AddExpensePayload {
  add_expenses: number;
  expense_category: string;
}

export interface ExpenseDocument {
  id: number;
  expense_sn: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
  updated_at: string;
  file_url: string;
}

export interface ExpenseResponse {
  id: number;
  sn: string;
  customerid: string;
  add_expenses: number;
  total_expenses: number;
  expense_category: string;

  // Receipt
  upload_receipt?: string | null;
  upload_receipt_url?: string | null;

  // Multiple documents
  documents?: ExpenseDocument[];

  created_date: string;
  updated_date: string;

  currency?: string;
  symbol?: string;
}

export interface TotalExpenseResponse {
  message: string;
  total_expenses: number;
  currency: string;
  symbol: string;
}
