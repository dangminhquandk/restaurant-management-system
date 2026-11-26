/**
 * Formats an integer/decimal VND amount with dot thousands separators
 * and tabular-numeral friendly spacing, e.g. 75000 -> "75.000 ₫".
 */
export function formatVnd(amount: number | null | undefined): string {
  const safe = typeof amount === 'number' && Number.isFinite(amount) ? Math.round(amount) : 0;
  const sign = safe < 0 ? '-' : '';
  const grouped = Math.abs(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${grouped} ₫`;
}

/**
 * Normalizes Vietnamese text for accent-insensitive instant POS search.
 * Example: "Phở Bò Tái Lăn" -> "pho bo tai lan", "Đậu Phụ" -> "dau phu".
 */
export function normalizeVi(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesViSearch(target: string | null | undefined, query: string): boolean {
  const normalizedQuery = normalizeVi(query);
  if (!normalizedQuery) return true;
  return normalizeVi(target).includes(normalizedQuery);
}

export function formatDateTimeVi(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${hh}:${mm} • ${dd}/${mo}/${yyyy}`;
}

export function formatElapsedSince(iso: string | null | undefined, nowMs = Date.now()): string {
  if (!iso) return '00:00';
  const createdMs = new Date(iso).getTime();
  if (Number.isNaN(createdMs)) return '00:00';
  const totalSec = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
