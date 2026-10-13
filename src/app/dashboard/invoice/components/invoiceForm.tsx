
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ChevronDown, Info, Plus, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

import { getCurrencyService } from "@/app/services/catalogueServices/currencyCatalogueService";
import {
    addInvoiceService,
    getInvoiceService,
} from "@/app/services/invoiceService";

import type { CurrencyResponse } from "@/app/types/currencyType";
import type {
    AddInvoicePayload,
    InvoiceResponse,
} from "@/app/types/invoiceType";

interface InvoiceItem {
    item_description: string;
    unit_cost: number | "";
    quantity: number | "";
}

interface InvoiceFormProps {
    onSuccess?: () => void;
}

interface CurrencyOption {
    id: number;
    currency: string;
    symbol: string;
    country_name?: string;
}

const GREEN = "#64a11f";

const createEmptyItem = (): InvoiceItem => ({
    item_description: "",
    unit_cost: "",
    quantity: 1,
});

function getRegisteredFirstName(): string {
    if (typeof window === "undefined") return "";

    const keys = ["user", "authUser", "userData", "auth_user"];

    for (const key of keys) {
        try {
            const stored = localStorage.getItem(key);

            if (!stored) continue;

            const parsed = JSON.parse(stored);

            const firstName =
                parsed?.first_name ??
                parsed?.firstName ??
                parsed?.user?.first_name ??
                parsed?.data?.first_name ??
                parsed?.data?.user?.first_name;

            if (typeof firstName === "string" && firstName.trim()) {
                return firstName.trim();
            }
        } catch {
            // Ignore values that are not JSON.
        }
    }

    const directName =
        localStorage.getItem("first_name") ??
        sessionStorage.getItem("first_name");

    if (directName?.trim()) return directName.trim();

    const cookie = document.cookie
        .split("; ")
        .find((value) => value.startsWith("first_name="));

    if (cookie) {
        return decodeURIComponent(cookie.split("=").slice(1).join("="));
    }

    return "";
}

function getNamePrefix(firstName: string): string {
    const cleaned = firstName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .toUpperCase();

    return cleaned.slice(0, 4) || "USER";
}

function normalizeInvoices(response: unknown): InvoiceResponse[] {
    if (Array.isArray(response)) {
        return response as InvoiceResponse[];
    }

    const result = response as {
        data?: unknown;
        invoices?: unknown;
    } | null;

    if (Array.isArray(result?.data)) {
        return result.data as InvoiceResponse[];
    }

    if (Array.isArray(result?.invoices)) {
        return result.invoices as InvoiceResponse[];
    }

    return [];
}

function normalizeCurrencies(response: unknown): CurrencyOption[] {
    let records: unknown = response;

    if (!Array.isArray(records)) {
        const result = response as {
            data?: unknown;
            currencies?: unknown;
        } | null;

        records = Array.isArray(result?.data)
            ? result.data
            : result?.currencies;
    }

    if (!Array.isArray(records)) return [];

    return (
        records as (CurrencyResponse & Record<string, unknown>)[]
    )
        .map((currency) => ({
            id: Number(
                currency.id ??
                currency.sn ??
                currency.currency_id ??
                0,
            ),
            currency: String(
                currency.currency ??
                currency.currency_code ??
                currency.code ??
                "",
            ),
            symbol: String(currency.symbol ?? ""),
            country_name: String(currency.country_name ?? ""),
        }))
        .filter((currency) => currency.id > 0 && currency.currency);
}

