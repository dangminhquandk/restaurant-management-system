package com.hust.rms.service;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.common.exception.ConflictException;
import com.hust.rms.common.exception.ResourceNotFoundException;
import com.hust.rms.domain.entity.Area;
import com.hust.rms.domain.entity.DiningTable;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.entity.OrderItem;
import com.hust.rms.domain.entity.User;
import com.hust.rms.domain.enums.OrderItemStatus;
import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.TableStatus;
import com.hust.rms.domain.state.TableStateMachine;
import com.hust.rms.dto.order.OrderDto;
import com.hust.rms.dto.order.OrderItemDto;
import com.hust.rms.dto.table.*;
import com.hust.rms.event.OrderItemsChangedEvent;
import com.hust.rms.event.TableChangedEvent;
import com.hust.rms.repository.*;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.mapper.DtoMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HUST IT3180 RMS — Quản lý sơ đồ bàn, mở bàn khóa lạc quan @Version, chuyển bàn và gộp bàn ACID (FR-04..07).
 */
@Service
public class TableService {

    private final DiningTableRepository diningTableRepository;
    private final AreaRepository areaRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepo;
    private final UserRepository userRepository;
    private final TableStateMachine tableStateMachine;
    private final OrderCodeGenerator orderCodeGenerator;
    private final AuditLogService auditLogSvc;
    private final ApplicationEventPublisher eventPublisher;

    public TableService(
            DiningTableRepository diningTableRepository,
            AreaRepository areaRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepo,
            UserRepository userRepository,
            TableStateMachine tableStateMachine,
            OrderCodeGenerator orderCodeGenerator,
            AuditLogService auditLogSvc,
            ApplicationEventPublisher eventPublisher
    ) {
        this.diningTableRepository = diningTableRepository;
        this.areaRepository = areaRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepo = orderItemRepo;
        this.userRepository = userRepository;
        this.tableStateMachine = tableStateMachine;
        this.orderCodeGenerator = orderCodeGenerator;
        this.auditLogSvc = auditLogSvc;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public List<DiningTableDto> listTables(Long areaId) {
        List<DiningTable> tables = diningTableRepository.findAllWithArea(areaId);
        if (tables.isEmpty()) {
            return List.of();
        }
        List<Long> tableIds = tables.stream().map(DiningTable::getId).toList();
        Map<Long, Order> openOrdersByTable = orderRepository
                .findByStatusAndTableIdIn(OrderStatus.OPEN, tableIds)
                .stream()
                .collect(Collectors.toMap(o -> o.getTable().getId(), Function.identity(), (a, b) -> a));
        return tables.stream()
                .map(table -> DtoMapper.toDiningTableDto(table, openOrdersByTable.get(table.getId())))
                .toList();
    }

    @Transactional
    public DiningTableDto createTable(TableUpsertRequest request) {
        Area area = findAreaOrThrow(request.areaId());
        String normalizedName = request.name().trim();
        if (diningTableRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new ConflictException("TABLE_NAME_DUPLICATE", "Tên bàn đã tồn tại.");
        }
        DiningTable table = new DiningTable();
        table.setArea(area);
        table.setName(normalizedName);
        table.setCapacity(request.capacity());
        table.setStatus(TableStatus.AVAILABLE);
        DiningTable saved = diningTableRepository.saveAndFlush(table);
        return DtoMapper.toDiningTableDto(saved, null);
    }

    @Transactional
    public DiningTableDto updateTable(Long id, TableUpsertRequest request) {
        DiningTable table = findTableWithAreaOrThrow(id);
        Area area = findAreaOrThrow(request.areaId());
        String normalizedName = request.name().trim();
        if (diningTableRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new ConflictException("TABLE_NAME_DUPLICATE", "Tên bàn đã tồn tại.");
        }
        table.setArea(area);
        table.setName(normalizedName);
        table.setCapacity(request.capacity());
        DiningTable saved = diningTableRepository.saveAndFlush(table);
        Order activeOrder = orderRepository.findActiveDetailByTableId(id).orElse(null);
        return DtoMapper.toDiningTableDto(saved, activeOrder);
    }

    @Transactional
    public void deleteTable(Long id) {
        DiningTable table = findTableWithAreaOrThrow(id);
        if (table.getStatus() == TableStatus.OCCUPIED || table.getStatus() == TableStatus.WAITING_PAYMENT) {
            throw new ConflictException(
                    "TABLE_IN_USE",
                    "Không thể xóa bàn đang có khách phục vụ hoặc đang chờ thanh toán."
            );
        }
        if (orderRepository.existsByTableId(id)) {
            throw new ConflictException(
                    "TABLE_HAS_ORDER_HISTORY",
                    "Không thể xóa bàn đã phát sinh hóa đơn lịch sử."
            );
        }
        diningTableRepository.delete(table);
    }

    @Transactional
    public OpenTableResponse openTable(Long id, OpenTableRequest request, RmsUserPrincipal principal) {
        DiningTable table = findTableWithAreaOrThrow(id);
        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new ConflictException("TABLE_NOT_AVAILABLE", "Bàn hiện không ở trạng thái trống.");
        }
        if (!Objects.equals(table.getVersion(), request.expectedVersion())) {
            throw new ConflictException(
                    "TABLE_VERSION_CONFLICT",
                    "Bàn vừa được nhân viên khác mở. Đã làm mới sơ đồ bàn."
            );
        }
        if (orderRepository.existsByTableIdAndStatus(id, OrderStatus.OPEN)) {
            throw new ConflictException("TABLE_ALREADY_OPEN", "Bàn đã có đơn phục vụ đang mở.");
        }

        tableStateMachine.validateTransition(table.getStatus(), TableStatus.OCCUPIED);
        table.setStatus(TableStatus.OCCUPIED);
        DiningTable updatedTable = diningTableRepository.saveAndFlush(table);

        User staff = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Không tìm thấy nhân viên."));

        Order order = new Order();
        order.setOrderCode(orderCodeGenerator.nextUniqueCode());
        order.setTable(updatedTable);
        order.setStaff(staff);
        order.setStatus(OrderStatus.OPEN);
        order.setTotalAmount(BigDecimal.ZERO);
        Order savedOrder = orderRepository.saveAndFlush(order);

        eventPublisher.publishEvent(TableChangedEvent.updated(updatedTable.getId(), updatedTable.getStatus()));
        return new OpenTableResponse(
                DtoMapper.toDiningTableDto(updatedTable, savedOrder),
                DtoMapper.toOrderDto(savedOrder)
        );
    }

