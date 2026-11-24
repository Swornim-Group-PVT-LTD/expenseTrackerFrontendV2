export interface AddSavingPayload {
  add_saving: number;
  saving_category: string;
  want_to_deduct_from_balance: boolean;
}

export interface SavingResponse {
  id: number;
  sn: string;
  customerid: string;
  add_saving: number;
  total_saving: number;
  saving_category: string;
  created_date: string; // or Date
  updated_date: string; // or Date
  want_to_deduct_from_balance: boolean;
  is_transfer?: boolean;
  transferable_amount?: number;
  savings_deduction?: number | string | null;
  source_saving_id?: number | null;
  remarks?: string | null;
  currency?: string;
  symbol?: string;
}

export interface TotalSavingResponse {
  message: string;
  total_saving: number;
  currency: string;
  symbol: string;
}


export interface SavingTransferOption {
  saving_category: string;
  total_amount: number | string;
}

export interface SavingTransferPayload {
  saving_category: string;
  amount: string;
  transfer_key: string;
  remarks?: string;
}
