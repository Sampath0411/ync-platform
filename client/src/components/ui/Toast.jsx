import toast from 'react-hot-toast';
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiExclamation } from 'react-icons/hi';

const icons = {
  success: HiCheckCircle,
  error: HiXCircle,
  info: HiInformationCircle,
  warning: HiExclamation,
};

const colors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
};

export function showToast(type, message) {
  const Icon = icons[type] || icons.info;
  const color = colors[type] || colors.info;

  toast.custom(
    (t) => (
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          ${t.visible ? 'animate-slide-up' : 'animate-slide-down opacity-0'}
        `}
      >
        <Icon className={`w-5 h-5 ${color}`} />
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
      </div>
    ),
    { duration: 4000 }
  );
}

// Convenience exports
export const toastSuccess = (msg) => showToast('success', msg);
export const toastError = (msg) => showToast('error', msg);
export const toastInfo = (msg) => showToast('info', msg);
export const toastWarning = (msg) => showToast('warning', msg);
