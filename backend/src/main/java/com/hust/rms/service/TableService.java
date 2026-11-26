package com.hust.rms.service;

import com.hust.rms.common.exception.ConflictException;
import com.hust.rms.common.exception.ResourceNotFoundException;
import com.hust.rms.domain.entity.Area;
import com.hust.rms.domain.entity.DiningTable;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.entity.User;
import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.TableStatus;
import com.hust.rms.domain.state.TableStateMachine;
import com.hust.rms.dto.table.DiningTableDto;
import com.hust.rms.dto.table.OpenTableRequest;
import com.hust.rms.dto.table.OpenTableResponse;
import com.hust.rms.dto.table.TableUpsertRequest;
import com.hust.rms.event.TableChangedEvent;
import com.hust.rms.repository.AreaRepository;
import com.hust.rms.repository.DiningTableRepository;
import com.hust.rms.repository.OrderRepository;
import com.hust.rms.repository.UserRepository;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.mapper.DtoMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages dining table floor-map state, optimistic-locked table opening, and CRUD operations.
 */
@Service
public class TableService {

    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter ORDER_DATE_FMT = DateTimeFormatter.BASIC_ISO_DATE;

    private final DiningTableRepository diningTableRepository;
    private final AreaRepository areaRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final TableStateMachine tableStateMachine;
    private final ApplicationEventPublisher eventPublisher;
    private final AtomicInteger orderSeq = new AtomicInteger(0);

    public TableService(
            DiningTableRepository diningTableRepository,
            AreaRepository areaRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            TableStateMachine tableStateMachine,
            ApplicationEventPublisher eventPublisher
    ) {
        this.diningTableRepository = diningTableRepository;
        this.areaRepository = areaRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.tableStateMachine = tableStateMachine;
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
        order.setOrderCode(generateUniqueOrderCode());
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

    private String generateUniqueOrderCode() {
        String datePart = LocalDate.now(RESTAURANT_ZONE).format(ORDER_DATE_FMT);
        while (true) {
            int seq = orderSeq.incrementAndGet();
            String candidate = String.format("ORD-%s-%04d", datePart, seq);
            if (!orderRepository.existsByOrderCode(candidate)) {
                return candidate;
            }
        }
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
