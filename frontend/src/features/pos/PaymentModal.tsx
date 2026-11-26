import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Code2,
  Printer,
  QrCode,
  RefreshCw,
  X,
} from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { useToast } from '../../store/ToastContext';
import type { OrderDto, PaymentDto, PaymentMethod, VietQrPreviewDto } from '../../types/api';
import { parseApiError } from '../../utils/errors';
import { formatVnd } from '../../utils/format';

interface PaymentModalProps {
  open: boolean;
  order: OrderDto;
  onClose: () => void;
  onPaymentCompleted: (payment: PaymentDto) => void;
  onPrintReceipt: () => void;
}

export function PaymentModal({
  open,
  order,
  onClose,
  onPaymentCompleted,
  onPrintReceipt,
}: PaymentModalProps) {
  const { showToast } = useToast();

  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('VIETQR');
  const [qrPreview, setQrPreview] = useState<VietQrPreviewDto | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [showRawEmv, setShowRawEmv] = useState(false);

  const [amountReceived, setAmountReceived] = useState<number>(order.totalAmount);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmountReceived(order.totalAmount);
      setConfirmError(null);
      setShowRawEmv(false);
    }
  }, [open, order.totalAmount]);

  const fetchVietQrPreview = useCallback(async () => {
    if (!open || order.totalAmount <= 0) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const preview = await orderApi.previewVietQr(order.id);
      setQrPreview(preview);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể sinh mã VietQR động cho hóa đơn này.');
      setQrError(parsed.message);
    } finally {
      setQrLoading(false);
    }
  }, [open, order.id, order.totalAmount]);

  useEffect(() => {
    if (open && activeMethod === 'VIETQR') {
      void fetchVietQrPreview();
    }
  }, [open, activeMethod, fetchVietQrPreview]);

  const cashDenominations = useMemo(() => {
    const total = order.totalAmount;
    const candidates = [
      { label: 'Đúng số tiền', value: total },
      { label: '+50.000 ₫', value: total + 50000 },
      { label: '+100.000 ₫', value: total + 100000 },
      { label: '200.000 ₫', value: 200000 },
      { label: '500.000 ₫', value: 500000 },
      { label: '1.000.000 ₫', value: 1000000 },
    ];
    return candidates.filter((c, idx) => idx === 0 || c.value >= total);
  }, [order.totalAmount]);

  const changeAmount = Math.max(0, (Number(amountReceived) || 0) - order.totalAmount);
  const isCashInsufficient = activeMethod === 'CASH' && amountReceived < order.totalAmount;

  const handleConfirmPayment = async () => {
    if (activeMethod === 'CASH' && isCashInsufficient) {
      setConfirmError('Số tiền khách đưa chưa đủ để thanh toán hóa đơn.');
      return;
    }

    setConfirming(true);
    setConfirmError(null);
    try {
      const payment = await orderApi.confirmPayment(order.id, {
        method: activeMethod,
        ...(activeMethod === 'CASH' ? { amountReceived: Math.round(amountReceived) } : {}),
      });
      showToast({
        title: 'Thanh toán hoàn tất',
        message: `Đã chốt hóa đơn ${payment.orderCode} (${formatVnd(payment.amount)}).`,
        variant: 'success',
      });
      onPaymentCompleted(payment);
    } catch (error) {
      const parsed = parseApiError(error, 'Không thể xác nhận thanh toán.');
      setConfirmError(parsed.message);
    } finally {
      setConfirming(false);
    }
  };

  if (!open) return null;

  const crcChecksum = qrPreview?.qrPayload ? qrPreview.qrPayload.slice(-4) : '';

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-bistro">
              Chốt hóa đơn & Giải phóng bàn
            </p>
            <h2 id="payment-modal-title" className="mt-0.5 text-xl font-extrabold text-stone-900">
              Thanh toán Bàn {order.tableName} • {order.orderCode}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            aria-label="Đóng cửa sổ thanh toán"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Total Callout */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50/60 px-5 py-3.5">
          <span className="text-sm font-bold text-stone-700">Tổng thanh toán thực thu:</span>
          <span className="text-2xl font-extrabold text-bistro tabular-nums">
            {formatVnd(order.totalAmount)}
          </span>
        </div>

        {/* Method Tabs */}
        <div
          className="mt-4 grid grid-cols-2 gap-2.5"
          role="tablist"
          aria-label="Phương thức thanh toán"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMethod === 'VIETQR'}
            onClick={() => setActiveMethod('VIETQR')}
            className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold transition ${
              activeMethod === 'VIETQR'
                ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            <span>VietQR Động (NAPAS 247)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeMethod === 'CASH'}
            onClick={() => setActiveMethod('CASH')}
            className={`inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold transition ${
              activeMethod === 'CASH'
                ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Banknote className="h-4 w-4" aria-hidden="true" />
            <span>Tiền mặt (CASH)</span>
          </button>
        </div>

        {confirmError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-l-4 border-rose-200 border-l-rose-600 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{confirmError}</span>
          </div>
        )}

        {/* Tab 1: VietQR Dynamic EMVCo SVG */}
        {activeMethod === 'VIETQR' ? (
          <div className="mt-5 space-y-4">
            {qrLoading ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-600">
                <RefreshCw className="mb-2 h-6 w-6 animate-spin text-bistro" />
                <span>Đang sinh chuỗi EMVCo TLV & kiểm tra CRC16-CCITT...</span>
              </div>
            ) : qrError ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center"
              >
                <p className="text-sm font-bold text-rose-900">{qrError}</p>
                <button
                  type="button"
                  onClick={() => void fetchVietQrPreview()}
                  className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Thử lại</span>
                </button>
              </div>
            ) : qrPreview ? (
              <div className="grid grid-cols-1 items-center gap-5 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:grid-cols-12">
                <div className="flex flex-col items-center justify-center sm:col-span-5">
                  <div
                    data-testid="vietqr-svg-container"
                    className="rounded-2xl border-2 border-stone-900 bg-white p-3 shadow-sm"
                  >
                    <QRCodeSVG
                      value={qrPreview.qrPayload}
                      size={204}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <span className="mt-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Chuẩn NAPAS 247 • Quét mọi App Ngân hàng
                  </span>
                </div>

                <div className="space-y-2.5 text-sm sm:col-span-7">
                  <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-2">
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-stone-500">Mã BIN Ngân hàng:</span>
                      <span className="font-mono text-xs font-bold text-stone-900">
                        {qrPreview.bankBin}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-stone-500">Số tài khoản:</span>
                      <span className="font-mono text-sm font-extrabold text-stone-900">
                        {qrPreview.accountNumber}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-stone-500">Chủ tài khoản:</span>
                      <span className="text-xs font-extrabold text-stone-900">
                        {qrPreview.accountName}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-stone-500">Số tiền tự điền:</span>
                      <span className="text-sm font-extrabold text-bistro tabular-nums">
                        {formatVnd(qrPreview.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-xs text-stone-500">Nội dung CK:</span>
                      <span className="font-mono text-xs font-bold text-emerald-800">
                        {qrPreview.addInfo}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRawEmv((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 underline hover:text-stone-900"
                  >
                    <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {showRawEmv
                        ? 'Ẩn chuỗi EMVCo TLV + CRC16'
                        : `Xem chuỗi EMVCo TLV + CRC16 (${crcChecksum})`}
                    </span>
                  </button>

                  {showRawEmv && (
                    <div className="rounded-xl border border-stone-300 bg-stone-900 p-3 font-mono text-[11px] break-all text-stone-200">
                      <span>{qrPreview.qrPayload.slice(0, -4)}</span>
                      <span className="font-extrabold text-amber-400">{crcChecksum}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={onPrintReceipt}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-stone-800 hover:bg-stone-50"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>In phiếu tạm tính / Hóa đơn</span>
              </button>

              <button
                type="button"
                disabled={confirming || qrLoading || Boolean(qrError) || order.totalAmount <= 0}
                onClick={() => void handleConfirmPayment()}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  {confirming ? 'Đang xác nhận...' : 'Xác nhận đã nhận tiền'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Tab 2: Cash Payment */
          <div className="mt-5 space-y-4">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                Chọn nhanh mệnh giá khách đưa
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {cashDenominations.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAmountReceived(preset.value)}
                    className={`inline-flex min-h-[48px] items-center rounded-xl border px-3.5 text-xs font-extrabold tabular-nums transition ${
                      amountReceived === preset.value
                        ? 'border-bistro bg-orange-50 text-bistro ring-1 ring-bistro'
                        : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-stone-700">
                Số tiền khách đưa (VNĐ)
                <input
                  type="number"
                  min={0}
                  step={1000}
                  aria-label="Số tiền khách đưa"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(Number(e.target.value))}
                  className="mt-1.5 block min-h-[50px] w-full rounded-xl border border-stone-300 bg-stone-50/50 px-4 text-base font-extrabold text-stone-900 tabular-nums focus:border-bistro focus:bg-white focus:outline-none"
                />
              </label>

              <div className="flex flex-col justify-center rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                <span className="text-xs font-bold text-emerald-900">Tiền thừa trả khách:</span>
                <span
                  data-testid="cash-change-amount"
                  className="mt-1 text-xl font-extrabold text-emerald-800 tabular-nums"
                >
                  {formatVnd(changeAmount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={onPrintReceipt}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-stone-800 hover:bg-stone-50"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>In phiếu tạm tính / Hóa đơn</span>
              </button>

              <button
                type="button"
                disabled={confirming || isCashInsufficient || order.totalAmount <= 0}
                onClick={() => void handleConfirmPayment()}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-bistro px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-bistro-hover disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  {confirming ? 'Đang chốt đơn...' : 'Xác nhận thanh toán tiền mặt'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
