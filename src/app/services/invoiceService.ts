// src/app/services/invoiceService.ts

import axios from "axios";
import BASE_URL from "@/app/urlConfig/urlConfig";

import type {
  AddInvoicePayload,
  InvoiceResponse,
  UpdateInvoicePayload,
} from "@/app/types/invoiceType";

// ------------------------------------------
// GET AUTH TOKEN
// ------------------------------------------

const getToken = (): string => {
  if (typeof document === "undefined") {
    throw new Error("Authentication is only available in the browser.");
  }

  const match = document.cookie.match(
    /(?:^|;\s*)access_token=([^;]+)/
  );

  if (!match) {
    throw new Error("No access_token found in cookies. Please login first.");
  }

  return decodeURIComponent(match[1]);
};

// ------------------------------------------
// ADD INVOICE
// ------------------------------------------

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
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to add invoice."
      );
    }

    throw new Error(
      error instanceof Error ? error.message : "Failed to add invoice."
    );
  }
};

// ------------------------------------------
// GET ALL INVOICES
// ------------------------------------------

export const getInvoiceService = async (): Promise<InvoiceResponse[]> => {
  try {
    const token = getToken();

    const response = await axios.get(
      `${BASE_URL}/api/invoices`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    // Supports either { data: [...] } or a direct array response.
    const responseData = response.data;

    const invoices: InvoiceResponse[] = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.data)
        ? responseData.data
        : [];

    return [...invoices].sort((a, b) => {
      const idA = Number(a.id ?? 0);
      const idB = Number(b.id ?? 0);
      return idA - idB;
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch invoices."
      );
    }

    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch invoices."
    );
  }
};

// ------------------------------------------
// GET INVOICE BY SERIAL NUMBER
// ------------------------------------------

export const getInvoiceBySnService = async (
  sn: string | number
): Promise<InvoiceResponse> => {
  try {
    const token = getToken();

    const response = await axios.get<InvoiceResponse>(
      `${BASE_URL}/api/invoices/${encodeURIComponent(String(sn))}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch invoice."
      );
    }

    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch invoice."
    );
  }
};

// Compatibility alias in case another component imports getInvoiceBySn.
export const getInvoiceBySn = getInvoiceBySnService;

// ------------------------------------------
// UPDATE INVOICE
// ------------------------------------------

export const updateInvoiceService = async (
  sn: string | number,
  payload: UpdateInvoicePayload
): Promise<InvoiceResponse> => {
  try {
    const token = getToken();

    const response = await axios.put<InvoiceResponse>(
      `${BASE_URL}/api/invoices/${encodeURIComponent(String(sn))}`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update invoice."
      );
    }

    throw new Error(
      error instanceof Error ? error.message : "Failed to update invoice."
    );
  }
};

export const deleteInvoiceService = async (
  sn: string | number
): Promise<void> => {
  const token = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("access_token="))
    ?.split("=")
    .slice(1)
    .join("=");

  await axios.delete(
    `${BASE_URL}/api/invoices/${encodeURIComponent(String(sn))}`,
    {
      withCredentials: true,
      headers: token
        ? {
            Authorization: `Bearer ${decodeURIComponent(token)}`,
          }
        : {},
    }
  );
};