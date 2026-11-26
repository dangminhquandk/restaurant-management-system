package com.hust.rms.service.mapper;

import com.hust.rms.domain.entity.Area;
import com.hust.rms.domain.entity.Category;
import com.hust.rms.domain.entity.DiningTable;
import com.hust.rms.domain.entity.MenuItem;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.entity.OrderItem;
import com.hust.rms.domain.entity.Payment;
import com.hust.rms.domain.entity.User;
import com.hust.rms.dto.area.AreaDto;
import com.hust.rms.dto.kds.KdsItemDto;
import com.hust.rms.dto.menu.CategoryDto;
import com.hust.rms.dto.menu.MenuItemDto;
import com.hust.rms.dto.order.OrderDto;
import com.hust.rms.dto.order.OrderItemDto;
import com.hust.rms.dto.order.OrderSummaryDto;
import com.hust.rms.dto.payment.PaymentDto;
import com.hust.rms.dto.table.DiningTableDto;
import com.hust.rms.dto.user.UserDto;
import java.math.BigDecimal;
import java.util.List;

public final class DtoMapper {

    private DtoMapper() {
    }

    public static AreaDto toAreaDto(Area area) {
        return new AreaDto(
                area.getId(),
                area.getName(),
                area.getDisplayOrder(),
                area.getDescription()
        );
    }

    public static DiningTableDto toDiningTableDto(DiningTable table, Order activeOrder) {
        return new DiningTableDto(
                table.getId(),
                table.getArea().getId(),
                table.getArea().getName(),
                table.getName(),
                table.getCapacity(),
                table.getStatus(),
                table.getVersion(),
                activeOrder != null ? activeOrder.getId() : null,
                activeOrder != null ? activeOrder.getOrderCode() : null,
                activeOrder != null ? activeOrder.getTotalAmount() : null
        );
    }

    public static CategoryDto toCategoryDto(Category category) {
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDisplayOrder(),
                Boolean.TRUE.equals(category.getIsActive())
        );
    }

    public static MenuItemDto toMenuItemDto(MenuItem item) {
        return new MenuItemDto(
                item.getId(),
                item.getCategory().getId(),
                item.getCategory().getName(),
                item.getName(),
                item.getPrice(),
                item.getImageUrl(),
                item.getDescription(),
                Boolean.TRUE.equals(item.getIsAvailable())
        );
    }

    public static OrderItemDto toOrderItemDto(OrderItem item) {
        BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
        return new OrderItemDto(
                item.getId(),
                item.getOrder().getId(),
                item.getMenuItem().getId(),
                item.getMenuItem().getName(),
                item.getBatchNo(),
                item.getQuantity(),
                item.getUnitPrice(),
                subtotal,
                item.getNote(),
                item.getStatus(),
                item.getCancelReason(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }

    public static PaymentDto toPaymentDto(Payment payment) {
        if (payment == null) {
            return null;
        }
        return new PaymentDto(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getOrder().getOrderCode(),
                payment.getMethod(),
                payment.getAmount(),
                payment.getAmountReceived(),
                payment.getChangeAmount(),
                payment.getQrPayload(),
                payment.getStatus(),
                payment.getPaidAt(),
                payment.getCashier().getFullName()
        );
    }

    public static OrderDto toOrderDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems().stream()
                .map(DtoMapper::toOrderItemDto)
                .toList();
        return new OrderDto(
                order.getId(),
                order.getOrderCode(),
                order.getTable().getId(),
                order.getTable().getName(),
                order.getTable().getArea().getName(),
                order.getStaff().getId(),
                order.getStaff().getFullName(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getVersion(),
                order.getCreatedAt(),
                order.getClosedAt(),
                itemDtos,
                toPaymentDto(order.getPayment())
        );
    }

    public static OrderSummaryDto toOrderSummaryDto(Order order) {
        Payment payment = order.getPayment();
        return new OrderSummaryDto(
                order.getId(),
                order.getOrderCode(),
                order.getTable().getName(),
                order.getStaff().getFullName(),
                order.getStatus(),
                order.getTotalAmount(),
                payment != null ? payment.getMethod() : null,
                order.getCreatedAt(),
                order.getClosedAt()
        );
    }

    public static KdsItemDto toKdsItemDto(OrderItem item) {
        Order order = item.getOrder();
        DiningTable table = order.getTable();
        return new KdsItemDto(
                item.getId(),
                order.getId(),
                order.getOrderCode(),
                table.getId(),
                table.getName(),
                table.getArea().getName(),
                item.getMenuItem().getId(),
                item.getMenuItem().getName(),
                item.getBatchNo(),
                item.getQuantity(),
                item.getNote(),
                item.getStatus(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }

    public static UserDto toUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole(),
                Boolean.TRUE.equals(user.getIsActive()),
                user.getCreatedAt()
        );
    }
}