    @Transactional
    public DiningTableDto cleanTable(Long id) {
        DiningTable table = findTableWithAreaOrThrow(id);
        tableStateMachine.validateCleanTransition(table.getStatus());
        table.setStatus(TableStatus.AVAILABLE);
        DiningTable saved = diningTableRepository.saveAndFlush(table);
        eventPublisher.publishEvent(TableChangedEvent.updated(saved.getId(), saved.getStatus()));
        return DtoMapper.toDiningTableDto(saved, null);
    }

    @Transactional
    public OrderDto transferTable(Long sourceTableId, TransferTableRequest req, RmsUserPrincipal actor) {
        Long targetTableId = req.targetTableId();
        if (Objects.equals(sourceTableId, targetTableId)) {
            throw new BadRequestException("SAME_TABLE_TRANSFER", "Bàn đích không được trùng với bàn nguồn.");
        }

        List<Long> orderedIds = Stream.of(sourceTableId, targetTableId).sorted().toList();
        Map<Long, DiningTable> tableMap = new LinkedHashMap<>();
        for (Long tid : orderedIds) {
            tableMap.put(tid, findTableWithAreaOrThrow(tid));
        }

        DiningTable srcTable = tableMap.get(sourceTableId);
        DiningTable dstTable = tableMap.get(targetTableId);

        Order openOrder = orderRepository.findActiveDetailByTableId(sourceTableId)
                .orElseThrow(() -> new BadRequestException(
                        "SOURCE_ORDER_NOT_OPEN",
                        "Bàn nguồn hiện không có đơn phục vụ đang mở."
                ));

        if (dstTable.getStatus() != TableStatus.AVAILABLE
                || orderRepository.existsByTableIdAndStatus(targetTableId, OrderStatus.OPEN)) {
            throw new ConflictException("TARGET_TABLE_NOT_AVAILABLE", "Bàn đích hiện không ở trạng thái trống.");
        }

        tableStateMachine.validateTransition(srcTable.getStatus(), TableStatus.AVAILABLE);
        tableStateMachine.validateTransition(dstTable.getStatus(), TableStatus.OCCUPIED);

        srcTable.setStatus(TableStatus.AVAILABLE);
        dstTable.setStatus(TableStatus.OCCUPIED);
        diningTableRepository.saveAndFlush(srcTable);
        DiningTable savedDst = diningTableRepository.saveAndFlush(dstTable);

        openOrder.setTable(savedDst);
        Order savedOrder = orderRepository.saveAndFlush(openOrder);

        User userActor = userRepository.findById(actor.getId()).orElse(null);
        auditLogSvc.log(
                userActor,
                "TABLE_TRANSFERRED",
                "ORDERS",
                savedOrder.getId(),
                String.format("Chuyển đơn %s từ bàn %s sang bàn %s",
                        savedOrder.getOrderCode(), srcTable.getName(), savedDst.getName())
        );

        eventPublisher.publishEvent(TableChangedEvent.updated(srcTable.getId(), TableStatus.AVAILABLE));
        eventPublisher.publishEvent(TableChangedEvent.updated(savedDst.getId(), TableStatus.OCCUPIED));
        return DtoMapper.toOrderDto(savedOrder);
    }

