"use client";

import React, { useEffect, useState } from "react";
import {
    ChevronDown,
    Info,
    Plus,
    Trash2,
} from "lucide-react";
import Swal from "sweetalert2";

// Services
import { getCurrencyService } from "@/app/services/catalogueServices/currencyCatalogueService";

// Types
import { CurrencyResponse } from "@/app/types/currencyType";

interface InvoiceItem {
    item_description: string;
    unit_cost: number | "";
    quantity: number | "";
}

interface InvoiceFormProps {
    onSuccess?: () => void;
}

export default function InvoiceForm({
    onSuccess,
}: InvoiceFormProps) {
    // ============================================================
    // BASIC INVOICE DETAILS
    // ============================================================

    const [invoiceNumber, setInvoiceNumber] =
        useState("SWOGRP-INV-1");

    const [purchaseOrder, setPurchaseOrder] =
        useState("SWOGRP-PUR-1");

    const [companyDetails, setCompanyDetails] = useState("");
    const [billTo, setBillTo] = useState("");

    const [invoiceDate, setInvoiceDate] = useState("");
    const [dueDate, setDueDate] = useState("");

    const [notesPaymentTerms, setNotesPaymentTerms] = useState("");
    const [bankAccountDetails, setBankAccountDetails] = useState("");

    // ============================================================
    // CURRENCY
    // ============================================================

    const [currencyList, setCurrencyList] = useState<CurrencyResponse[]>(
        []
    );

    const [currencyId, setCurrencyId] = useState<number | null>(null);
    const [currencySymbol, setCurrencySymbol] = useState("$");

    // ============================================================
    // TAX / DISCOUNT / SHIPPING
    // ============================================================

    const [taxPercentage, setTaxPercentage] = useState<number | "">(13);

    const [discountType, setDiscountType] =
        useState<"percent" | "flat">("percent");

    const [discountAmount, setDiscountAmount] =
        useState<number | "">(0);

    const [shippingFee, setShippingFee] =
        useState<number | "">(0);

    // ============================================================
    // ITEMS
    // ============================================================

    const [items, setItems] = useState<InvoiceItem[]>([
        {
            item_description: "",
            unit_cost: "",
            quantity: 1,
        },
    ]);

    const [loading, setLoading] = useState(false);

    // ============================================================
    // LOAD CURRENCIES
    // ============================================================

    useEffect(() => {
        const init = async () => {
            try {
                const currencies = await getCurrencyService();

                // Add AUD if it is not already available
                const hasAUD = currencies.some(
                    (item) =>
                        item.currency?.toUpperCase() === "AUD"
                );

                let updatedCurrencies = currencies;

                if (!hasAUD) {
                    const audCurrency = {
                        id: -1,
                        country_name: "Australia",
                        currency: "AUD",
                        symbol: "$",
                    } as CurrencyResponse;

                    updatedCurrencies = [
                        ...currencies,
                        audCurrency,
                    ];
                }

                setCurrencyList(updatedCurrencies);

                if (updatedCurrencies.length > 0) {
                    setCurrencyId(updatedCurrencies[0].id);
                    setCurrencySymbol(
                        updatedCurrencies[0].symbol
                    );
                }
            } catch (error) {
                console.error(
                    "Error loading currencies:",
                    error
                );
            }
        };

        init();
    }, []);

    // ============================================================
    // INPUT CLASS
    // ============================================================

    const inputClass = `
    w-full
    h-[52px]
    px-4
    rounded-xl
    border
    border-gray-200
    bg-gray-50
    text-base
    font-medium
    text-gray-800
    outline-none
    transition-all
    focus:border-[#64a11f]
    focus:bg-white
    focus:ring-4
    focus:ring-[#64a11f]/10
  `;

    const textareaClass = `
    w-full
    px-4
    py-3
    rounded-xl
    border
    border-gray-200
    bg-gray-50
    text-base
    font-medium
    text-gray-800
    outline-none
    resize-none
    transition-all
    focus:border-[#64a11f]
    focus:bg-white
    focus:ring-4
    focus:ring-[#64a11f]/10
  `;

    // ============================================================
    // ITEM FUNCTIONS
    // ============================================================

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                item_description: "",
                unit_cost: "",
                quantity: 1,
            },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length === 1) {
            return;
        }

        setItems(
            items.filter(
                (_, itemIndex) => itemIndex !== index
            )
        );
    };

    const handleItemChange = (
        index: number,
        field: keyof InvoiceItem,
        value: string
    ) => {
        const updatedItems = [...items];

        if (field === "item_description") {
            updatedItems[index].item_description = value;
        }

        if (field === "unit_cost") {
            updatedItems[index].unit_cost =
                value === "" ? "" : Number(value);
        }

        if (field === "quantity") {
            updatedItems[index].quantity =
                value === "" ? "" : Number(value);
        }

        setItems(updatedItems);
    };

    // ============================================================
    // CALCULATIONS
    // ============================================================

    const getItemTotal = (item: InvoiceItem) => {
        const cost = Number(item.unit_cost) || 0;
        const quantity = Number(item.quantity) || 0;

        return cost * quantity;
    };

    const subtotal = items.reduce(
        (total, item) =>
            total + getItemTotal(item),
        0
    );

    const discountValue =
        Number(discountAmount) || 0;

    const discount =
        discountType === "percent"
            ? subtotal * (discountValue / 100)
            : discountValue;

    const taxBase = Math.max(
        subtotal - discount,
        0
    );

    const tax =
        taxBase *
        ((Number(taxPercentage) || 0) / 100);

    const shipping =
        Number(shippingFee) || 0;

    const grandTotal =
        taxBase + tax + shipping;

    // ============================================================
    // VALIDATION
    // ============================================================

    const validateForm = () => {
        if (!invoiceNumber.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Invoice Number Required",
                text: "Please enter invoice number.",
            });

            return false;
        }

        if (!companyDetails.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Company Details Required",
                text: "Please enter company details.",
            });

            return false;
        }

        if (!billTo.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Bill To Required",
                text: "Please enter bill-to details.",
            });

            return false;
        }

        if (!currencyId) {
            Swal.fire({
                icon: "warning",
                title: "Select Currency",
                text: "Please select a currency.",
            });

            return false;
        }

        if (!invoiceDate) {
            Swal.fire({
                icon: "warning",
                title: "Invoice Date Required",
                text: "Please select invoice date.",
            });

            return false;
        }

        if (!dueDate) {
            Swal.fire({
                icon: "warning",
                title: "Due Date Required",
                text: "Please select due date.",
            });

            return false;
        }

        if (
            discountType === "percent" &&
            Number(discountAmount) > 100
        ) {
            Swal.fire({
                icon: "warning",
                title: "Invalid Discount",
                text: "Percentage discount cannot be more than 100%.",
            });

            return false;
        }

        if (Number(discountAmount) < 0) {
            Swal.fire({
                icon: "warning",
                title: "Invalid Discount",
                text: "Discount cannot be negative.",
            });

            return false;
        }

        for (const item of items) {
            if (!item.item_description.trim()) {
                Swal.fire({
                    icon: "warning",
                    title: "Item Description Required",
                    text: "Please enter item description.",
                });

                return false;
            }

            if (
                item.unit_cost === "" ||
                Number(item.unit_cost) <= 0
            ) {
                Swal.fire({
                    icon: "warning",
                    title: "Invalid Unit Cost",
                    text: "Please enter a valid unit cost.",
                });

                return false;
            }

            if (
                item.quantity === "" ||
                Number(item.quantity) <= 0
            ) {
                Swal.fire({
                    icon: "warning",
                    title: "Invalid Quantity",
                    text: "Please enter a valid quantity.",
                });

                return false;
            }
        }

        return true;
    };

    // ============================================================
    // SUBMIT
    // ============================================================

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // ========================================================
            // API REQUEST PAYLOAD
            // ========================================================

            const payload = {
                invoice_number: invoiceNumber,
                purchase_order: purchaseOrder,
                company_details: companyDetails,
                bill_to: billTo,
                currency_id: currencyId,
                invoice_date: invoiceDate,
                due_date: dueDate,
                notes_payment_terms: notesPaymentTerms,
                bank_account_details: bankAccountDetails,
                tax_percentage:
                    Number(taxPercentage) || 0,
                discount_amount:
                    Number(discountAmount) || 0,
                discount_type: discountType,
                shipping_fee:
                    Number(shippingFee) || 0,

                items: items.map((item) => ({
                    item_description:
                        item.item_description,
                    unit_cost:
                        Number(item.unit_cost),
                    quantity:
                        Number(item.quantity),
                })),
            };

            // ========================================================
            // CONNECT YOUR API SERVICE HERE
            // ========================================================

            console.log(
                "Invoice Payload:",
                payload
            );

            /*
            Example:

            await addInvoiceService(payload);
            */

            // ========================================================
            // AUTO GENERATE NEXT INVOICE / PURCHASE NUMBER
            // ========================================================

            const currentInvoiceNumber =
                Number(
                    invoiceNumber.replace(
                        "SWOGRP-INV-",
                        ""
                    )
                ) || 0;

            const currentPurchaseOrder =
                Number(
                    purchaseOrder.replace(
                        "SWOGRP-PUR-",
                        ""
                    )
                ) || 0;

            const nextInvoiceNumber =
                currentInvoiceNumber + 1;

            const nextPurchaseOrder =
                currentPurchaseOrder + 1;

            Swal.fire({
                icon: "success",
                title: "Invoice Added!",
                text: "Invoice has been added successfully.",
                timer: 2000,
                showConfirmButton: false,
            });

            onSuccess?.();

            // ========================================================
            // RESET FORM
            // ========================================================

            setInvoiceNumber(
                `SWOGRP-INV-${nextInvoiceNumber}`
            );

            setPurchaseOrder(
                `SWOGRP-PUR-${nextPurchaseOrder}`
            );

            setCompanyDetails("");
            setBillTo("");
            setInvoiceDate("");
            setDueDate("");
            setNotesPaymentTerms("");
            setBankAccountDetails("");

            setTaxPercentage(13);

            setDiscountType("percent");
            setDiscountAmount(0);

            setShippingFee(0);

            setItems([
                {
                    item_description: "",
                    unit_cost: "",
                    quantity: 1,
                },
            ]);
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Failed",
                text:
                    error?.message ||
                    "Failed to add invoice.",
            });
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // UI
    // ============================================================

    return (
        <div className="w-full">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="space-y-6">

                    {/* ==================================================
              INVOICE INFORMATION
          =================================================== */}

                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            Invoice Information
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            Enter the basic invoice details.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Invoice Number */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Invoice Number
                            </label>

                            <input
                                type="text"
                                placeholder="INV-2026-001"
                                className={inputClass}
                                value={invoiceNumber}
                                readOnly
                            />
                        </div>

                        {/* Purchase Order */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Purchase Order
                            </label>

                            <input
                                type="text"
                                placeholder="PO-1001"
                                className={inputClass}
                                value={purchaseOrder}
                                readOnly
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Currency
                            </label>

                            <div className="relative">
                                <select
                                    className={`${inputClass} appearance-none pr-12 cursor-pointer`}
                                    value={currencyId ?? ""}
                                    onChange={(e) => {
                                        const selected =
                                            currencyList.find(
                                                (item) =>
                                                    item.id ===
                                                    Number(
                                                        e.target.value
                                                    )
                                            );

                                        if (selected) {
                                            setCurrencyId(
                                                selected.id
                                            );

                                            setCurrencySymbol(
                                                selected.symbol
                                            );
                                        }
                                    }}
                                >
                                    {currencyList.map(
                                        (item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.symbol} -{" "}
                                                {item.currency}
                                            </option>
                                        )
                                    )}
                                </select>

                                <ChevronDown
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* Invoice Date */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Invoice Date
                            </label>

                            <input
                                type="date"
                                className={inputClass}
                                value={invoiceDate}
                                onChange={(e) =>
                                    setInvoiceDate(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Due Date
                            </label>

                            <input
                                type="date"
                                className={inputClass}
                                value={dueDate}
                                onChange={(e) =>
                                    setDueDate(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                    </div>

                    {/* ==================================================
              COMPANY DETAILS
          =================================================== */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Company Details
                            </label>

                            <textarea
                                rows={5}
                                placeholder={`Swornim Group Pvt. Ltd.
Kathmandu, Nepal
Phone: 9800000000`}
                                className={textareaClass}
                                value={companyDetails}
                                onChange={(e) =>
                                    setCompanyDetails(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Bill To
                            </label>

                            <textarea
                                rows={5}
                                placeholder={`Mero Real Estate Company Pvt. Ltd.
Kathmandu, Nepal`}
                                className={textareaClass}
                                value={billTo}
                                onChange={(e) =>
                                    setBillTo(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                    </div>

                    {/* ==================================================
              ITEMS
          =================================================== */}

                    <div className="border-t border-gray-100 pt-6">

                        <div className="flex items-center justify-between mb-4">

                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    Invoice Items
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Add products or services to this invoice.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  h-[42px]
                  rounded-xl
                  bg-[#64a11f]
                  hover:bg-[#579119]
                  text-white
                  font-semibold
                  text-sm
                  transition-all
                "
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>

                        </div>

                        <div className="space-y-4">

                            {items.map(
                                (item, index) => (

                                    <div
                                        key={index}
                                        className="
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    p-4
                  "
                                    >

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">

                                            {/* Description */}
                                            <div className="lg:col-span-6">
                                                <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                                    Item Description
                                                </label>

                                                <input
                                                    type="text"
                                                    placeholder="Website Development"
                                                    className={inputClass}
                                                    value={
                                                        item.item_description
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "item_description",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>

                                            {/* Unit Cost */}
                                            <div className="lg:col-span-2">
                                                <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                                    Unit Cost
                                                </label>

                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                                                        {
                                                            currencySymbol
                                                        }
                                                    </span>

                                                    <input
                                                        type="number"
                                                        placeholder="50000"
                                                        className={`${inputClass} pl-10`}
                                                        value={
                                                            item.unit_cost
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleItemChange(
                                                                index,
                                                                "unit_cost",
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {/* Quantity */}
                                            <div className="lg:col-span-2">
                                                <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                                    Quantity
                                                </label>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="1"
                                                    className={inputClass}
                                                    value={
                                                        item.quantity
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        handleItemChange(
                                                            index,
                                                            "quantity",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>

                                            {/* Total / Remove */}
                                            <div className="lg:col-span-2">

                                                <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                                    Total
                                                </label>

                                                <div className="flex gap-2">

                                                    <div
                                                        className="
                            flex
                            items-center
                            flex-1
                            h-[52px]
                            px-3
                            rounded-xl
                            bg-white
                            border
                            border-gray-200
                            font-bold
                            text-gray-800
                          "
                                                    >
                                                        {
                                                            currencySymbol
                                                        }
                                                        {getItemTotal(
                                                            item
                                                        ).toLocaleString()}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveItem(
                                                                index
                                                            )
                                                        }
                                                        disabled={
                                                            items.length ===
                                                            1
                                                        }
                                                        className="
                            w-[52px]
                            h-[52px]
                            rounded-xl
                            border
                            border-red-100
                            bg-red-50
                            text-red-500
                            flex
                            items-center
                            justify-center
                            hover:bg-red-100
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                          "
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    </div>

                    {/* ==================================================
              TAX / DISCOUNT / SHIPPING
          =================================================== */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Tax (%)
                            </label>

                            <input
                                type="number"
                                min="0"
                                className={inputClass}
                                value={taxPercentage}
                                onChange={(e) =>
                                    setTaxPercentage(
                                        e.target.value ===
                                            ""
                                            ? ""
                                            : Number(
                                                e.target
                                                    .value
                                            )
                                    )
                                }
                            />
                        </div>

                        {/* Discount */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Discount
                            </label>

                            <div className="flex gap-2">

                                <div className="relative w-[120px] shrink-0">
                                    <select
                                        className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                                        value={discountType}
                                        onChange={(e) =>
                                            setDiscountType(
                                                e.target
                                                    .value as
                                                | "percent"
                                                | "flat"
                                            )
                                        }
                                    >
                                        <option value="percent">
                                            Percent
                                        </option>

                                        <option value="flat">
                                            Flat
                                        </option>
                                    </select>

                                    <ChevronDown
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
                                    />
                                </div>

                                <input
                                    type="number"
                                    min="0"
                                    className={inputClass}
                                    value={discountAmount}
                                    onChange={(e) =>
                                        setDiscountAmount(
                                            e.target.value ===
                                                ""
                                                ? ""
                                                : Number(
                                                    e
                                                        .target
                                                        .value
                                                )
                                        )
                                    }
                                    placeholder={
                                        discountType ===
                                            "percent"
                                            ? "10"
                                            : "5000"
                                    }
                                />

                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Shipping Fee
                            </label>

                            <input
                                type="number"
                                min="0"
                                className={inputClass}
                                value={shippingFee}
                                onChange={(e) =>
                                    setShippingFee(
                                        e.target.value ===
                                            ""
                                            ? ""
                                            : Number(
                                                e.target
                                                    .value
                                            )
                                    )
                                }
                            />
                        </div>

                    </div>

                    {/* ==================================================
              TOTAL SUMMARY
          =================================================== */}

                    <div className="flex justify-end">

                        <div className="w-full md:w-[360px] rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-3">

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Subtotal
                                </span>

                                <span className="font-semibold">
                                    {currencySymbol}
                                    {subtotal.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Discount{" "}
                                    {discountType ===
                                        "percent"
                                        ? `(${discountAmount || 0}%)`
                                        : "(Flat)"}
                                </span>

                                <span className="font-semibold">
                                    - {currencySymbol}
                                    {discount.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Tax (
                                    {taxPercentage ||
                                        0}
                                    %)
                                </span>

                                <span className="font-semibold">
                                    {currencySymbol}
                                    {tax.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Shipping
                                </span>

                                <span className="font-semibold">
                                    {currencySymbol}
                                    {shipping.toLocaleString()}
                                </span>
                            </div>

                            <div className="border-t border-gray-200 pt-3 flex justify-between">
                                <span className="font-bold text-gray-800">
                                    Grand Total
                                </span>

                                <span className="font-bold text-lg text-[#64a11f]">
                                    {currencySymbol}
                                    {grandTotal.toLocaleString()}
                                </span>
                            </div>

                        </div>

                    </div>

                    {/* ==================================================
              NOTES / BANK
          =================================================== */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Notes / Payment Terms
                            </label>

                            <textarea
                                rows={4}
                                placeholder="Payment due within 15 days."
                                className={textareaClass}
                                value={notesPaymentTerms}
                                onChange={(e) =>
                                    setNotesPaymentTerms(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-[#374151]">
                                Bank Account Details
                            </label>

                            <textarea
                                rows={4}
                                placeholder={`Bank: Nabil Bank
Account No: 1234567890`}
                                className={textareaClass}
                                value={bankAccountDetails}
                                onChange={(e) =>
                                    setBankAccountDetails(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                    </div>

                    {/* ==================================================
              INFORMATION
          =================================================== */}

                    <div className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-gray-100
            bg-gray-50
            px-4
            py-3
          ">

                        <div className="
              flex
              items-center
              justify-center
              w-8
              h-8
              rounded-lg
              bg-[#64a11f]/10
              shrink-0
            ">
                            <Info
                                className="w-4 h-4 text-[#64a11f]"
                                strokeWidth={2.5}
                            />
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-[#374151]">
                                Invoice
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                Review all invoice details and items before
                                submitting.
                            </p>
                        </div>

                    </div>

                    {/* ==================================================
              SUBMIT
          =================================================== */}

                    <div className="border-t border-gray-100 pt-5">

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`
                w-full
                h-[56px]
                rounded-xl
                bg-[#64a11f]
                hover:bg-[#579119]
                active:scale-[0.98]
                text-white
                font-bold
                text-base
                shadow-sm
                transition-all
                flex
                items-center
                justify-center
                gap-3
                ${loading
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }
              `}
                        >
                            {loading ? (
                                "Saving..."
                            ) : (
                                <>
                                    <span>
                                        Create Invoice
                                    </span>
                                    <span className="text-xl">
                                        →
                                    </span>
                                </>
                            )}
                        </button>

                    </div>

                </div>
            </div>
        </div>
    );
}