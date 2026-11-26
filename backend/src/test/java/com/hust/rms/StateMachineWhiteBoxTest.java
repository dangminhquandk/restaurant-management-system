package com.hust.rms;

import static org.junit.jupiter.api.Assertions.*;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.common.exception.ForbiddenOperationException;
import com.hust.rms.common.exception.InvalidStateTransitionException;
import com.hust.rms.domain.enums.OrderItemStatus;
import com.hust.rms.domain.enums.Role;
import com.hust.rms.domain.enums.TableStatus;
import com.hust.rms.domain.state.OrderItemStateMachine;
import com.hust.rms.domain.state.TableStateMachine;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * HUST IT3180 RMS — Kiểm thử hộp trắng (100% Branch Coverage) cho OrderItemStateMachine và TableStateMachine.
 */
class StateMachineWhiteBoxTest {

    private final OrderItemStateMachine itemMachine = new OrderItemStateMachine();
    private final TableStateMachine tableMachine = new TableStateMachine();

    static Stream<Arguments> orderItemTransitionCases() {
        return Stream.of(
                // Chuyển tiếp KDS hợp lệ
                Arguments.of(OrderItemStatus.PENDING, OrderItemStatus.COOKING, Role.KITCHEN, null, null),
                Arguments.of(OrderItemStatus.COOKING, OrderItemStatus.READY, Role.KITCHEN, null, null),
                Arguments.of(OrderItemStatus.READY, OrderItemStatus.SERVED, Role.STAFF, null, null),

                // Chuyển tiếp nhảy cóc / lùi trạng thái phi logic -> InvalidStateTransitionException (400)
                Arguments.of(OrderItemStatus.PENDING, OrderItemStatus.READY, Role.KITCHEN, null, InvalidStateTransitionException.class),
                Arguments.of(OrderItemStatus.PENDING, OrderItemStatus.SERVED, Role.ADMIN, null, InvalidStateTransitionException.class),
                Arguments.of(OrderItemStatus.PENDING, OrderItemStatus.PENDING, Role.ADMIN, null, InvalidStateTransitionException.class),
                Arguments.of(OrderItemStatus.COOKING, OrderItemStatus.SERVED, Role.KITCHEN, null, InvalidStateTransitionException.class),
                Arguments.of(OrderItemStatus.COOKING, OrderItemStatus.PENDING, Role.ADMIN, null, InvalidStateTransitionException.class),
                Arguments.of(OrderItemStatus.READY, OrderItemStatus.COOKING, Role.KITCHEN, null, InvalidStateTransitionException.class),
                Arguments.of(OrderItemStatus.SERVED, OrderItemStatus.READY, Role.ADMIN, null, InvalidStateTransitionException.class),
                Arguments.of(OrderItemStatus.CANCELLED, OrderItemStatus.COOKING, Role.ADMIN, null, InvalidStateTransitionException.class),

                // Bảng quyết định Hủy món (CANCELLED)
                Arguments.of(OrderItemStatus.PENDING, OrderItemStatus.CANCELLED, Role.STAFF, null, null),
                Arguments.of(OrderItemStatus.PENDING, OrderItemStatus.CANCELLED, Role.KITCHEN, "", null),
                Arguments.of(OrderItemStatus.PENDING, OrderItemStatus.CANCELLED, Role.ADMIN, "Khách đổi món", null),
                Arguments.of(OrderItemStatus.COOKING, OrderItemStatus.CANCELLED, Role.STAFF, "Khách về gấp", ForbiddenOperationException.class),
                Arguments.of(OrderItemStatus.COOKING, OrderItemStatus.CANCELLED, Role.KITCHEN, null, BadRequestException.class),
                Arguments.of(OrderItemStatus.COOKING, OrderItemStatus.CANCELLED, Role.ADMIN, "   ", BadRequestException.class),
                Arguments.of(OrderItemStatus.COOKING, OrderItemStatus.CANCELLED, Role.KITCHEN, "Hết nguyên liệu đột xuất", null),
                Arguments.of(OrderItemStatus.COOKING, OrderItemStatus.CANCELLED, Role.ADMIN, "Khách dị ứng thực phẩm", null),
                Arguments.of(OrderItemStatus.READY, OrderItemStatus.CANCELLED, Role.ADMIN, "Đã nấu xong", InvalidStateTransitionException.class),
                Arguments.of(OrderItemStatus.SERVED, OrderItemStatus.CANCELLED, Role.ADMIN, "Đã lên bàn", InvalidStateTransitionException.class),
                Arguments.of(OrderItemStatus.CANCELLED, OrderItemStatus.CANCELLED, Role.ADMIN, "Hủy lần 2", InvalidStateTransitionException.class)
        );
    }

