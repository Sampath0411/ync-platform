import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { HiShieldCheck, HiIdentification } from 'react-icons/hi';
import Badge from '@/components/ui/Badge';

export default function MembershipCard({ membership }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (membership?.qr_code_data) {
      QRCode.toDataURL(membership.qr_code_data, {
        width: 120,
        margin: 1,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [membership?.qr_code_data]);

  if (!membership) return null;

  const {
    membership_id,
    user_name,
    user_email,
    expiry_date,
    status,
    benefits,
    profile_photo,
  } = membership;

  const isActive = status === 'active';
  const initials = (user_name || 'M')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedId = membership_id || 'YNC-XXXX-XXXX';
  const formattedExpiry = expiry_date
    ? new Date(expiry_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const statusBadgeVariant = isActive ? 'success' : status === 'expired' ? 'error' : 'default';
  const statusLabel =
    status === 'active'
      ? 'ACTIVE'
      : status === 'expired'
        ? 'EXPIRED'
        : (status || 'INACTIVE').toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* ---- Membership Card ---- */}
      <div
        className={`
          relative overflow-hidden rounded-2xl
          ${
            isActive
              ? 'bg-gradient-to-br from-orange-600 via-red-600 to-rose-700 dark:from-orange-800 dark:via-red-800 dark:to-rose-900'
              : 'bg-gradient-to-br from-gray-600 to-gray-800 dark:from-gray-700 dark:to-gray-900'
          }
          shadow-2xl shadow-orange-500/20
          text-white
        `}
        style={{ aspectRatio: '1.586 / 1' }}
      >
        {/* Decorative background circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 -right-8 w-24 h-24 bg-white/[0.03] rounded-full" />

        {/* Card inner */}
        <div className="relative h-full flex flex-col justify-between p-5">
          {/* Top row — branding + status */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white font-bold text-sm font-display">YNC</span>
                </div>
                <span className="text-xs text-white/60 font-medium">Youth Network Community</span>
              </div>
            </div>
            <Badge
              variant={statusBadgeVariant}
              size="sm"
              dot
              className="!bg-white/20 !text-white !backdrop-blur-sm border-0"
            >
              {statusLabel}
            </Badge>
          </div>

          {/* Middle — profile + name */}
          <div className="flex items-center gap-4">
            {profile_photo ? (
              <img
                src={profile_photo}
                alt={user_name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center border-2 border-white/30 shadow-lg">
                <span className="text-white font-bold text-xl font-display">{initials}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-bold text-lg font-display truncate text-shadow">
                {user_name || 'Member'}
              </h3>
              <p className="text-white/60 text-xs truncate">{user_email || ''}</p>
            </div>
          </div>

          {/* Bottom row — ID + Expiry + QR */}
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Member ID</p>
                <p className="text-white font-mono text-xs tracking-wider">{formattedId}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Expires</p>
                <p className="text-white/80 text-xs font-medium">{formattedExpiry}</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Membership QR Code"
                  className="w-16 h-16 rounded-lg bg-white p-1 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <HiIdentification className="w-6 h-6 text-white/40" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subtle holographic shimmer overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.07] to-transparent" />
      </div>

      {/* ---- Benefits ---- */}
      {benefits && benefits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4 p-4 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-lg"
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-display mb-3 flex items-center gap-2">
            <HiShieldCheck className="w-4 h-4 text-orange-500" />
            Membership Benefits
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/30"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 dark:text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
