import type { OrderDto, PaymentDto } from '../../types/api';
import { formatDateTimeVi, formatVnd } from '../../utils/format';

interface PrintableReceiptProps {
  order: OrderDto;
  payment?: PaymentDto | null;
  restaurantName?: string;
  visiblePreview?: boolean;
}

export function PrintableReceipt({
  order,
  payment,
  restaurantName = 'Nhà Hàng Bách Khoa Bistro',
  visiblePreview = false,
}: PrintableReceiptProps) {
  const effectivePayment = payment ?? order.payment;
  const activeItems = order.items.filter((item) => item.status !== 'CANCELLED');
  const isPaid = order.status === 'PAID' || Boolean(effectivePayment);

  return (
    <section
      aria-label="Phiếu in hóa đơn"
      className={`printable-receipt-root ${
        visiblePreview
          ? 'block rounded-2xl border border-stone-300 bg-white p-5 text-stone-900 shadow-sm'
          : 'hidden print:block'
      }`}
    >
      <div className="text-center border-b border-dashed border-stone-400 pb-3">
        <p className="text-base font-extrabold uppercase tracking-wide">{restaurantName}</p>
        <p className="text-[11px] text-stone-600">Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội</p>
        <h3 className="mt-2 text-sm font-extrabold uppercase tracking-wider">
          {isPaid ? 'HÓA ĐƠN THANH TOÁN' : 'PHIẾU TẠM TÍNH'}
        </h3>
      </div>

      <div className="my-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Mã hóa đơn:</span>
          <span className="font-mono font-bold">{order.orderCode}</span>
        </div>
        <div className="flex justify-between">
          <span>Bàn / Khu vực:</span>
          <span className="font-bold">
            {order.tableName} ({order.areaName})
          </span>
        </div>
        <div className="flex justify-between">
          <span>Phục vụ:</span>
          <span>{order.staffName}</span>
        </div>
        <div className="flex justify-between">
          <span>Giờ mở bàn:</span>
          <span className="tabular-nums">{formatDateTimeVi(order.createdAt)}</span>
        </div>
        {effectivePayment?.paidAt && (
          <div className="flex justify-between">
            <span>Giờ thanh toán:</span>
            <span className="tabular-nums">{formatDateTimeVi(effectivePayment.paidAt)}</span>
          </div>
        )}
      </div>

      <table className="w-full border-y border-dashed border-stone-400 text-xs">
        <thead>
          <tr className="border-b border-stone-300 text-left font-bold">
            <th className="py-1.5">Món</th>
            <th className="py-1.5 text-center">SL</th>
            <th className="py-1.5 text-right">Đ.Giá</th>
            <th className="py-1.5 text-right">T.Tiền</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {activeItems.map((item) => (
            <tr key={item.id}>
              <td className="py-1.5 pr-2 font-medium">{item.menuItemName}</td>
              <td className="py-1.5 text-center tabular-nums">{item.quantity}</td>
              <td className="py-1.5 text-right tabular-nums">{formatVnd(item.unitPrice)}</td>
              <td className="py-1.5 text-right font-semibold tabular-nums">
                {formatVnd(item.unitPrice * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 space-y-1 text-xs">
        <div className="flex justify-between text-sm font-extrabold">
          <span>TỔNG CỘNG:</span>
          <span className="tabular-nums">{formatVnd(order.totalAmount)}</span>
        </div>

        {effectivePayment && (
          <>
            <div className="flex justify-between">
              <span>Phương thức:</span>
              <span className="font-bold">
                {effectivePayment.method === 'VIETQR' ? 'VietQR NAPAS 247' : 'Tiền mặt (CASH)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Khách thanh toán:</span>
              <span className="tabular-nums">{formatVnd(effectivePayment.amountReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tiền thừa trả khách:</span>
              <span className="tabular-nums">{formatVnd(effectivePayment.changeAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân xác nhận:</span>
              <span>{effectivePayment.cashierName}</span>
            </div>
          </>
        )}
      </div>

      <p className="mt-4 border-t border-dashed border-stone-400 pt-2.5 text-center text-[11px] font-medium text-stone-600">
        Cảm ơn Quý khách & Hẹn gặp lại tại {restaurantName}!
      </p>
    </section>
  );
}