    @ParameterizedTest(name = "[{index}] Item {0} -> {1} (role={2}) => expect {4}")
    @MethodSource("orderItemTransitionCases")
    @DisplayName("OrderItemStateMachine: bao phủ toàn bộ nhánh chuyển trạng thái & bảng quyết định hủy món")
    void orderItemStateMachineCoversAllBranches(
            OrderItemStatus current,
            OrderItemStatus target,
            Role role,
            String reason,
            Class<? extends Throwable> expectedError
    ) {
        if (expectedError == null) {
            assertDoesNotThrow(() -> itemMachine.validateTransition(current, target, role, reason));
        } else {
            assertThrows(expectedError, () -> itemMachine.validateTransition(current, target, role, reason));
        }
    }

    static Stream<Arguments> tableTransitionMatrix() {
        return Stream.of(
                // 7 cung hợp lệ
                Arguments.of(TableStatus.AVAILABLE, TableStatus.OCCUPIED, true),
                Arguments.of(TableStatus.OCCUPIED, TableStatus.WAITING_PAYMENT, true),
                Arguments.of(TableStatus.OCCUPIED, TableStatus.CLEANING, true),
                Arguments.of(TableStatus.OCCUPIED, TableStatus.AVAILABLE, true),
                Arguments.of(TableStatus.WAITING_PAYMENT, TableStatus.OCCUPIED, true),
                Arguments.of(TableStatus.WAITING_PAYMENT, TableStatus.CLEANING, true),
                Arguments.of(TableStatus.WAITING_PAYMENT, TableStatus.AVAILABLE, true),
                Arguments.of(TableStatus.CLEANING, TableStatus.AVAILABLE, true),

                // 8 cung không hợp lệ
                Arguments.of(TableStatus.AVAILABLE, TableStatus.AVAILABLE, false),
                Arguments.of(TableStatus.AVAILABLE, TableStatus.WAITING_PAYMENT, false),
                Arguments.of(TableStatus.AVAILABLE, TableStatus.CLEANING, false),
                Arguments.of(TableStatus.OCCUPIED, TableStatus.OCCUPIED, false),
                Arguments.of(TableStatus.WAITING_PAYMENT, TableStatus.WAITING_PAYMENT, false),
                Arguments.of(TableStatus.CLEANING, TableStatus.OCCUPIED, false),
                Arguments.of(TableStatus.CLEANING, TableStatus.WAITING_PAYMENT, false),
                Arguments.of(TableStatus.CLEANING, TableStatus.CLEANING, false)
        );
    }

    @ParameterizedTest(name = "[{index}] Table {0} -> {1} (valid={2})")
    @MethodSource("tableTransitionMatrix")
    @DisplayName("TableStateMachine: kiểm chứng đầy đủ ma trận 16 cặp chuyển trạng thái bàn")
    void tableStateMachineValidatesFullTransitionMatrix(
            TableStatus current,
            TableStatus target,
            boolean valid
    ) {
        if (valid) {
            assertDoesNotThrow(() -> tableMachine.validateTransition(current, target));
        } else {
            assertThrows(InvalidStateTransitionException.class,
                    () -> tableMachine.validateTransition(current, target));
        }
    }

    @ParameterizedTest
    @EnumSource(TableStatus.class)
    @DisplayName("TableStateMachine.validateCleanTransition: chỉ cho phép khi bàn đang CLEANING")
    void tableCleanTransitionOnlyAllowsCleaningState(TableStatus status) {
        if (status == TableStatus.CLEANING) {
            assertDoesNotThrow(() -> tableMachine.validateCleanTransition(status));
        } else {
            InvalidStateTransitionException ex = assertThrows(
                    InvalidStateTransitionException.class,
                    () -> tableMachine.validateCleanTransition(status)
            );
            assertEquals("TABLE_NOT_CLEANING", ex.getCode());
        }
    }
}
