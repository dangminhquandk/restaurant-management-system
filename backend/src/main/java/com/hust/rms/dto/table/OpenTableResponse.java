package com.hust.rms.dto.table;

import com.hust.rms.dto.order.OrderDto;

public record OpenTableResponse(
        DiningTableDto table,
        OrderDto order
) {
}
