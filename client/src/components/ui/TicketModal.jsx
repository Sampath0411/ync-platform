import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import {
  HiX,
  HiTicket,
  HiCalendar,
  HiLocationMarker,
  HiUser,
  HiDownload,
  HiIdentification,
} from 'react-icons/hi';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlassCard from '@/components/ui/GlassCard';
import downloadTicketPDF from '@/utils/ticketPdf';

/**
 * Reusable Ticket Modal — displays event ticket details with QR code
 * and PDF download functionality.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.ticket - Ticket object with fields:
 *   ticket_number, event_name, event_date, venue, status,
 *   qr_code_data, user_name, booking_id
 */
export default function TicketModal({ isOpen, onClose, ticket }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ── Generate QR code when ticket data changes ──────────
  useEffect(() => {
    if (!isOpen || !ticket) return;

    let cancelled = false;

    async function generateQR() {
      setQrLoading(true);

      // Prioritise explicit qr_code_data field
      if (ticket.qr_code_data) {
        try {
          const parsed =
            typeof ticket.qr_code_data === 'string'
              ? JSON.parse(ticket.qr_code_data)
              : ticket.qr_code_data;

          const source = parsed.data || parsed.url || parsed.qr || ticket.qr_code_data;

          if (typeof source === 'string' && source.startsWith('data:image')) {
            if (!cancelled) setQrDataUrl(source);
            setQrLoading(false);
            return;
          }
        } catch {
          // Not JSON, fall through to generate from identifier
        }
      }

      // Fall back to generating QR from ticket_number or booking_id
      const qrContent = ticket.ticket_number || ticket.booking_id || 'ync-ticket';
      try {
        const url = await QRCode.toDataURL(qrContent, {
          width: 240,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff',
          },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl('');
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    }

    generateQR();

    return () => {
      cancelled = true;
    };
  }, [isOpen, ticket]);

  // ── Reset state on close ───────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setQrDataUrl('');
        setQrLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ── Handle PDF download ────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!ticket || isDownloading) return;
    setIsDownloading(true);
    try {
      const ticketWithQr = {
        ...ticket,
        qr_code_data: qrDataUrl
          ? JSON.stringify({ data: qrDataUrl })
          : ticket.qr_code_data,
      };
      downloadTicketPDF(ticketWithQr);
    } catch (err) {
      console.error('Failed to download ticket PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [ticket, qrDataUrl, isDownloading]);

  // ── Keyboard shortcut ──────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // ── Status helpers ─────────────────────────────────────
  const statusVariant = (() => {
    switch ((ticket?.status || '').toLowerCase()) {
      case 'active':
      case 'confirmed':
        return 'success';
      case 'used':
        return 'info';
      case 'expired':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  })();

  const statusDisplay = (ticket?.status || 'active').charAt(0).toUpperCase() + (ticket?.status || 'active').slice(1);

  // ── Animation variants ─────────────────────────────────
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', damping: 28, stiffness: 280 },
    },
    exit: { opacity: 0, scale: 0.92, y: 30, transition: { duration: 0.18 } },
  };

  if (!ticket) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={overlayVariants}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-0 overflow-hidden" hover={false}>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-20 p-1.5 rounded-xl
                  bg-white/70 dark:bg-gray-800/70 backdrop-blur-md
                  text-gray-500 dark:text-gray-400
                  hover:text-gray-700 dark:hover:text-gray-200
                  hover:bg-white dark:hover:bg-gray-700
                  border border-white/20 dark:border-gray-700/30
                  transition-all duration-200"
              >
                <HiX className="w-4 h-4" />
              </button>

              {/* ── Ticket ───────────────────────────────── */}
              <div className="relative">
                {/* Gradient Header */}
                <div className="relative bg-gradient-to-br from-orange-600 via-red-600 to-orange-500 px-6 pt-8 pb-10 text-center overflow-hidden">
                  {/* Glow orbs */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-red-300/20 rounded-full blur-2xl" />

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/30">
                      <HiTicket className="w-6 h-6 text-white" />
                    </div>

                    <h2 className="text-xl font-display font-bold text-white leading-tight">
                      {ticket.event_name || 'Event Ticket'}
                    </h2>

                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                      <Badge variant={statusVariant} size="sm">
                        {statusDisplay}
                      </Badge>
                    </div>
                  </motion.div>
                </div>

                {/* Perforated edge */}
                <div className="relative h-6 bg-gradient-to-b from-orange-600 via-red-600 to-orange-500">
                  <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-t-[24px]" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-gray-100 dark:bg-gray-950 rounded-full border-2 border-white dark:border-gray-900" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-gray-100 dark:bg-gray-950 rounded-full border-2 border-white dark:border-gray-900" />
                  <div className="absolute left-8 right-8 top-1/2 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
                </div>

                {/* Body */}
                <div className="bg-white dark:bg-gray-900 px-6 pt-4 pb-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-4"
                  >
                    {/* Ticket Number */}
                    <div className="text-center mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
                        Ticket Number
                      </p>
                      <p className="text-lg font-bold font-mono text-orange-600 dark:text-orange-400 mt-0.5">
                        #{ticket.ticket_number || ticket.booking_id?.slice(0, 8).toUpperCase() || 'N/A'}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        {
                          icon: HiCalendar,
                          label: 'Date',
                          value: ticket.event_date
                            ? new Date(ticket.event_date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : 'TBD',
                          bg: 'bg-orange-100 dark:bg-orange-900/30',
                          iconColor: 'text-orange-600 dark:text-orange-400',
                        },
                        {
                          icon: HiLocationMarker,
                          label: 'Venue',
                          value: ticket.venue || 'TBD',
                          bg: 'bg-red-100 dark:bg-red-900/30',
                          iconColor: 'text-red-600 dark:text-red-400',
                        },
                        {
                          icon: HiUser,
                          label: 'Attendee',
                          value: ticket.user_name || '—',
                          bg: 'bg-rose-100 dark:bg-rose-900/30',
                          iconColor: 'text-rose-600 dark:text-rose-400',
                        },
                      ].map((item, idx) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.08 }}
                          className="flex items-center gap-3 p-3 rounded-xl
                            bg-gray-50 dark:bg-gray-800/50
                            border border-gray-100 dark:border-gray-700/50"
                        >
                          <div
                            className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}
                          >
                            <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {item.label}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {item.value}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Booking ID (if available) */}
                    {ticket.booking_id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-2 justify-center pt-1"
                      >
                        <HiIdentification className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                          Booking: {ticket.booking_id}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* QR Code Display */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45, type: 'spring', stiffness: 200 }}
                    className="flex flex-col items-center py-5 mt-2"
                  >
                    <div
                      className="p-2 rounded-2xl bg-white shadow-sm
                        border-2 border-gray-100 dark:border-gray-700
                        dark:bg-gray-50"
                    >
                      {qrLoading ? (
                        <div className="w-36 h-36 flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                            className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
                          />
                        </div>
                      ) : qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Ticket QR Code"
                          className="w-36 h-36"
                        />
                      ) : (
                        <div className="w-36 h-36 bg-gray-100 dark:bg-gray-200 rounded-xl flex flex-col items-center justify-center gap-1">
                          <div className="grid grid-cols-3 gap-1 opacity-30">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 ${
                                  [0, 2, 6, 8].includes(i)
                                    ? 'bg-gray-400'
                                    : [1, 3, 5, 7].includes(i)
                                    ? 'bg-gray-300'
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium mt-1">QR Code</p>
                        </div>
                      )}
                    </div>
                    <p className="mt-2.5 text-[10px] font-mono text-gray-400 dark:text-gray-500 tracking-wide">
                      {ticket.ticket_number || ticket.booking_id || 'YNC-Ticket'}
                    </p>
                  </motion.div>

                  {/* Footer branding */}
                  <div className="text-center pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-display font-bold text-gray-600 dark:text-gray-400">
                      YNC
                    </p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 tracking-widest uppercase mt-0.5">
                      Youth Network Community
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Action Buttons ──────────────────────── */}
              <div className="px-6 pb-5 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    loading={isDownloading}
                    onClick={handleDownload}
                    className="gap-2"
                  >
                    <HiDownload className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={onClose}
                    className="gap-2 flex-shrink-0"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