    @Transactional
    public OrderDto mergeTables(MergeTablesRequest req, RmsUserPrincipal actor) {
        if (req.sourceTableIds() == null || req.sourceTableIds().isEmpty()) {
            throw new BadRequestException("EMPTY_SOURCE_TABLES", "Danh sách bàn nguồn không được rỗng.");
        }
        List<Long> srcIds = req.sourceTableIds().stream()
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
        Long dstId = req.targetTableId();
        if (srcIds.isEmpty() || srcIds.contains(dstId)) {
            throw new BadRequestException(
                    "INVALID_MERGE_TABLES",
                    "Danh sách bàn nguồn không hợp lệ hoặc chứa bàn đích."
            );
        }

        List<Long> allSortedIds = Stream.concat(srcIds.stream(), Stream.of(dstId))
                .distinct()
                .sorted()
                .toList();
        Map<Long, DiningTable> lockedTables = new LinkedHashMap<>();
        for (Long tid : allSortedIds) {
            lockedTables.put(tid, findTableWithAreaOrThrow(tid));
        }

        DiningTable dstTable = lockedTables.get(dstId);
        if (dstTable.getStatus() == TableStatus.CLEANING) {
            throw new ConflictException("TARGET_TABLE_CLEANING", "Không thể gộp đơn vào bàn đang chờ dọn dẹp.");
        }

        List<Order> srcOrders = new ArrayList<>();
        List<String> srcTableNames = new ArrayList<>();
        for (Long sid : srcIds) {
            DiningTable sTable = lockedTables.get(sid);
            Order sOrder = orderRepository.findActiveDetailByTableId(sid)
                    .orElseThrow(() -> new ConflictException(
                            "SOURCE_ORDER_NOT_OPEN",
                            "Bàn nguồn " + sTable.getName() + " không có đơn đang mở để gộp."
                    ));
            srcOrders.add(sOrder);
            srcTableNames.add(sTable.getName());
        }

        User userActor = userRepository.findById(actor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Không tìm thấy nhân viên."));

        Order dstOrder;
        if (dstTable.getStatus() == TableStatus.AVAILABLE) {
            tableStateMachine.validateTransition(dstTable.getStatus(), TableStatus.OCCUPIED);
            dstTable.setStatus(TableStatus.OCCUPIED);
            dstTable = diningTableRepository.saveAndFlush(dstTable);

            Order created = new Order();
            created.setOrderCode(orderCodeGenerator.nextUniqueCode());
            created.setTable(dstTable);
            created.setStaff(userActor);
            created.setStatus(OrderStatus.OPEN);
            created.setTotalAmount(BigDecimal.ZERO);
            dstOrder = orderRepository.saveAndFlush(created);
        } else {
            dstOrder = orderRepository.findActiveDetailByTableId(dstId)
                    .orElseThrow(() -> new ConflictException(
                            "TARGET_ORDER_NOT_OPEN",
                            "Bàn đích hiện không có đơn phục vụ đang mở."
                    ));
        }

        Long dstOrderId = dstOrder.getId();
        TableStatus finalDstTableStatus = dstTable.getStatus();
        int nextBatchNo = dstOrder.getItems().stream()
                .mapToInt(OrderItem::getBatchNo)
                .max()
                .orElse(0) + 1;

        List<Long> movedItemIds = new ArrayList<>();
        for (Order sOrder : srcOrders) {
            for (OrderItem oi : sOrder.getItems()) {
                if (oi.getStatus() != OrderItemStatus.CANCELLED) {
                    movedItemIds.add(oi.getId());
                }
            }
        }

        Instant now = Instant.now();
        for (Order sOrder : srcOrders) {
            sOrder.setStatus(OrderStatus.CANCELLED);
            sOrder.setClosedAt(now);
            sOrder.setTotalAmount(BigDecimal.ZERO);
            orderRepository.saveAndFlush(sOrder);
        }
        for (Long sid : srcIds) {
            DiningTable sTable = lockedTables.get(sid);
            tableStateMachine.validateTransition(sTable.getStatus(), TableStatus.AVAILABLE);
            sTable.setStatus(TableStatus.AVAILABLE);
            diningTableRepository.saveAndFlush(sTable);
        }

        if (!movedItemIds.isEmpty()) {
            orderItemRepo.reassignItemsToOrder(dstOrder, nextBatchNo, now, movedItemIds);
        }

        Order reloadedDst = orderRepository.findDetailById(dstOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("ORDER_NOT_FOUND", "Không tìm thấy đơn đích sau khi gộp."));
        reloadedDst.setTotalAmount(OrderService.recalculateTotalAmount(reloadedDst));
        Order savedDstOrder = orderRepository.saveAndFlush(reloadedDst);

        User freshActor = userRepository.findById(actor.getId()).orElse(null);
        auditLogSvc.log(
                freshActor,
                "TABLES_MERGED",
                "ORDERS",
                savedDstOrder.getId(),
                String.format("Gộp các bàn [%s] vào bàn %s (Đơn %s)",
                        String.join(", ", srcTableNames),
                        savedDstOrder.getTable().getName(),
                        savedDstOrder.getOrderCode())
        );

        for (Long sid : srcIds) {
            eventPublisher.publishEvent(TableChangedEvent.updated(sid, TableStatus.AVAILABLE));
        }
        eventPublisher.publishEvent(TableChangedEvent.updated(dstId, finalDstTableStatus));

        Set<Long> movedIdSet = new HashSet<>(movedItemIds);
        List<OrderItemDto> movedDtos = savedDstOrder.getItems().stream()
                .filter(i -> movedIdSet.contains(i.getId()))
                .map(DtoMapper::toOrderItemDto)
                .toList();
        eventPublisher.publishEvent(new OrderItemsChangedEvent(
                "ORDER_ITEMS_ADDED",
                savedDstOrder.getId(),
                savedDstOrder.getOrderCode(),
                savedDstOrder.getTable().getId(),
                savedDstOrder.getTable().getName(),
                movedDtos,
                now
        ));

        return DtoMapper.toOrderDto(savedDstOrder);
    }

    private DiningTable findTableWithAreaOrThrow(Long id) {
        return diningTableRepository.findByIdWithArea(id)
                .orElseThrow(() -> new ResourceNotFoundException("TABLE_NOT_FOUND", "Không tìm thấy bàn ăn."));
    }

    private Area findAreaOrThrow(Long areaId) {
        return areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("AREA_NOT_FOUND", "Không tìm thấy khu vực."));
    }
}

