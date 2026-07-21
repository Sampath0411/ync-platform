import { jsPDF } from 'jspdf';

/**
 * Format a date string into a readable format.
 * @param {string|Date} date
 * @returns {string}
 */
function formatTicketDate(date) {
  if (!date) return 'TBD';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Draw a rounded rectangle on the PDF.
 * @param {jsPDF} doc
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r - Corner radius
 */
function roundedRect(doc, x, y, w, h, r) {
  doc.roundedRect(x, y, w, h, r, r);
}

/**
 * Draw a dashed line on the PDF.
 * @param {jsPDF} doc
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
function dashedLine(doc, x1, y1, x2, y2) {
  const segments = 60;
  const dx = (x2 - x1) / segments;
  const dy = (y2 - y1) / segments;
  for (let i = 0; i < segments; i += 2) {
    doc.line(
      x1 + dx * i,
      y1 + dy * i,
      x1 + dx * Math.min(i + 1, segments),
      y1 + dy * Math.min(i + 1, segments)
    );
  }
}

/**
 * Generate and download a professional PDF ticket for a YNC event.
 *
 * @param {Object} ticket - Ticket object with the following fields:
 *   @param {string} ticket.ticket_number - Unique ticket identifier
 *   @param {string} ticket.event_name - Name of the event
 *   @param {string} ticket.event_date - Date of the event (ISO string or any parseable format)
 *   @param {string} ticket.venue - Event venue
 *   @param {string} ticket.status - Ticket status (active, used, expired, cancelled)
 *   @param {string} [ticket.qr_code_data] - JSON string with QR code base64 data or URL
 *   @param {string} [ticket.user_name] - Name of the ticket holder
 *   @param {string} [ticket.booking_id] - Booking reference ID
 */
export default function downloadTicketPDF(ticket) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // ── Colors ──────────────────────────────────────────────
  const primaryColor = [79, 70, 229]; // indigo-600
  const primaryLight = [99, 102, 241]; // indigo-500
  const purpleColor = [147, 51, 234]; // purple-600
  const darkText = [31, 41, 55]; // gray-800
  const grayText = [107, 114, 128]; // gray-500
  const lightBg = [249, 250, 251]; // gray-50
  const white = [255, 255, 255];
  const borderColor = [229, 231, 235]; // gray-200
  const successColor = [16, 185, 129]; // emerald-500
  const warningColor = [245, 158, 11]; // amber-500
  const errorColor = [239, 68, 68]; // red-500

  // ── Helper: draw coloured rectangle ─────────────────────
  const setFill = (rgb) => doc.setFillColor(...rgb);
  const setDraw = (rgb) => doc.setDrawColor(...rgb);
  const setText = (rgb) => doc.setTextColor(...rgb);

  // ========================================================
  //  1. GRADIENT HEADER
  // ========================================================
  const headerHeight = 48;
  const headerY = margin;

  // Gradient approximation — two coloured rectangles
  const gradSteps = 20;
  for (let i = 0; i < gradSteps; i++) {
    const ratio = i / gradSteps;
    const r = Math.round(primaryColor[0] + (purpleColor[0] - primaryColor[0]) * ratio);
    const g = Math.round(primaryColor[1] + (purpleColor[1] - primaryColor[1]) * ratio);
    const b = Math.round(primaryColor[2] + (purpleColor[2] - primaryColor[2]) * ratio);
    doc.setFillColor(r, g, b);
    const stripWidth = contentWidth / gradSteps;
    doc.rect(
      margin + stripWidth * i,
      headerY,
      stripWidth + 0.5,
      headerHeight,
      'F'
    );
  }

  // Rounded corners for header
  doc.setFillColor(...primaryColor);
  roundedRect(doc, margin, headerY, contentWidth, headerHeight, 4);
  // Overfill with gradient (rough approach — acceptable on small card)
  for (let i = 0; i < gradSteps; i++) {
    const ratio = i / gradSteps;
    const r = Math.round(primaryColor[0] + (purpleColor[0] - primaryColor[0]) * ratio);
    const g = Math.round(primaryColor[1] + (purpleColor[1] - primaryColor[1]) * ratio);
    const b = Math.round(primaryColor[2] + (purpleColor[2] - primaryColor[2]) * ratio);
    doc.setFillColor(r, g, b);
    const stripWidth = contentWidth / gradSteps;
    doc.rect(
      margin + stripWidth * i,
      headerY,
      stripWidth + 0.5,
      headerHeight,
      'F'
    );
  }

  // Re-draw rounded border on top
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.3);
  roundedRect(doc, margin, headerY, contentWidth, headerHeight, 4);

  // "YNC" brand letter in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setText(white);
  doc.text('YNC', margin + 6, headerY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setText([255, 255, 255, 180]);
  doc.text('Youth Network Community', margin + 6, headerY + 22);

  // "Official Ticket" badge
  const badgeText = 'OFFICIAL TICKET';
  const badgeW = 30;
  const badgeH = 6;
  const badgeX = margin + contentWidth - badgeW - 4;
  const badgeY = headerY + 8;
  doc.setFillColor(255, 255, 255, 220);
  doc.setDrawColor(255, 255, 255, 150);
  roundedRect(doc, badgeX, badgeY, badgeW, badgeH, 3);
  doc.setFillColor(255, 255, 255, 200);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  setText(primaryColor);
  doc.text(badgeText, badgeX + badgeW / 2, badgeY + 4, { align: 'center' });

  // ── Perforated edge ────────────────────────────────────
  const perforationY = headerY + headerHeight;
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  dashedLine(doc, margin + 4, perforationY, margin + contentWidth - 4, perforationY);

  // Side circles for perforation effect
  doc.setFillColor(255, 255, 255);
  doc.circle(margin, perforationY, 3, 'F');
  doc.circle(margin + contentWidth, perforationY, 3, 'F');

  // ========================================================
  //  2. TICKET BODY
  // ========================================================
  let yPos = perforationY + 8;

  // ── Ticket Number ───────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  setText(grayText);
  doc.text('TICKET NUMBER', margin + 4, yPos);

  const ticketNum = ticket.ticket_number || (ticket.booking_id ? ticket.booking_id.slice(0, 8).toUpperCase() : 'N/A');
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  setText(primaryColor);
  doc.text(`#${ticketNum}`, margin + 4, yPos + 8);

  yPos += 16;

  // ── Event Name ──────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setText(darkText);
  const eventName = ticket.event_name || 'Event Ticket';
  // Truncate if too long
  const displayName = eventName.length > 40 ? eventName.slice(0, 37) + '...' : eventName;
  doc.text(displayName, margin + 4, yPos);

  yPos += 10;

  // ── Status Badge ────────────────────────────────────────
  const status = (ticket.status || 'active').toLowerCase();
  let statusColor = successColor;
  let statusLabel = 'Active';
  if (status === 'used') { statusColor = [59, 130, 246]; statusLabel = 'Used'; }
  else if (status === 'expired') { statusColor = warningColor; statusLabel = 'Expired'; }
  else if (status === 'cancelled') { statusColor = errorColor; statusLabel = 'Cancelled'; }

  const statusBadgeW = 18;
  const statusBadgeH = 5;
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin + contentWidth - statusBadgeW - 4, yPos - 5, statusBadgeW, statusBadgeH, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  setText(white);
  doc.text(statusLabel, margin + contentWidth - statusBadgeW / 2 - 4, yPos - 1.5, { align: 'center' });

  // ── Info Table ──────────────────────────────────────────
  const tableY = yPos + 4;
  const rowH = 7;
  const col1X = margin + 4;
  const col2X = margin + contentWidth / 2 + 2;
  const labelW = 12;

  const rows = [
    { label: 'Date', value: formatTicketDate(ticket.event_date) },
    { label: 'Venue', value: ticket.venue || 'TBD' },
    { label: 'Attendee', value: ticket.user_name || '—' },
  ];

  // Table header bg
  setFill(lightBg);
  doc.rect(margin + 2, tableY, contentWidth - 4, rowH * rows.length + 2, 'F');

  rows.forEach((row, idx) => {
    const rowY = tableY + 2 + idx * rowH;

    // Alternating row bg
    if (idx % 2 === 0) {
      setFill(lightBg);
      doc.rect(margin + 2, rowY - 1, contentWidth / 2 - 2, rowH, 'F');
      doc.rect(margin + contentWidth / 2 + 2, rowY - 1, contentWidth / 2 - 4, rowH, 'F');
    }

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setText(grayText);

    if (idx === 0) {
      doc.text(row.label, col1X, rowY + 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      setText(darkText);
      doc.text(row.value, col1X + labelW, rowY + 4);
    } else if (idx === 1) {
      doc.text(row.label, col1X, rowY + 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      setText(darkText);
      const venueText = row.value.length > 22 ? row.value.slice(0, 19) + '...' : row.value;
      doc.text(venueText, col1X + labelW, rowY + 4);
    } else if (idx === 2) {
      doc.text(row.label, col1X, rowY + 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      setText(darkText);
      doc.text(row.value, col1X + labelW, rowY + 4);
    }
  });

  // Booking ID row (if available)
  if (ticket.booking_id) {
    const extraRowY = tableY + 2 + rows.length * rowH;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    setText(grayText);
    doc.text('Booking ID', margin + 4, extraRowY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setText(darkText);
    doc.text(ticket.booking_id, margin + 4 + 14, extraRowY + 4);
  }

  // ── Separator ──────────────────────────────────────────
  const sepY = tableY + 2 + rows.length * rowH + (ticket.booking_id ? 8 : 4);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  dashedLine(doc, margin + 4, sepY, margin + contentWidth - 4, sepY);

  // ========================================================
  //  3. QR CODE SECTION
  // ========================================================
  const qrSectionY = sepY + 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  setText(grayText);
  doc.text('SCAN TO VERIFY', margin + 4, qrSectionY);

  // QR code box
  const qrSize = 28;
  const qrX = margin + (contentWidth - qrSize) / 2;
  const qrY = qrSectionY + 3;

  // Try to extract and draw actual QR code image
  let qrImageDrawn = false;

  if (ticket.qr_code_data) {
    try {
      const qrData =
        typeof ticket.qr_code_data === 'string'
          ? JSON.parse(ticket.qr_code_data)
          : ticket.qr_code_data;

      // Support both base64 image string and URL
      const qrSource = qrData.data || qrData.url || qrData.qr || ticket.qr_code_data;

      if (typeof qrSource === 'string' && qrSource.startsWith('data:image')) {
        doc.addImage(qrSource, 'PNG', qrX, qrY, qrSize, qrSize);
        qrImageDrawn = true;
      }
    } catch {
      // Not JSON — try using raw string as base64 if it looks like one
      if (typeof ticket.qr_code_data === 'string' && ticket.qr_code_data.startsWith('data:image')) {
        doc.addImage(ticket.qr_code_data, 'PNG', qrX, qrY, qrSize, qrSize);
        qrImageDrawn = true;
      }
    }
  }

  if (!qrImageDrawn) {
    // Draw placeholder QR box
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(qrX, qrY, qrSize, qrSize, 'D');

    // Inner dashed border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(qrX + 2, qrY + 2, qrSize - 4, qrSize - 4, 'D');

    // Corner blocks (QR-code style)
    const blockSize = 6;
    doc.setFillColor(200, 200, 200);

    // Top-left
    doc.rect(qrX + 3, qrY + 3, blockSize, blockSize, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX + 4, qrY + 4, blockSize - 2, blockSize - 2, 'F');
    doc.setFillColor(200, 200, 200);
    doc.rect(qrX + 5, qrY + 5, blockSize - 4, blockSize - 4, 'F');

    // Top-right
    doc.setFillColor(200, 200, 200);
    doc.rect(qrX + qrSize - 3 - blockSize, qrY + 3, blockSize, blockSize, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX + qrSize - 2 - blockSize, qrY + 4, blockSize - 2, blockSize - 2, 'F');
    doc.setFillColor(200, 200, 200);
    doc.rect(qrX + qrSize - 3 - (blockSize - 4), qrY + 5, blockSize - 4, blockSize - 4, 'F');

    // Bottom-left
    doc.setFillColor(200, 200, 200);
    doc.rect(qrX + 3, qrY + qrSize - 3 - blockSize, blockSize, blockSize, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX + 4, qrY + qrSize - 2 - blockSize, blockSize - 2, blockSize - 2, 'F');
    doc.setFillColor(200, 200, 200);
    doc.rect(qrX + 5, qrY + qrSize - 3 - (blockSize - 4), blockSize - 4, blockSize - 4, 'F');

    // "QR Code" label in placeholder
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    setText(grayText);
    doc.text('QR', qrX + qrSize / 2, qrY + qrSize / 2 - 1, { align: 'center' });
    doc.text('CODE', qrX + qrSize / 2, qrY + qrSize / 2 + 4, { align: 'center' });
  }

  // Ticket number below QR
  doc.setFont('courier', 'normal');
  doc.setFontSize(5.5);
  setText(grayText);
  const displayId = ticket.ticket_number || ticket.booking_id || '—';
  doc.text(displayId, margin + contentWidth / 2, qrY + qrSize + 5, { align: 'center' });

  // ========================================================
  //  4. FOOTER
  // ========================================================
  const footerY = pageHeight - margin - 10;

  // Separator line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin + 4, footerY, margin + contentWidth - 4, footerY);

  // Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setText(primaryColor);
  doc.text('YNC Community', margin + 4, footerY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  setText(grayText);
  doc.text('Youth Network Community', margin + 4, footerY + 9);

  // Ticket ID on the right
  doc.setFont('courier', 'normal');
  doc.setFontSize(5);
  setText(grayText);
  const ticketIdStr = ticket.ticket_number || ticket.booking_id || '';
  doc.text(`ID: ${ticketIdStr}`, margin + contentWidth - 4, footerY + 4, { align: 'right' });

  // Generated date
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.setFontSize(5);
  doc.text(`Issued: ${dateStr}`, margin + contentWidth - 4, footerY + 9, { align: 'right' });

  // ========================================================
  //  5. BOTTOM BORDER / BRANDING BAR
  // ========================================================
  const bottomBarY = pageHeight - margin;
  for (let i = 0; i < gradSteps; i++) {
    const ratio = i / gradSteps;
    const r = Math.round(purpleColor[0] + (primaryLight[0] - purpleColor[0]) * ratio);
    const g = Math.round(purpleColor[1] + (primaryLight[1] - purpleColor[1]) * ratio);
    const b = Math.round(purpleColor[2] + (primaryLight[2] - purpleColor[2]) * ratio);
    doc.setFillColor(r, g, b);
    const stripWidth = contentWidth / gradSteps;
    doc.rect(margin + stripWidth * i, bottomBarY, stripWidth + 0.5, 2.5, 'F');
  }

  // ── Download ────────────────────────────────────────────
  const filename = `YNC-Ticket-${ticket.ticket_number || ticket.booking_id || 'event'}.pdf`;
  doc.save(filename);

  return doc;
}
