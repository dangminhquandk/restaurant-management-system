import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MenuItemDto } from '../../../types/api';
import { usePosCart } from '../usePosCart';

const phoBo: MenuItemDto = {
  id: 101,
  categoryId: 1,
  categoryName: 'Món chính',
  name: 'Phở bò tái lăn',
  price: 65000,
  imageUrl: null,
  description: null,
  isAvailable: true,
};

const soldOutNem: MenuItemDto = {
  ...phoBo,
  id: 102,
  name: 'Nem rán Hà Nội',
  price: 55000,
  isAvailable: false,
};

describe('usePosCart (Ch.8 Extracted Hook)', () => {
  it('adds available items, blocks unavailable items, updates notes, caps at 99 and clears', () => {
    const { result } = renderHook(() => usePosCart());

    act(() => {
      expect(result.current.addDishToCart(soldOutNem)).toBe(false);
    });
    expect(result.current.cart).toHaveLength(0);

    act(() => {
      expect(result.current.addDishToCart(phoBo)).toBe(true);
      result.current.addDishToCart(phoBo);
      result.current.changeCartNote(101, 'Ít hành, thêm quẩy');
    });

    expect(result.current.totalCartQuantity).toBe(2);
    expect(result.current.cartQtyByMenuId.get(101)).toBe(2);
    expect(result.current.newBatchSubtotal).toBe(130000);
    expect(result.current.cart[0].note).toBe('Ít hành, thêm quẩy');

    act(() => {
      result.current.changeCartQty(101, 150);
    });
    expect(result.current.cart[0].quantity).toBe(99);

    act(() => {
      result.current.changeCartQty(101, -99);
    });
    expect(result.current.cart).toHaveLength(0);

    act(() => {
      result.current.addDishToCart(phoBo);
      result.current.clearCart();
    });
    expect(result.current.cart).toHaveLength(0);
  });
});
