import { useState } from 'react';
import { Printer, X } from 'lucide-react';

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

export function PrintButton({ invoice }) {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=800,height=900');
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 40px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px; }
    .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .brand span { color: #f59e0b; }
    .inv-label { text-align: right; }
    .inv-label h2 { font-size: 22px; font-weight: 700; color: #333; }
    .inv-label .inv-num { font-family: monospace; font-size: 14px; color: #f59e0b; margin-top: 4px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .meta-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 14px; }
    .meta-box h4 { font-size: 10px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
    .meta-box p { font-size: 13px; color: #222; line-height: 1.6; }
    .meta-box .highlight { font-weight: 600; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #1c1c1e; color: #fff; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 10px 14px; border-bottom: 1px solid #eee; }
    .amount { text-align: right; font-family: monospace; }
    .totals-table { width: 320px; margin-left: auto; }
    .totals-table td { padding: 6px 14px; }
    .totals-table .grand-total td { background: #1c1c1e; color: #fff; font-weight: 700; font-size: 15px; border-radius: 4px; }
    .totals-table .grand-total .amount { color: #f59e0b; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
      background: ${invoice.status === 'PAID' ? '#d1fae5' : invoice.status === 'DISPUTED' ? '#fee2e2' : '#fef3c7'};
      color: ${invoice.status === 'PAID' ? '#065f46' : invoice.status === 'DISPUTED' ? '#991b1b' : '#92400e'}; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; display: flex; justify-content: space-between; color: #999; font-size: 11px; }
    .notes { margin-top: 16px; padding: 12px 16px; background: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 12px; color: #666; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Haul<span>Sync</span></div>
      <div style="color:#999;font-size:12px;margin-top:4px;">Logistics Operating System</div>
    </div>
    <div class="inv-label">
      <h2>INVOICE</h2>
      <div class="inv-num">${invoice.invoiceNumber}</div>
      <div style="margin-top:8px"><span class="status-badge">${invoice.status}</span></div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <h4>Bill To</h4>
      <p class="highlight">${invoice.company?.name || '—'}</p>
      ${invoice.company?.email ? `<p>${invoice.company.email}</p>` : ''}
      ${invoice.company?.phone ? `<p>${invoice.company.phone}</p>` : ''}
      ${invoice.company?.address ? `<p>${invoice.company.address}</p>` : ''}
    </div>
    <div class="meta-box">
      <h4>Invoice Details</h4>
      <p><b>Invoice Date:</b> ${fmtDate(invoice.invoiceDate)}</p>
      ${invoice.dueDate ? `<p><b>Due Date:</b> ${fmtDate(invoice.dueDate)}</p>` : ''}
      ${invoice.paidDate ? `<p><b>Paid Date:</b> ${fmtDate(invoice.paidDate)}</p>` : ''}
      <p><b>Currency:</b> ${invoice.currency || 'INR'}</p>
    </div>
  </div>

  ${invoice.shipment ? `
  <div class="meta-box" style="margin-bottom:24px">
    <h4>Shipment Details</h4>
    <p><b>Shipment #:</b> ${invoice.shipment.shipmentNumber}</p>
    <p><b>Route:</b> ${invoice.shipment.originCity} → ${invoice.shipment.destCity}</p>
    ${invoice.shipment.loadingDate ? `<p><b>Loading Date:</b> ${fmtDate(invoice.shipment.loadingDate)}</p>` : ''}
  </div>` : ''}

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="amount">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Freight Charges — ${invoice.shipment?.originCity || ''} to ${invoice.shipment?.destCity || ''}</td>
        <td class="amount">₹${fmt(invoice.freightAmount)}</td>
      </tr>
      ${invoice.gstAmount > 0 ? `<tr><td>GST / Tax</td><td class="amount">₹${fmt(invoice.gstAmount)}</td></tr>` : ''}
    </tbody>
  </table>

  <table class="totals-table">
    <tr>
      <td>Subtotal (Freight)</td>
      <td class="amount">₹${fmt(invoice.freightAmount)}</td>
    </tr>
    ${invoice.gstAmount > 0 ? `<tr><td>GST</td><td class="amount">₹${fmt(invoice.gstAmount)}</td></tr>` : ''}
    <tr class="grand-total">
      <td><b>TOTAL DUE</b></td>
      <td class="amount"><b>₹${fmt(invoice.totalAmount)}</b></td>
    </tr>
  </table>

  ${invoice.notes ? `<div class="notes"><b>Notes:</b> ${invoice.notes}</div>` : ''}

  <div class="footer">
    <span>HaulSync Logistics OS · Generated ${new Date().toLocaleString('en-IN')}</span>
    <span>This is a system-generated invoice.</span>
  </div>
</body>
</html>`;
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 400);
    setOpen(false);
  };

  return (
    <button
      onClick={handlePrint}
      className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"
      title="Print invoice"
    >
      <Printer size={13} /> Print
    </button>
  );
}
