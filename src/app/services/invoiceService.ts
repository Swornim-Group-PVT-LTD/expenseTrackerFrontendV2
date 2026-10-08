// services/InvoiceService.ts
import axios from "axios";
import BASE_URL from "@/app/urlConfig/urlConfig";
import {
  AddInvoicePayload,
  InvoiceResponse,
} from "../types/invoiceType";

// Helper to get token from cookies
const getToken = (): string => {
  const match = document.cookie.match(
    new RegExp("(^| )access_token=([^;]+)")
  );

  if (!match) {
    throw new Error("No access_token found in cookies. Please login first.");
  }

  return match[2];
};

// ----------------------------
// Add Invoice
// ----------------------------
export const addInvoiceService = async (
  payload: AddInvoicePayload
): Promise<InvoiceResponse> => {
  try {
    const token = getToken();

    const response = await axios.post<InvoiceResponse>(
      `${BASE_URL}/api/invoices`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to add Invoice"
    );
  }
};

// ----------------------------
// Get All Invoices
// ----------------------------
export const getInvoiceService = async (): Promise<InvoiceResponse[]> => {
  try {
    const token = getToken();

    const response = await axios.get(`${BASE_URL}/api/invoices`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    const invoices: InvoiceResponse[] = response.data?.data || [];

    // Sort by id ascending if available
    if (invoices.length > 0) {
      invoices.sort((a: any, b: any) => a.id - b.id);
    }

    return invoices;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch Invoices"
    );
  }
};

// ----------------------------
// Get Invoice by SN
// ----------------------------
export const getInvoiceBySnService = async (
  sn: string
): Promise<InvoiceResponse> => {
  try {
    const token = getToken();

    const response = await axios.get<InvoiceResponse>(
      `${BASE_URL}/api/invoices/${sn}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch Invoice"
    );
  }
};

// ----------------------------
// Update Invoice
// ----------------------------
export const updateInvoiceService = async (
  sn: string,
  payload: Partial<AddInvoicePayload>
): Promise<InvoiceResponse> => {
  try {
    const token = getToken();

    const response = await axios.put<InvoiceResponse>(
      `${BASE_URL}/api/invoices/${sn}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to update Invoice"
    );
  }
};