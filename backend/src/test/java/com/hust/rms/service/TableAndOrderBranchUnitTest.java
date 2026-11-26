package com.hust.rms.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.hust.rms.common.exception.*;
import com.hust.rms.domain.entity.*;
import com.hust.rms.domain.enums.*;
import com.hust.rms.domain.state.*;
import com.hust.rms.dto.order.*;
import com.hust.rms.dto.table.*;
import com.hust.rms.repository.*;
import com.hust.rms.security.RmsUserPrincipal;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

/**
 * HUST IT3180 RMS — Kiểm thử hộp trắng phủ nhánh cho TableService và OrderService (Chương 9).
 */
class TableAndOrderBranchUnitTest {

    private static Area sampleArea() {
        Area area = new Area();
        area.setId(1L);
        area.setName("Tầng 1");
        return area;
    }

    private static DiningTable sampleTable(Long id, String name, TableStatus status, Long version) {
        DiningTable t = new DiningTable();
        t.setId(id);
        t.setArea(sampleArea());
        t.setName(name);
        t.setCapacity(4);
        t.setStatus(status);
        t.setVersion(version);
        return t;
    }

    private static RmsUserPrincipal principalOf(Long id, String username, Role role) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setPasswordHash("pw");
        u.setFullName(username);
        u.setRole(role);
        u.setIsActive(true);
        return RmsUserPrincipal.fromUser(u);
    }

    @Test
    @DisplayName("TableService: phủ các đường đi cơ sở của openTable, CRUD bàn, chuyển bàn và gộp bàn ACID")
    void tableServiceWhiteBoxPaths() {
        DiningTableRepository tableRepo = mock(DiningTableRepository.class);
        AreaRepository areaRepo = mock(AreaRepository.class);
        OrderRepository orderRepo = mock(OrderRepository.class);
        OrderItemRepository itemRepo = mock(OrderItemRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        OrderCodeGenerator codeGen = mock(OrderCodeGenerator.class);
        AuditLogService auditSvc = mock(AuditLogService.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);

        TableService tableSvc = new TableService(
                tableRepo, areaRepo, orderRepo, itemRepo, userRepo,
                new TableStateMachine(), codeGen, auditSvc, publisher
        );
        RmsUserPrincipal staffActor = principalOf(2L, "staff1", Role.STAFF);

        when(tableRepo.findAllWithArea(null)).thenReturn(List.of());
        assertThat(tableSvc.listTables(null)).isEmpty();

        when(areaRepo.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> tableSvc.createTable(new TableUpsertRequest(99L, "T9-01", 4)))
                .isInstanceOf(ResourceNotFoundException.class);

        when(areaRepo.findById(1L)).thenReturn(Optional.of(sampleArea()));
        when(tableRepo.existsByNameIgnoreCase("T1-01")).thenReturn(true);
        assertThatThrownBy(() -> tableSvc.createTable(new TableUpsertRequest(1L, " T1-01 ", 4)))
                .isInstanceOf(ConflictException.class);

        DiningTable occupied = sampleTable(1L, "T1-01", TableStatus.OCCUPIED, 1L);
        when(tableRepo.findByIdWithArea(1L)).thenReturn(Optional.of(occupied));
        assertThatThrownBy(() -> tableSvc.deleteTable(1L)).isInstanceOf(ConflictException.class);

        DiningTable waiting = sampleTable(2L, "T1-02", TableStatus.WAITING_PAYMENT, 1L);
        when(tableRepo.findByIdWithArea(2L)).thenReturn(Optional.of(waiting));
        assertThatThrownBy(() -> tableSvc.deleteTable(2L)).isInstanceOf(ConflictException.class);

        DiningTable availableWithHistory = sampleTable(3L, "T1-03", TableStatus.AVAILABLE, 0L);
        when(tableRepo.findByIdWithArea(3L)).thenReturn(Optional.of(availableWithHistory));
        when(orderRepo.existsByTableId(3L)).thenReturn(true);
        assertThatThrownBy(() -> tableSvc.deleteTable(3L)).isInstanceOf(ConflictException.class);
        when(orderRepo.existsByTableId(3L)).thenReturn(false);
        tableSvc.deleteTable(3L);
        verify(tableRepo).delete(availableWithHistory);

        when(tableRepo.existsByNameIgnoreCaseAndIdNot("TRUNG", 3L)).thenReturn(true);
        assertThatThrownBy(() -> tableSvc.updateTable(3L, new TableUpsertRequest(1L, "TRUNG", 6)))
                .isInstanceOf(ConflictException.class);
        when(tableRepo.existsByNameIgnoreCaseAndIdNot("T1-03B", 3L)).thenReturn(false);
        when(tableRepo.saveAndFlush(any(DiningTable.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepo.findActiveDetailByTableId(3L)).thenReturn(Optional.empty());
        assertThat(tableSvc.updateTable(3L, new TableUpsertRequest(1L, "T1-03B", 6)).capacity()).isEqualTo(6);

        // openTable basis paths: P1 not found, P2 not AVAILABLE, P3 version mismatch, P4 already open, P5 user missing
        when(tableRepo.findByIdWithArea(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> tableSvc.openTable(404L, new OpenTableRequest(0L), staffActor))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> tableSvc.openTable(1L, new OpenTableRequest(1L), staffActor))
                .isInstanceOf(ConflictException.class);

        DiningTable freshTable = sampleTable(4L, "T1-04", TableStatus.AVAILABLE, 2L);
        when(tableRepo.findByIdWithArea(4L)).thenReturn(Optional.of(freshTable));
        assertThatThrownBy(() -> tableSvc.openTable(4L, new OpenTableRequest(9L), staffActor))
                .isInstanceOf(ConflictException.class);

        when(orderRepo.existsByTableIdAndStatus(4L, OrderStatus.OPEN)).thenReturn(true);
        assertThatThrownBy(() -> tableSvc.openTable(4L, new OpenTableRequest(2L), staffActor))
                .isInstanceOf(ConflictException.class);

        when(orderRepo.existsByTableIdAndStatus(4L, OrderStatus.OPEN)).thenReturn(false);
        when(userRepo.findById(2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> tableSvc.openTable(4L, new OpenTableRequest(2L), staffActor))
                .isInstanceOf(ResourceNotFoundException.class);

        // transferTable & mergeTables guard branches
        assertThatThrownBy(() -> tableSvc.transferTable(1L, new TransferTableRequest(1L), staffActor))
                .isInstanceOf(BadRequestException.class);
        when(orderRepo.findActiveDetailByTableId(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> tableSvc.transferTable(1L, new TransferTableRequest(3L), staffActor))
                .isInstanceOf(BadRequestException.class);

        Order srcOrder = new Order();
        srcOrder.setId(100L);
        srcOrder.setOrderCode("ORD-20260515-0001");
        srcOrder.setTable(occupied);
        srcOrder.setStatus(OrderStatus.OPEN);
        when(orderRepo.findActiveDetailByTableId(1L)).thenReturn(Optional.of(srcOrder));
        assertThatThrownBy(() -> tableSvc.transferTable(1L, new TransferTableRequest(2L), staffActor))
                .isInstanceOf(ConflictException.class);

        assertThatThrownBy(() -> tableSvc.mergeTables(new MergeTablesRequest(List.of(), 3L), staffActor))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> tableSvc.mergeTables(new MergeTablesRequest(List.of(3L), 3L), staffActor))
                .isInstanceOf(BadRequestException.class);

        DiningTable cleaningDst = sampleTable(5L, "T1-05", TableStatus.CLEANING, 0L);
        when(tableRepo.findByIdWithArea(5L)).thenReturn(Optional.of(cleaningDst));
        assertThatThrownBy(() -> tableSvc.mergeTables(new MergeTablesRequest(List.of(1L), 5L), staffActor))
                .isInstanceOf(ConflictException.class);

        // Merge into an AVAILABLE destination table (creates new destination order)
        User staffEntity = new User();
        staffEntity.setId(2L);
        staffEntity.setFullName("Hải");
        when(userRepo.findById(2L)).thenReturn(Optional.of(staffEntity));
        when(codeGen.nextUniqueCode()).thenReturn("ORD-20260515-0099");
        when(orderRepo.saveAndFlush(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) {
                o.setId(200L);
            }
            return o;
        });
        when(orderRepo.findDetailById(200L)).thenAnswer(inv -> {
            Order dst = new Order();
            dst.setId(200L);
            dst.setOrderCode("ORD-20260515-0099");
            dst.setTable(availableWithHistory);
            dst.setStaff(staffEntity);
            dst.setStatus(OrderStatus.OPEN);
            dst.setTotalAmount(BigDecimal.ZERO);
            return Optional.of(dst);
        });
        OrderDto mergedToAvailable = tableSvc.mergeTables(new MergeTablesRequest(List.of(1L), 3L), staffActor);
        assertThat(mergedToAvailable.orderCode()).isEqualTo("ORD-20260515-0099");
    }

    @Test
    @DisplayName("OrderService: phủ toàn bộ nhánh lọc ngày, thêm món tạm hết (422), hủy món và yêu cầu thanh toán")
    void orderServiceAllBranches() {
        OrderRepository orderRepo = mock(OrderRepository.class);
        DiningTableRepository tableRepo = mock(DiningTableRepository.class);
        MenuItemRepository menuRepo = mock(MenuItemRepository.class);
        AuditLogService auditSvc = mock(AuditLogService.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);

        OrderService orderSvc = new OrderService(
                orderRepo, tableRepo, menuRepo,
                new OrderItemStateMachine(), new TableStateMachine(), auditSvc, publisher
        );
        RmsUserPrincipal adminActor = principalOf(1L, "admin", Role.ADMIN);

        when(tableRepo.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> orderSvc.getActiveOrderByTable(99L))
                .isInstanceOf(ResourceNotFoundException.class);

        when(tableRepo.existsById(1L)).thenReturn(true);
        when(orderRepo.findActiveDetailByTableId(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> orderSvc.getActiveOrderByTable(1L))
                .isInstanceOf(ResourceNotFoundException.class);

        assertThatThrownBy(() -> orderSvc.listOrders(
                OrderStatus.PAID, LocalDate.of(2026, 5, 20), LocalDate.of(2026, 5, 10), null))
                .isInstanceOf(BadRequestException.class);

        DiningTable table = sampleTable(1L, "T1-01", TableStatus.WAITING_PAYMENT, 1L);
        User staff = new User();
        staff.setId(2L);
        staff.setFullName("Hải");

        Order closedOrder = new Order();
        closedOrder.setId(10L);
        closedOrder.setOrderCode("ORD-CLOSED");
        closedOrder.setTable(table);
        closedOrder.setStaff(staff);
        closedOrder.setStatus(OrderStatus.PAID);
        closedOrder.setTotalAmount(BigDecimal.valueOf(100000));
        when(orderRepo.findDetailById(10L)).thenReturn(Optional.of(closedOrder));

        when(orderRepo.findOrderSummariesInWindow(any(), any())).thenReturn(List.of(closedOrder));
        assertThat(orderSvc.listOrders(null, null, null, null)).hasSize(1);
        assertThat(orderSvc.listOrders(OrderStatus.OPEN, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 2), null)).isEmpty();
        assertThat(orderSvc.listOrders(OrderStatus.PAID, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 2), PaymentMethod.CASH)).isEmpty();

        when(orderRepo.findDetailById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> orderSvc.getOrderById(404L)).isInstanceOf(ResourceNotFoundException.class);

        assertThatThrownBy(() -> orderSvc.addItemsToOrder(10L, new AddOrderItemsRequest(List.of(new OrderItemRequest(1L, 1, null)))))
                .isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> orderSvc.cancelOrderItem(10L, 1L, new CancelOrderItemRequest("X"), adminActor))
                .isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> orderSvc.requestPayment(10L))
                .isInstanceOf(BadRequestException.class);

        Order openOrder = new Order();
        openOrder.setId(11L);
        openOrder.setOrderCode("ORD-OPEN");
        openOrder.setTable(table);
        openOrder.setStaff(staff);
        openOrder.setStatus(OrderStatus.OPEN);
        openOrder.setTotalAmount(BigDecimal.valueOf(50000));
        when(orderRepo.findDetailById(11L)).thenReturn(Optional.of(openOrder));

        when(menuRepo.findAllById(any())).thenReturn(List.of());
        assertThatThrownBy(() -> orderSvc.addItemsToOrder(11L, new AddOrderItemsRequest(List.of(new OrderItemRequest(77L, 1, null)))))
                .isInstanceOf(ResourceNotFoundException.class);

        MenuItem deletedDish = new MenuItem();
        deletedDish.setId(78L);
        deletedDish.setName("Món đã xóa mềm");
        deletedDish.setIsAvailable(true);
        deletedDish.setDeletedAt(Instant.now());
        when(menuRepo.findAllById(Set.of(78L))).thenReturn(List.of(deletedDish));
        assertThatThrownBy(() -> orderSvc.addItemsToOrder(11L, new AddOrderItemsRequest(List.of(new OrderItemRequest(78L, 1, null)))))
                .isInstanceOf(UnprocessableEntityException.class);

        assertThatThrownBy(() -> orderSvc.cancelOrderItem(11L, 999L, null, adminActor))
                .isInstanceOf(ResourceNotFoundException.class);

        // requestPayment when table is already WAITING_PAYMENT (idempotent branch)
        assertThat(orderSvc.requestPayment(11L).orderCode()).isEqualTo("ORD-OPEN");
    }
}
