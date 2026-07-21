import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiQrcode,
  HiCheckCircle,
  HiXCircle,
  HiExclamation,
  HiClock,
  HiRefresh,
  HiSearch,
  HiCamera,
  HiSwitchHorizontal,
  HiLocationMarker,
  HiCalendar,
  HiUser,
  HiTag,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import apiClient from '@/api/client';
import PageTransition from '@/components/ui/PageTransition';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

const resultIcons = {
  valid: HiCheckCircle,
  used: HiExclamation,
  invalid: HiXCircle,
  expired: HiClock,
};

const resultColors = {
  valid: 'from-green-500 to-emerald-500',
  used: 'from-yellow-500 to-orange-500',
  invalid: 'from-red-500 to-rose-500',
  expired: 'from-gray-500 to-gray-600',
};

const resultBg = {
  valid:
    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 shadow-green-500/10 dark:shadow-green-500/5',
  used:
    'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 shadow-yellow-500/10 dark:shadow-yellow-500/5',
  invalid:
    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-red-500/10 dark:shadow-red-500/5',
  expired:
    'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 shadow-gray-500/10 dark:shadow-gray-500/5',
};

const resultBadgeVariant = {
  valid: 'success',
  used: 'warning',
  invalid: 'error',
  expired: 'default',
};

const resultLabel = {
  valid: 'Valid Ticket',
  used: 'Already Used',
  invalid: 'Invalid Ticket',
  expired: 'Expired',
};

