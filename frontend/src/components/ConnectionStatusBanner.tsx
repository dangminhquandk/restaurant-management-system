import { WifiOff } from 'lucide-react';
import type { StompConnectionState } from '../types/api';

export function ConnectionStatusBadge({
  state,
  dark = false,
}: {
  state: StompConnectionState;
  dark?: boolean;
}) {
  if (state === 'CONNECTED') {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
          dark
            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        <span>Online Real-time</span>
      </span>
    );
  }

  if (state === 'CONNECTING') {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
          dark
            ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" aria-hidden="true" />
        <span>Đang kết nối STOMP...</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
        dark
          ? 'border-rose-500/50 bg-rose-500/20 text-rose-200'
          : 'border-rose-200 bg-rose-50 text-rose-800'
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
      <span>Mất kết nối</span>
    </span>
  );
}

export function ConnectionStatusBanner({ state }: { state: StompConnectionState }) {
  if (state !== 'DISCONNECTED') return null;

  return (
    <div
      role="alert"
      className="no-print border-b border-rose-700 bg-rose-600 px-4 py-2.5 text-white shadow-sm"
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-center gap-2.5 text-center text-xs font-bold sm:text-sm">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Mất kết nối mạng nội bộ — Đang tự động kết nối lại (giỏ món hiện tại vẫn được giữ an toàn)
        </span>
      </div>
    </div>
  );
}
