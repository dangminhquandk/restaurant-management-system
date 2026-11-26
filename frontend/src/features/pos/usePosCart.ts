import { useCallback, useMemo, useState } from 'react';
import type { MenuItemDto } from '../../types/api';

export interface CartBatchLine {
  menuItemId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  note: string;
}

const MAX_ITEM_QTY = 99;

/**
 * HUST IT3180 RMS — Custom Hook quản lý giỏ gọi thêm theo lượt trên màn hình POS (UC-04).
 * Tách từ OrderPadPage theo nguyên lý Separation of Concerns / Extract Hook (Chương 8).
 */
export function usePosCart() {
  const [cart, setCart] = useState<CartBatchLine[]>([]);

  const cartQtyByMenuId = useMemo(() => {
    const map = new Map<number, number>();
    for (const line of cart) {
      map.set(line.menuItemId, line.quantity);
    }
    return map;
  }, [cart]);

  const totalCartQuantity = useMemo(
    () => cart.reduce((acc, line) => acc + line.quantity, 0),
    [cart]
  );

  const newBatchSubtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart]
  );

  const addDishToCart = useCallback((item: MenuItemDto): boolean => {
    if (!item.isAvailable) {
      return false;
    }
    setCart((prev) => {
      const existingIdx = prev.findIndex((line) => line.menuItemId === item.id);
      if (existingIdx >= 0) {
        return prev.map((line, idx) =>
          idx === existingIdx
            ? { ...line, quantity: Math.min(MAX_ITEM_QTY, line.quantity + 1) }
            : line
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
          note: '',
        },
      ];
    });
    return true;
  }, []);

  const changeCartQty = useCallback((menuItemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) =>
          line.menuItemId === menuItemId
            ? { ...line, quantity: Math.min(MAX_ITEM_QTY, line.quantity + delta) }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  }, []);

  const changeCartNote = useCallback((menuItemId: number, note: string) => {
    setCart((prev) =>
      prev.map((line) => (line.menuItemId === menuItemId ? { ...line, note } : line))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return {
    cart,
    cartQtyByMenuId,
    totalCartQuantity,
    newBatchSubtotal,
    addDishToCart,
    changeCartQty,
    changeCartNote,
    clearCart,
  };
}
