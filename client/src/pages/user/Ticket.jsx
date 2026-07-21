import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import jsbarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { HiCalendar, HiLocationMarker, HiUser, HiTicket, HiDownload, HiPrinter, HiArrowLeft } from 'react-icons/hi';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { bookingsAPI } from '@/api/client';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function getStatusStyle(status) {
  switch (status) {
    case 'confirmed': return { label: 'Confirmed', text: 'text-emerald-600', bg: 'bg-emerald-100', dot: 'bg-emerald-500' };
    case 'pending': return { label: 'Pending', text: 'text-amber-600', bg: 'bg-amber-100', dot: 'bg-amber-500' };
    case 'cancelled': return { label: 'Cancelled', text: 'text-red-600', bg: 'bg-red-100', dot: 'bg-red-500' };
    default: return { label: 'Unknown', text: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-500' };
  }
}

export default function Ticket() {
  const { id } = useParams();
  const barcodeRef = useRef(null);
  const ticketRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState('');
  const [booking, setBooking] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchBookingData();
  }, [id]);

  const fetchBookingData = async () => {
    try {
      const res = await bookingsAPI.getById(id);
      setBooking(res.data || {});
      setTickets(res.data?.tickets || []);
    } catch (err) {
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code
  useEffect(() => {
    if (tickets.length > 0) {
      const ticket = tickets[0];
      const qrContent = ticket.qr_code_data || ticket.ticket_number;
      QRCode.toDataURL(qrContent, {
        width: 200, margin: 2,
        color: { dark: '#1f2937', light: '#ffffff' },
      }).then(setQrDataUrl).catch(() => setQrDataUrl(''));
    }
  }, [tickets]);

  // Generate barcode via jsbarcode
  useEffect(() => {
    if (tickets.length > 0 && barcodeRef.current) {
      try {
        const ticket = tickets[0];
        const barcodeText = ticket.barcode_data || ticket.ticket_number;
        jsbarcode(barcodeRef.current, barcodeText, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          font: 'monospace',
          textMargin: 4,
          margin: 0,
          background: '#ffffff',
          lineColor: '#111827',
        });
        // Convert SVG to data URL
        const svg = barcodeRef.current;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          canvas.width = svg.scrollWidth * 2;
          canvas.height = svg.scrollHeight * 2;
          ctx.scale(2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setBarcodeDataUrl(canvas.toDataURL('image/png'));
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [tickets]);

  const handleDownloadPdf = useCallback(async () => {
    if (!booking || tickets.length === 0) { toast.error('No ticket data'); return; }
    setDownloading(true);
    try {
      const ticket = tickets[0];
      const t = booking;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const pw = 148; // A5 width
      const margin = 10;
      const contentW = pw - margin * 2;
      let y = margin;

      // Helper: draw a section divider
      const divider = (yPos) => {
        doc.setDrawColor(200, 160, 120);
        doc.setLineWidth(0.3);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(margin, yPos, pw - margin, yPos);
        doc.setLineDashPattern([], 0);
      };

      // --- HEADER BANNER ---
      doc.setFillColor(234, 88, 12);
      doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('YNC', pw / 2, y + 10, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Youth Network Community', pw / 2, y + 18, { align: 'center' });
      doc.setFontSize(7);
      doc.text('— Event Ticket —', pw / 2, y + 24, { align: 'center' });
      y += 34;

      // --- EVENT NAME ---
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      const eventName = t.event_name || 'Event';
      doc.text(eventName, pw / 2, y, { align: 'center' });
      y += 8;

      // Status badge
      const statusInfo = getStatusStyle(t.status);
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(pw / 2 - 18, y - 1, 36, 6, 2, 2, 'F');
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(statusInfo.label.toUpperCase(), pw / 2, y + 3.5, { align: 'center' });
      y += 10;

      divider(y);
      y += 4;

      // --- EVENT DETAILS ---
      const details = [
        { label: 'DATE & TIME', value: t.event_date ? `${formatDate(t.event_date)}${t.start_time ? `  •  ${formatTime(t.start_time)}` : ''}` : 'TBD' },
        { label: 'VENUE', value: t.venue || 'Venue TBD' },
        { label: 'ATTENDEE', value: t.user_name || 'Member' },
        { label: 'TICKET', value: ticket.ticket_number || `YNC-${t.id?.slice(0, 8) || ''}` },
        { label: 'QUANTITY', value: `${t.quantity || 1} ticket(s)` },
        { label: 'AMOUNT', value: !t.total_amount || t.total_amount === 0 ? 'FREE' : `₹${t.total_amount}` },
      ];

      details.forEach((d, i) => {
        const rowY = y + i * 8;
        if (rowY > 180) return;
        doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255);
        doc.rect(margin, rowY - 2, contentW, 7.5, 'F');
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(d.label, margin + 3, rowY + 2.5);
        doc.setTextColor(31, 41, 55);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(String(d.value), margin + 3, rowY + 6);
      });

      y += details.length * 8 + 6;
      divider(y);
      y += 6;

      // --- QR CODE ---
      if (qrDataUrl) {
        const qrSize = 36;
        const qrX = pw / 2 - qrSize / 2;
        try {
          doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
        } catch { /* skip if QR fails */ }
        y += qrSize + 3;
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text('Scan to verify', pw / 2, y, { align: 'center' });
        y += 4;
      }

      divider(y);
      y += 4;

      // --- BARCODE ---
      if (barcodeDataUrl) {
        const bcW = contentW - 20;
        const bcH = 16;
        const bcX = pw / 2 - bcW / 2;
        try {
          doc.addImage(barcodeDataUrl, 'PNG', bcX, y, bcW, bcH);
        } catch { /* skip if barcode fails */ }
        y += bcH + 2;
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text(ticket.ticket_number || '', pw / 2, y, { align: 'center' });
        y += 6;
      }

      // --- FOOTER ---
      const remaining = 297 - y - margin;
      if (remaining > 15) {
        y = 297 - margin - 10;
        divider(y);
        y += 4;
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString('en-IN')}  •  Booking: ${t.id?.slice(0, 8) || ''}`, pw / 2, y, { align: 'center' });
      }

      doc.save(`YNC-Ticket-${ticket.ticket_number || t.id?.slice(0, 8) || 'ticket'}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  }, [booking, tickets, qrDataUrl, barcodeDataUrl]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <HiTicket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ticket Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This ticket doesn't exist or has been removed.</p>
          <Link to="/dashboard/bookings" className="text-orange-500 hover:text-orange-400 font-medium">Back to Bookings</Link>
        </div>
      </div>
    );
  }

  const firstTicket = tickets[0] || {};
  const eventName = booking.event_name || 'Event';
  const eventDate = booking.event_date || '';
  const venue = booking.venue || 'Venue TBD';
  const ticketNumber = firstTicket.ticket_number || `ID: ${booking.id?.slice(0, 8) || ''}`;
  const statusInfo = getStatusStyle(booking.status);
  const attendeeName = booking.user_name || 'Member';

  return (
    <div className="h-full">
      {/* Print-only styles */}
      <style>{`
        @media print {
          body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A5 portrait; margin: 8mm; }
          .no-print { display: none !important; }
          .ticket-card { box-shadow: none !important; border: 1.5px solid #e5e7eb !important; border-radius: 16px !important; max-width: 100% !important; }
          .ticket-header { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .ticket-body { background: #fff !important; }
          .barcode-svg { display: block !important; }
        }
      `}</style>

      {/* Hidden barcode SVG for rendering */}
      <svg ref={barcodeRef} style={{ position: 'absolute', left: '-9999px' }} />

      {/* Back Button — hidden on print */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }} className="mb-6 no-print">
        <Link to="/dashboard/bookings"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium">
          <HiArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>
      </motion.div>

      {/* Ticket */}
      <motion.div ref={ticketRef}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-lg mx-auto ticket-card"
      >
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/10 dark:shadow-orange-500/5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">

          {/* === HEADER BANNER === */}
          <div className="ticket-header bg-gradient-to-br from-orange-600 via-red-600 to-orange-500 px-6 py-7 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
            </div>
            <HiTicket className="w-7 h-7 text-white/70 mx-auto mb-2 relative" />
            <h1 className="text-xl md:text-2xl font-display font-bold text-white leading-tight relative">{eventName}</h1>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white/90 relative backdrop-blur-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
              {statusInfo.label}
            </div>
          </div>

          {/* === PERFORATED DIVIDER === */}
          <div className="relative h-6 bg-white dark:bg-gray-900">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 dark:bg-gray-950 rounded-full" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 dark:bg-gray-950 rounded-full" />
            <div className="absolute left-8 right-8 top-1/2 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
          </div>

          {/* === BODY === */}
          <div className="ticket-body px-6 py-5 bg-white dark:bg-gray-900 space-y-4">

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 gap-3">
              <DetailRow icon={<HiCalendar className="w-4 h-4 text-orange-500" />} bg="bg-orange-50 dark:bg-orange-900/20"
                label="Date & Time"
                value={`${eventDate ? formatDate(eventDate) : 'TBD'}${booking.start_time ? `  •  ${formatTime(booking.start_time)}` : ''}`} />
              <DetailRow icon={<HiLocationMarker className="w-4 h-4 text-red-500" />} bg="bg-red-50 dark:bg-red-900/20"
                label="Venue" value={venue} />
              <DetailRow icon={<HiUser className="w-4 h-4 text-amber-500" />} bg="bg-amber-50 dark:bg-amber-900/20"
                label="Attendee" value={attendeeName} />
            </div>

            {/* QR + Barcode */}
            <div className="flex flex-col items-center py-3 border-t border-gray-100 dark:border-gray-800">
              {/* QR Code */}
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-3">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-36 h-36" />
                ) : (
                  <div className="w-36 h-36 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-xs text-gray-400">Loading QR...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono tracking-wider mb-2">{ticketNumber}</p>

              {/* Real Barcode - render as img from data URL */}
              {barcodeDataUrl ? (
                <img src={barcodeDataUrl} alt="Barcode" className="w-full max-w-xs h-auto" />
              ) : (
                <div className="flex items-center justify-center gap-[2px] py-2 opacity-40">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="bg-gray-600 dark:bg-gray-300 rounded-sm"
                      style={{ width: i % 3 === 0 ? '3px' : '2px', height: `${18 + Math.random() * 8}px` }} />
                  ))}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <MetaBox label="Quantity" value={`${booking.quantity || 1} ticket(s)`} />
              <MetaBox label="Amount" value={!booking.total_amount || booking.total_amount === 0 ? 'FREE' : `₹${booking.total_amount}`} />
            </div>
          </div>

          {/* === FOOTER === */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3.5 text-center border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm font-display font-bold text-gray-700 dark:text-gray-300">YNC</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 tracking-wider uppercase">Youth Network Community</p>
          </div>
        </div>
      </motion.div>

      {/* Actions — hidden on print */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-3 mt-8 no-print flex-wrap">
        <Button variant="primary" size="md" onClick={handleDownloadPdf} loading={downloading} className="gap-2">
          <HiDownload className="w-4 h-4" /> Download PDF
        </Button>
        <Button variant="ghost" size="md" onClick={handlePrint} className="gap-2">
          <HiPrinter className="w-4 h-4" /> Print
        </Button>
      </motion.div>
    </div>
  );
}

function DetailRow({ icon, bg, label, value }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${bg}`}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/80 dark:bg-gray-800/80 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function MetaBox({ label, value }) {
  return (
    <div className="text-center p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}
