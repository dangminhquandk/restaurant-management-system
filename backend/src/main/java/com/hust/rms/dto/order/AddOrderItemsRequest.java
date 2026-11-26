package com.hust.rms.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AddOrderItemsRequest(
        @NotEmpty(message = "Danh sách món gọi không được để trống")
        @Valid
        List<OrderItemRequest> items
) {
}