export default function TicketScanner() {
  const [scanning, setScanning] = useState(false);
  const [scannerInitializing, setScannerInitializing] = useState(false);
  const [manualTicket, setManualTicket] = useState('');
  const [validating, setValidating] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [showCameraSelect, setShowCameraSelect] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Start scanner with optional cameraId
  const startScanner = useCallback(
    async (cameraId) => {
      // Clear any previous camera error
      setCameraError(null);
      setScannerInitializing(true);

      try {
        const { Html5Qrcode } = await import('html5-qrcode');

        // If no cameraId provided, enumerate cameras first
        let targetCameraId = cameraId;
        if (!targetCameraId) {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            const backCam = devices.find(
              (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('environment')
            );
            targetCameraId = backCam ? backCam.id : devices[0].id;
            setSelectedCameraId(targetCameraId);
          }
        }

        // Clean up any existing scanner instance
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch {
            // Ignore stop errors
          }
          html5QrCodeRef.current = null;
        }

        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        // If we have a specific camera, use it; otherwise use default
        if (targetCameraId) {
          await html5QrCode.start(
            { deviceId: { exact: targetCameraId } },
            config,
            (decodedText) => {
              handleScanResult(decodedText);
              stopScanner();
            },
            () => {} // ignore scan errors
          );
        } else {
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              handleScanResult(decodedText);
              stopScanner();
            },
            () => {} // ignore scan errors
          );
        }

        setScanning(true);
      } catch (err) {
        console.error('Scanner error:', err);

        // Handle specific camera errors gracefully
        if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
          setCameraError(
            'Camera permission denied. Please allow camera access in your browser settings and try again, or use manual entry below.'
          );
          toast.error('Camera permission denied');
        } else if (
          err.name === 'NotFoundError' ||
          err.message?.includes('NotFoundError') ||
          err.message?.includes('No camera')
        ) {
          setCameraError('No camera detected on this device. Please use manual entry below.');
          toast.error('No camera detected');
        } else if (
          err.name === 'NotReadableError' ||
          err.message?.includes('NotReadableError')
        ) {
          setCameraError(
            'Camera is busy or not available. Please close other apps using the camera and try again.'
          );
          toast.error('Camera not available');
        } else {
          setCameraError(
            'Could not start camera. Please use manual entry below.'
          );
          toast.error('Could not start camera');
        }
      } finally {
        setScannerInitializing(false);
      }
    },
    []
  );

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // Scanner might already be stopped
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
    setShowCameraSelect(false);
  }, []);

  // Switch camera
  const switchCamera = useCallback(
    async (cameraId) => {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {
          // Ignore
        }
        html5QrCodeRef.current = null;
      }
      setScanning(false);
      // Small delay before restarting with new camera
      setTimeout(() => startScanner(cameraId), 100);
    },
    [startScanner]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch {
          // Ignore
        }
        html5QrCodeRef.current = null;
      }
    };
  }, []);

  const handleScanResult = async (ticketId) => {
    setValidating(true);
    setScanResult(null);
    try {
      const res = await apiClient.post('/admin/tickets/validate', {
        ticket_id: ticketId,
      });
      const result = {
        ticket_id: ticketId,
        ticket_number: res.ticket_number || res.ticket_id || ticketId,
        status: res.status || 'valid',
        user_name: res.user?.name || res.user_name || 'Unknown',
        event_name: res.event?.title || res.event_name || 'Unknown Event',
        event_date: res.event?.date || res.event_date || null,
        event_venue: res.event?.venue || res.event_venue || res.venue || null,
        checked_in_at: res.checked_in_at || null,
        ...res,
      };
      setScanResult(result);
      setRecentScans((prev) =>
        [
          { ...result, scanned_at: new Date().toISOString() },
          ...prev.slice(0, 9),
        ]
      );
      if (result.status === 'valid') {
        toast.success('Valid ticket!');
      } else if (result.status === 'used') {
        toast('Ticket already used', { icon: '⚠️' });
      } else {
        toast.error(`Ticket ${result.status}`);
      }
    } catch (err) {
      const result = {
        ticket_id: ticketId,
        status: 'invalid',
        error: err.message || 'Ticket not found',
      };
      setScanResult(result);
      setRecentScans((prev) =>
        [
          { ...result, scanned_at: new Date().toISOString() },
          ...prev.slice(0, 9),
        ]
      );
      toast.error('Invalid ticket');
    } finally {
      setValidating(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualTicket.trim()) {
      toast.error('Please enter a ticket ID');
      return;
    }
    handleScanResult(manualTicket.trim());
    setManualTicket('');
  };

  const handleCheckIn = async () => {
    if (!scanResult?.ticket_id) return;
    try {
      await apiClient.post('/admin/tickets/check-in', {
        ticket_id: scanResult.ticket_id,
      });
      toast.success('Checked in successfully!');
      setScanResult({
        ...scanResult,
        status: 'used',
        checked_in_at: new Date().toISOString(),
      });
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    }
  };

  const ResultIcon = scanResult ? resultIcons[scanResult.status] || HiXCircle : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            Ticket Scanner
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Scan QR codes or enter ticket IDs manually to validate event tickets
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column — Scanner & Manual Entry */}
          <div className="space-y-4">
            {/* QR Scanner */}
            <GlassCard className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <HiQrcode className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white">
                    QR Code Scanner
                  </h2>
                </div>

                {/* Scanner Viewfinder */}
                <div
                  id="qr-reader"
                  ref={scannerRef}
                  className="mx-auto rounded-xl overflow-hidden bg-gray-900"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    minHeight: scanning || scannerInitializing ? '350px' : '0',
                  }}
                />

                {/* Scanner Initializing State */}
                {scannerInitializing && (
                  <div className="py-8 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Initializing camera...
                    </p>
                  </div>
                )}

                {/* Scanner Inactive State */}
                {!scanning && !scannerInitializing && !cameraError && (
                  <div className="py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <HiQrcode className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Click below to activate camera scanner
                    </p>
                    <Button onClick={() => startScanner()} iconLeft={HiCamera}>
                      Start Scanner
                    </Button>
                  </div>
                )}

                {/* Camera Error State */}
                {cameraError && !scanning && !scannerInitializing && (
                  <div className="py-6">
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                      <div className="flex items-start gap-3">
                        <HiXCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-400 text-left">
                          {cameraError}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCameraError(null);
                          startScanner();
                        }}
                        iconLeft={HiRefresh}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                {/* Scanner Active State Controls */}
                {scanning && (
                  <div className="space-y-3">
                    {/* Camera Selection */}
                    {cameras.length > 1 && (
                      <div>
                        {showCameraSelect ? (
                          <div className="flex flex-wrap gap-2 justify-center">
                            {cameras.map((cam) => (
                              <button
                                key={cam.id}
                                onClick={() => {
                                  setSelectedCameraId(cam.id);
                                  setShowCameraSelect(false);
                                  switchCamera(cam.id);
                                }}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                  cam.id === selectedCameraId
                                    ? 'bg-orange-500/20 border-orange-500 text-orange-600 dark:text-orange-400'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-400'
                                }`}
                              >
                                {cam.label ||
                                  `Camera ${cam.id.slice(0, 8)}...`}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowCameraSelect(true)}
                            className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                          >
                            <HiSwitchHorizontal className="w-3.5 h-3.5" />
                            Switch Camera
                            {cameras.length > 1 && (
                              <span className="text-gray-400">
                                ({cameras.length} available)
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={stopScanner}
                      iconLeft={HiXCircle}
                    >
                      Stop Scanner
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Manual Entry */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <HiSearch className="w-4 h-4 text-orange-500" />
                Manual Entry
              </h3>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualTicket}
                  onChange={(e) => setManualTicket(e.target.value)}
                  placeholder="Enter ticket ID (e.g., TKT-2026-0001)"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                />
                <Button
                  type="submit"
                  loading={validating}
                  disabled={!manualTicket.trim()}
                  size="md"
                >
                  Validate
                </Button>
              </form>
            </GlassCard>
          </div>

          {/* Right Column — Results */}
          <div className="space-y-4">
            {/* Scan Result / Validation Result */}
            <AnimatePresence mode="wait">
              {validating && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <GlassCard className="p-8">
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="w-14 h-14 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Validating Ticket
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Please wait...
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {!validating && scanResult && (
                <motion.div
                  key={scanResult.ticket_id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <GlassCard
                    className={`p-6 border-2 shadow-lg ${resultBg[scanResult.status] || resultBg.invalid}`}
                    glow={scanResult.status === 'valid'}
                  >
                    <div className="text-center space-y-4">
                      {/* Status Icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          damping: 10,
                          stiffness: 200,
                          delay: 0.1,
                        }}
                      >
                        <div
                          className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${
                            resultColors[scanResult.status] || resultColors.invalid
                          } flex items-center justify-center shadow-lg`}
                        >
                          {ResultIcon && (
                            <ResultIcon className="w-10 h-10 text-white" />
                          )}
                        </div>
                      </motion.div>

                      {/* Status Badge */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Badge
                          variant={
                            resultBadgeVariant[scanResult.status] || 'error'
                          }
                          size="lg"
                          dot
                        >
                          {resultLabel[scanResult.status] || 'Invalid Ticket'}
                        </Badge>
                      </motion.div>

                      {/* Ticket ID — only show for valid/used/expired, not for invalid */}
                      {scanResult.ticket_number && scanResult.status !== 'invalid' && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.25 }}
                          className="font-mono text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5"
                        >
                          <HiTag className="w-3.5 h-3.5" />
                          {scanResult.ticket_number}
                        </motion.p>
                      )}

                      {/* Ticket Details */}
                      {scanResult.status !== 'invalid' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2"
                        >
                          {/* Attendee Name */}
                          {scanResult.user_name && (
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/30">
                              <div className="flex items-center gap-2 mb-1">
                                <HiUser className="w-3.5 h-3.5 text-orange-500" />
                                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                  Attendee
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {scanResult.user_name}
                              </p>
                            </div>
                          )}

                          {/* Event Name */}
                          {scanResult.event_name && (
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/30">
                              <div className="flex items-center gap-2 mb-1">
                                <HiQrcode className="w-3.5 h-3.5 text-orange-500" />
                                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                  Event
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {scanResult.event_name}
                              </p>
                            </div>
                          )}

                          {/* Event Date */}
                          {scanResult.event_date && (
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/30">
                              <div className="flex items-center gap-2 mb-1">
                                <HiCalendar className="w-3.5 h-3.5 text-orange-500" />
                                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                  Date
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatDate(scanResult.event_date)}
                              </p>
                            </div>
                          )}

                          {/* Event Venue */}
                          {scanResult.event_venue && (
                            <div className="p-3 rounded-xl bg-white/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/30">
                              <div className="flex items-center gap-2 mb-1">
                                <HiLocationMarker className="w-3.5 h-3.5 text-orange-500" />
                                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                  Venue
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {scanResult.event_venue}
                              </p>
                            </div>
                          )}

                          {/* Check-in Status / Timestamp */}
                          <div
                            className={`${
                              scanResult.checked_in_at || scanResult.event_venue
                                ? 'col-span-2'
                                : 'col-span-1'
                            } p-3 rounded-xl bg-white/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/30`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <HiClock className="w-3.5 h-3.5 text-orange-500" />
                              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {scanResult.checked_in_at
                                  ? 'Checked In At'
                                  : 'Check-in Status'}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {scanResult.checked_in_at
                                ? `${formatDate(scanResult.checked_in_at)} at ${formatTime(scanResult.checked_in_at)}`
                                : scanResult.status === 'valid'
                                  ? 'Not yet checked in'
                                  : scanResult.status === 'used'
                                    ? 'Already checked in'
                                    : '-'}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Error message */}
                      {scanResult.error && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg"
                        >
                          {scanResult.error}
                        </motion.p>
                      )}

                      {/* Check-in Button */}
                      {scanResult.status === 'valid' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Button
                            onClick={handleCheckIn}
                            iconLeft={HiCheckCircle}
                            className="mt-2"
                            fullWidth
                          >
                            Mark as Checked In
                          </Button>
                        </motion.div>
                      )}

                      {/* Scan New Button */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <button
                          onClick={() => setScanResult(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-2"
                        >
                          Scan another ticket
                        </button>
                      </motion.div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State (no scan result and not loading) */}
            {!validating && !scanResult && (
              <GlassCard className="p-12 text-center">
                <EmptyState
                  icon={HiQrcode}
                  title="Waiting for scan..."
                  description="Scan a QR code or enter a ticket ID manually to validate"
                />
              </GlassCard>
            )}

            {/* Recent Scans */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <HiClock className="w-4 h-4 text-orange-500" />
                  Recent Scans
                </span>
                {recentScans.length > 0 && (
                  <button
                    onClick={() => setRecentScans([])}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </h3>

              {recentScans.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  No scans yet
                </p>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {recentScans.map((scan, i) => {
                    const Icon = resultIcons[scan.status] || HiXCircle;
                    return (
                      <motion.div
                        key={`${scan.ticket_id}-${scan.scanned_at}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer"
                        onClick={() => {
                          // Re-show a past result
                          setScanResult(scan);
                        }}
                      >
                        <div
                          className={`p-1.5 rounded-lg bg-gradient-to-br ${resultColors[scan.status]} text-white flex-shrink-0`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                            {scan.ticket_number || scan.ticket_id}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                              {scan.event_name || 'Unknown Event'}
                            </p>
                            <span className="text-[10px] text-gray-400">·</span>
                            <p className="text-[10px] text-gray-400 whitespace-nowrap">
                              {scan.scanned_at
                                ? formatTime(scan.scanned_at)
                                : ''}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-medium uppercase ${
                            scan.status === 'valid'
                              ? 'text-green-600 dark:text-green-400'
                              : scan.status === 'used'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {scan.status}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
