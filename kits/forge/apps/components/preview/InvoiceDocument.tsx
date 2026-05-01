"use client";

import type { InvoiceData } from "@/lib/types";

interface Props {
  invoice: InvoiceData;
  signature: string | null;
  invoiceNumber: string;
  currency: string;
}

export default function InvoiceDocument({
  invoice,
  signature,
  invoiceNumber,
  currency,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      id="invoice-document"
      className="document-surface p-10 sm:p-14 rounded-lg shadow-xl"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-10 pb-6 border-b border-gray-300">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {invoice.freelancer.name}
          </p>
          <p className="text-xs text-gray-500 whitespace-pre-line mt-1">
            {invoice.freelancer.address}
          </p>
          <p className="text-xs text-gray-500">{invoice.freelancer.country}</p>
          <p className="text-xs text-gray-500">{invoice.freelancer.email}</p>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-800 tracking-wide">
            INVOICE
          </h1>
          <p className="text-xs text-gray-500 mt-2">{invoiceNumber}</p>
        </div>
      </div>

      {/* Bill To + Dates */}
      <div className="flex justify-between mb-10">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Bill To
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {invoice.client.name}
          </p>
          <p className="text-xs text-gray-500 whitespace-pre-line mt-1">
            {invoice.client.address}
          </p>
          <p className="text-xs text-gray-500">{invoice.client.country}</p>
          <p className="text-xs text-gray-500">{invoice.client.email}</p>
        </div>
        <div className="text-right">
          <div className="mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Invoice Date
            </p>
            <p className="text-sm text-gray-700">{invoice.header.invoice_date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Due Date
            </p>
            <p className="text-sm text-gray-700">{invoice.header.due_date}</p>
          </div>
        </div>
      </div>

      {/* Project Title */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Project
        </p>
        <p className="text-base font-semibold text-gray-800">
          {invoice.header.project_title}
        </p>
      </div>

      {/* Line Items Table */}
      <div className="mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="text-center py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                Qty
              </th>
              <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                Rate
              </th>
              <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-3 text-gray-700">{item.description}</td>
                <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 text-right text-gray-600">
                  {currency} {item.rate}
                </td>
                <td className="py-3 text-right font-medium text-gray-800">
                  {currency} {item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex justify-end mb-10">
        <div className="w-48 border-t-2 border-gray-800 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">Total</span>
            <span className="text-lg font-bold text-gray-800">
              {currency} {invoice.totals.total}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      {invoice.payment_instructions && (
        <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Payment Instructions
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {invoice.payment_instructions}
          </p>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Notes
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Signature */}
      <div className="mt-12 pt-8 border-t border-gray-300">
        <div className="max-w-[250px]">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {invoice.freelancer.name}
          </p>
          <div className="h-16 border-b border-gray-400 flex items-end pb-1">
            {signature ? (
              <img
                src={signature}
                alt="Signature"
                className="h-14 object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400 italic">
                Awaiting signature
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Date: {today}</p>
        </div>
      </div>
    </div>
  );
}