function getNextNumber(
    invoices: InvoiceResponse[],
    prefix: string,
    type: "INV" | "PUR",
): string {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const pattern = new RegExp(
        `^${escapedPrefix}-${type}-(\\d+)$`,
        "i",
    );

    let highest = 0;

    for (const invoice of invoices) {
        const value =
            type === "INV"
                ? invoice.invoice_number
                : invoice.purchase_order;

        if (!value) continue;

        const match = String(value).trim().match(pattern);

        if (match) {
            highest = Math.max(highest, Number(match[1]));
        }
    }

    return `${prefix}-${type}-${highest + 1}`;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSuccess }) => {
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [purchaseOrder, setPurchaseOrder] = useState("");

    const [companyDetails, setCompanyDetails] = useState("");
    const [billTo, setBillTo] = useState("");
    const [invoiceDate, setInvoiceDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [notesPaymentTerms, setNotesPaymentTerms] = useState("");
    const [bankAccountDetails, setBankAccountDetails] = useState("");

    const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
    const [currencyId, setCurrencyId] = useState<number | null>(null);
    const [currencyLoading, setCurrencyLoading] = useState(true);
    const [currencyError, setCurrencyError] = useState("");

    const [taxPercentage, setTaxPercentage] = useState<number | "">(13);
    const [discountAmount, setDiscountAmount] = useState<number | "">(0);
    const [discountType, setDiscountType] = useState<"percent" | "flat">(
        "percent",
    );
    const [shippingFee, setShippingFee] = useState<number | "">(0);

    const [items, setItems] = useState<InvoiceItem[]>([createEmptyItem()]);

    const [loadingNumbers, setLoadingNumbers] = useState(true);
    const [saving, setSaving] = useState(false);
    const [numberingError, setNumberingError] = useState("");

    const selectedCurrency = currencies.find(
        (currency) => currency.id === currencyId,
    );

    // Load available currencies dynamically.
    // The user must choose a currency for each new invoice.
    const loadSavedCurrency = useCallback(async () => {
        setCurrencyLoading(true);
        setCurrencyError("");

        try {
            const response = await getCurrencyService();
            const availableCurrencies = normalizeCurrencies(response);

            setCurrencies(availableCurrencies);

            // Never automatically select a currency.
            setCurrencyId(null);

            if (availableCurrencies.length === 0) {
                setCurrencyError(
                    "No currencies are available. Please check your currency service.",
                );
            }
        } catch (error) {
            console.error("Unable to load currencies:", error);

            setCurrencies([]);
            setCurrencyId(null);

            setCurrencyError(
                "Unable to load currencies. Please try again.",
            );
        } finally {
            setCurrencyLoading(false);
        }
    }, []);

    const loadInvoiceNumbers = useCallback(async () => {
        setLoadingNumbers(true);
        setNumberingError("");

        try {
            const firstName = getRegisteredFirstName();

            if (!firstName) {
                throw new Error(
                    "Registered first name was not found. Check your login profile storage.",
                );
            }

            const prefix = getNamePrefix(firstName);
            const response = await getInvoiceService();
            const invoices = normalizeInvoices(response);

            setInvoiceNumber(getNextNumber(invoices, prefix, "INV"));
            setPurchaseOrder(getNextNumber(invoices, prefix, "PUR"));
        } catch (error) {
            console.error("Unable to load invoice numbers:", error);

            setNumberingError(
                error instanceof Error
                    ? error.message
                    : "Unable to load invoice numbers.",
            );
        } finally {
            setLoadingNumbers(false);
        }
    }, []);

    useEffect(() => {
        void loadSavedCurrency();
        void loadInvoiceNumbers();
    }, [loadSavedCurrency, loadInvoiceNumbers]);

    const subtotal = items.reduce((total, item) => {
        return (
            total +
            (Number(item.unit_cost) || 0) *
            (Number(item.quantity) || 0)
        );
    }, 0);

    const calculatedDiscount =
        discountType === "percent"
            ? (subtotal * (Number(discountAmount) || 0)) / 100
            : Number(discountAmount) || 0;

    const calculatedTax =
        ((subtotal - calculatedDiscount) * (Number(taxPercentage) || 0)) /
        100;

    const grandTotal =
        subtotal -
        calculatedDiscount +
        calculatedTax +
        (Number(shippingFee) || 0);

    const formatAmount = (amount: number) =>
        new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

    const updateItem = (
        index: number,
        field: keyof InvoiceItem,
        value: string,
    ) => {
        setItems((previous) =>
            previous.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                        ...item,
                        [field]:
                            field === "item_description"
                                ? value
                                : value === ""
                                    ? ""
                                    : Number(value),
                    }
                    : item,
            ),
        );
    };

    const addItem = () => {
        setItems((previous) => [...previous, createEmptyItem()]);
    };

    const removeItem = (index: number) => {
        setItems((previous) =>
            previous.length === 1
                ? previous
                : previous.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    const resetForm = () => {
        setCompanyDetails("");
        setBillTo("");
        setInvoiceDate("");
        setDueDate("");
        setNotesPaymentTerms("");
        setBankAccountDetails("");
        setTaxPercentage(13);
        setDiscountAmount(0);
        setDiscountType("percent");
        setShippingFee(0);
        setItems([createEmptyItem()]);

        // Clear the currency selection so the next invoice
        // requires the user to choose its currency again.
        setCurrencyId(null);
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (saving || loadingNumbers || currencyLoading) return;

        if (numberingError || !invoiceNumber || !purchaseOrder) {
            await Swal.fire({
                icon: "warning",
                title: "Invoice Numbers Not Ready",
                text: "Please reload the invoice numbers before saving.",
                confirmButtonColor: GREEN,
            });
            return;
        }

        if (currencyError || currencyId === null || currencyId <= 0) {
            await Swal.fire({
                icon: "warning",
                title: "Invoice Currency Required",
                text:
                    currencyError ||
                    "Please choose a currency for this invoice.",
                confirmButtonColor: GREEN,
            });
            return;
        }

        if (!companyDetails.trim() || !billTo.trim()) {
            await Swal.fire({
                icon: "warning",
                title: "Required Fields",
                text: "Please enter company details and bill-to information.",
                confirmButtonColor: GREEN,
            });
            return;
        }

        if (!invoiceDate || !dueDate) {
            await Swal.fire({
                icon: "warning",
                title: "Date Required",
                text: "Please select both invoice date and due date.",
                confirmButtonColor: GREEN,
            });
            return;
        }

        if (dueDate < invoiceDate) {
            await Swal.fire({
                icon: "warning",
                title: "Invalid Due Date",
                text: "The due date cannot be earlier than the invoice date.",
                confirmButtonColor: GREEN,
            });
            return;
        }

        if (
            taxPercentage === "" ||
            Number(taxPercentage) < 0 ||
            discountAmount === "" ||
            Number(discountAmount) < 0 ||
            shippingFee === "" ||
            Number(shippingFee) < 0
        ) {
            await Swal.fire({
                icon: "warning",
                title: "Invalid Amount",
                text: "Tax, discount, and shipping must be zero or greater.",
                confirmButtonColor: GREEN,
            });
            return;
        }

        if (discountType === "percent" && Number(discountAmount) > 100) {
            await Swal.fire({
                icon: "warning",
                title: "Invalid Discount",
                text: "Percentage discount cannot exceed 100%.",
                confirmButtonColor: GREEN,
            });
            return;
        }

        if (discountType === "flat" && Number(discountAmount) > subtotal) {
            await Swal.fire({
                icon: "warning",
                title: "Invalid Discount",
                text: "Flat discount cannot exceed the subtotal.",
                confirmButtonColor: GREEN,
            });
            return;
        }

        const invalidItem = items.some(
            (item) =>
                !item.item_description.trim() ||
                item.unit_cost === "" ||
                Number(item.unit_cost) <= 0 ||
                item.quantity === "" ||
                Number(item.quantity) <= 0,
        );

        if (invalidItem) {
            await Swal.fire({
                icon: "warning",
                title: "Invalid Invoice Items",
                text: "Every item needs a description, positive unit cost, and positive quantity.",
                confirmButtonColor: GREEN,
            });
            return;
        }

        setSaving(true);

        try {
            const firstName = getRegisteredFirstName();

            if (!firstName) {
                throw new Error("Unable to identify the registered user.");
            }

            const prefix = getNamePrefix(firstName);
            const invoices = normalizeInvoices(await getInvoiceService());

            const nextInvoiceNumber = getNextNumber(invoices, prefix, "INV");
            const nextPurchaseOrder = getNextNumber(invoices, prefix, "PUR");

            const payload: AddInvoicePayload = {
                invoice_number: nextInvoiceNumber,
                purchase_order: nextPurchaseOrder,
                company_details: companyDetails.trim(),
                bill_to: billTo.trim(),
                currency_id: currencyId,
                invoice_date: invoiceDate,
                due_date: dueDate,
                notes_payment_terms: notesPaymentTerms.trim(),
                bank_account_details: bankAccountDetails.trim(),
                tax_percentage: Number(taxPercentage),
                discount_amount: Number(discountAmount),
                discount_type: discountType,
                shipping_fee: Number(shippingFee),
                items: items.map((item) => ({
                    item_description: item.item_description.trim(),
                    unit_cost: Number(item.unit_cost),
                    quantity: Number(item.quantity),
                })),
            };

            await addInvoiceService(payload);

            await Swal.fire({
                icon: "success",
                title: "Invoice Created",
                html: `
                    <div style="text-align:left">
                        <p><strong>Invoice Number:</strong> ${nextInvoiceNumber}</p>
                        <p><strong>Purchase Order:</strong> ${nextPurchaseOrder}</p>
                    </div>
                `,
                confirmButtonColor: GREEN,
            });

            resetForm();
            await loadInvoiceNumbers();
            onSuccess?.();
        } catch (error: unknown) {
            console.error("Invoice creation failed:", error);

            const apiError = error as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Record<string, string[]>;
                    };
                };
                message?: string;
            };

            const validationMessages = Object.values(
                apiError.response?.data?.errors ?? {},
            )
                .flat()
                .join("\n");

            await Swal.fire({
                icon: "error",
                title: "Unable to Save Invoice",
                text:
                    validationMessages ||
                    apiError.response?.data?.message ||
                    apiError.message ||
                    "Unable to save the invoice. Please try again.",
                confirmButtonColor: GREEN,
            });

            await loadInvoiceNumbers();
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#64a11f] focus:ring-2 focus:ring-[#64a11f]/20";

    const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Invoice Information
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Invoice and purchase order numbers are generated
                        from your registered first name.
                    </p>
                </div>

                {numberingError && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <Info size={18} className="mt-0.5 shrink-0" />
                        <div>
                            <p>{numberingError}</p>
                            <button
                                type="button"
                                onClick={() => void loadInvoiceNumbers()}
                                className="mt-2 font-semibold underline"
                            >
                                Retry loading numbers
                            </button>
                        </div>
                    </div>
                )}

                {currencyError && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <Info size={18} className="mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p>{currencyError}</p>
                            <button
                                type="button"
                                onClick={() => void loadSavedCurrency()}
                                className="mt-2 font-semibold underline"
                            >
                                Retry loading currencies
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label className={labelClass}>Invoice Number</label>
                        <input
                            value={loadingNumbers ? "Loading..." : invoiceNumber}
                            readOnly
                            className={`${inputClass} bg-gray-50 font-semibold`}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Purchase Order</label>
                        <input
                            value={loadingNumbers ? "Loading..." : purchaseOrder}
                            readOnly
                            className={`${inputClass} bg-gray-50 font-semibold`}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Company Details <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={companyDetails}
                            onChange={(event) =>
                                setCompanyDetails(event.target.value)
                            }
                            placeholder="Enter company name, address, and contact details"
                            rows={4}
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Bill To <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={billTo}
                            onChange={(event) => setBillTo(event.target.value)}
                            placeholder="Enter customer name, address, and contact details"
                            rows={4}
                            required
                            className={inputClass}
                        />
                    </div>

                    {/* Dynamically select the currency for this invoice */}
                    <div>
                        <label className={labelClass}>
                            Invoice Currency{" "}
                            <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <select
                                value={currencyId ?? ""}
                                onChange={(event) =>
                                    setCurrencyId(
                                        event.target.value
                                            ? Number(event.target.value)
                                            : null,
                                    )
                                }
                                required
                                disabled={
                                    currencyLoading || currencies.length === 0
                                }
                                className={`${inputClass} appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-gray-100`}
                            >
                                <option value="">
                                    {currencyLoading
                                        ? "Loading currencies..."
                                        : currencies.length === 0
                                            ? "No currencies available"
                                            : "Choose invoice currency"}
                                </option>

                                {currencies.map((currency) => (
                                    <option
                                        key={currency.id}
                                        value={currency.id}
                                    >
                                        {currency.currency}
                                        {currency.symbol
                                            ? ` (${currency.symbol})`
                                            : ""}
                                        {currency.country_name
                                            ? ` - ${currency.country_name}`
                                            : ""}
                                    </option>
                                ))}
                            </select>

                            <ChevronDown
                                size={17}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Invoice Date</label>
                        <input
                            type="date"
                            value={invoiceDate}
                            onChange={(event) =>
                                setInvoiceDate(event.target.value)
                            }
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            min={invoiceDate || undefined}
                            onChange={(event) => setDueDate(event.target.value)}
                            required
                            className={inputClass}
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Invoice Items
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Add the products or services included in this invoice.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                        style={{ backgroundColor: GREEN }}
                    >
                        <Plus size={16} />
                        Add Item
                    </button>
                </div>

                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-gray-200 p-4"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-800">
                                    Item {index + 1}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    disabled={items.length === 1}
                                    title="Remove item"
                                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                                <div className="md:col-span-6">
                                    <label className={labelClass}>
                                        Description
                                    </label>
                                    <input
                                        value={item.item_description}
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                "item_description",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Product or service description"
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div className="md:col-span-3">
                                    <label className={labelClass}>
                                        Unit Cost
                                    </label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={item.unit_cost}
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                "unit_cost",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                        required
                                        className={inputClass}
                                    />
                                </div>

                                <div className="md:col-span-3">
                                    <label className={labelClass}>
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={item.quantity}
                                        onChange={(event) =>
                                            updateItem(
                                                index,
                                                "quantity",
                                                event.target.value,
                                            )
                                        }
                                        required
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="mt-3 text-right text-sm text-gray-600">
                                Item Total:{" "}
                                <span className="font-semibold text-gray-900">
                                    {selectedCurrency?.symbol ?? ""}
                                    {formatAmount(
                                        (Number(item.unit_cost) || 0) *
                                        (Number(item.quantity) || 0),
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold text-gray-900">
                    Tax, Discount and Totals
                </h2>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label className={labelClass}>Tax (%)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={taxPercentage}
                            onChange={(event) =>
                                setTaxPercentage(
                                    event.target.value === ""
                                        ? ""
                                        : Number(event.target.value),
                                )
                            }
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Discount Type</label>
                        <select
                            value={discountType}
                            onChange={(event) =>
                                setDiscountType(
                                    event.target.value as "percent" | "flat",
                                )
                            }
                            className={inputClass}
                        >
                            <option value="percent">Percentage (%)</option>
                            <option value="flat">Flat Amount</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>
                            Discount{" "}
                            {discountType === "percent" ? "(%)" : "(Amount)"}
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={discountAmount}
                            onChange={(event) =>
                                setDiscountAmount(
                                    event.target.value === ""
                                        ? ""
                                        : Number(event.target.value),
                                )
                            }
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Shipping Fee</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={shippingFee}
                            onChange={(event) =>
                                setShippingFee(
                                    event.target.value === ""
                                        ? ""
                                        : Number(event.target.value),
                                )
                            }
                            required
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                    <div className="ml-auto max-w-md space-y-3">
                        <div className="flex justify-between gap-4 text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>
                                {selectedCurrency?.symbol ?? ""}
                                {formatAmount(subtotal)}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4 text-sm text-gray-600">
                            <span>Discount</span>
                            <span>
                                -{selectedCurrency?.symbol ?? ""}
                                {formatAmount(calculatedDiscount)}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4 text-sm text-gray-600">
                            <span>Tax ({Number(taxPercentage) || 0}%)</span>
                            <span>
                                {selectedCurrency?.symbol ?? ""}
                                {formatAmount(calculatedTax)}
                            </span>
                        </div>

                        <div className="flex justify-between gap-4 text-sm text-gray-600">
                            <span>Shipping Fee</span>
                            <span>
                                {selectedCurrency?.symbol ?? ""}
                                {formatAmount(Number(shippingFee) || 0)}
                            </span>
                        </div>

                        <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between gap-4 text-base font-bold text-gray-900">
                                <span>Grand Total</span>
                                <span style={{ color: GREEN }}>
                                    {selectedCurrency?.symbol ?? ""}
                                    {formatAmount(grandTotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold text-gray-900">
                    Payment Information
                </h2>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label className={labelClass}>
                            Notes / Payment Terms
                        </label>
                        <textarea
                            value={notesPaymentTerms}
                            onChange={(event) =>
                                setNotesPaymentTerms(event.target.value)
                            }
                            placeholder="Enter payment terms or additional notes"
                            rows={4}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Bank Account Details
                        </label>
                        <textarea
                            value={bankAccountDetails}
                            onChange={(event) =>
                                setBankAccountDetails(event.target.value)
                            }
                            placeholder="Enter bank name, account name, account number, SWIFT code"
                            rows={4}
                            className={inputClass}
                        />
                    </div>
                </div>
            </section>

            <div className="flex flex-wrap justify-end gap-3">
                <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Clear Form
                </button>

                <button
                    type="submit"
                    disabled={
                        loadingNumbers ||
                        currencyLoading ||
                        saving ||
                        Boolean(numberingError) ||
                        Boolean(currencyError) ||
                        currencies.length === 0
                    }
                    className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: GREEN }}
                >
                    {saving
                        ? "Saving Invoice..."
                        : loadingNumbers || currencyLoading
                            ? "Loading..."
                            : "Save Invoice"}
                </button>
            </div>
        </form>
    );
};

export default InvoiceForm;
