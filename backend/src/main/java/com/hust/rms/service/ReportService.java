package com.hust.rms.service;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.domain.entity.AuditLog;
import com.hust.rms.domain.entity.MenuItem;
import com.hust.rms.domain.entity.OrderItem;
import com.hust.rms.domain.entity.Payment;
import com.hust.rms.domain.entity.User;
import com.hust.rms.domain.enums.OrderItemStatus;
import com.hust.rms.domain.enums.OrderStatus;
import com.hust.rms.domain.enums.PaymentMethod;
import com.hust.rms.domain.enums.PaymentStatus;
import com.hust.rms.dto.report.*;
import com.hust.rms.repository.AuditLogRepository;
import com.hust.rms.repository.OrderItemRepository;
import com.hust.rms.repository.PaymentRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HUST IT3180 RMS — Tổng hợp thống kê doanh thu theo múi giờ Việt Nam và truy xuất nhật ký kiểm toán (FR-22, US-20).
 */
@Service
public class ReportService {

    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PaymentRepository paymentRepo;
    private final OrderItemRepository orderItemRepo;
    private final AuditLogRepository auditLogRepo;

    public ReportService(
            PaymentRepository paymentRepo,
            OrderItemRepository orderItemRepo,
            AuditLogRepository auditLogRepo
    ) {
        this.paymentRepo = paymentRepo;
        this.orderItemRepo = orderItemRepo;
        this.auditLogRepo = auditLogRepo;
    }

    @Transactional(readOnly = true)
    public RevenueReportDto buildRevenueReport(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(RESTAURANT_ZONE);
        LocalDate effectiveTo = to != null ? to : today;
        LocalDate effectiveFrom = from != null ? from : effectiveTo.minusDays(6);

        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new BadRequestException(
                    "INVALID_DATE_RANGE",
                    "Ngày bắt đầu không được lớn hơn ngày kết thúc."
            );
        }

        Instant fromInstant = effectiveFrom.atStartOfDay(RESTAURANT_ZONE).toInstant();
        Instant toExclusive = effectiveTo.plusDays(1).atStartOfDay(RESTAURANT_ZONE).toInstant();

        List<Payment> settledPayments = paymentRepo.findCompletedPaidOrdersInWindow(
                PaymentStatus.COMPLETED,
                OrderStatus.PAID,
                fromInstant,
                toExclusive
        );

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal cashRevenue = BigDecimal.ZERO;
        BigDecimal vietqrRevenue = BigDecimal.ZERO;

        Map<LocalDate, DailyBucket> dailyMap = new TreeMap<>();
        long spanDays = ChronoUnit.DAYS.between(effectiveFrom, effectiveTo);
        if (spanDays <= 366) {
            for (LocalDate d = effectiveFrom; !d.isAfter(effectiveTo); d = d.plusDays(1)) {
                dailyMap.put(d, new DailyBucket());
            }
        }

        List<Long> paidOrderIds = new ArrayList<>(settledPayments.size());
        for (Payment p : settledPayments) {
            BigDecimal amt = p.getAmount();
            totalRevenue = totalRevenue.add(amt);
            if (p.getMethod() == PaymentMethod.CASH) {
                cashRevenue = cashRevenue.add(amt);
            } else if (p.getMethod() == PaymentMethod.VIETQR) {
                vietqrRevenue = vietqrRevenue.add(amt);
            }
            LocalDate localDay = p.getPaidAt().atZone(RESTAURANT_ZONE).toLocalDate();
            dailyMap.computeIfAbsent(localDay, k -> new DailyBucket()).add(amt);
            paidOrderIds.add(p.getOrder().getId());
        }

        List<DailyRevenuePointDto> dailySeries = dailyMap.entrySet().stream()
                .map(e -> new DailyRevenuePointDto(e.getKey(), e.getValue().revenue, e.getValue().orderCount))
                .toList();

        List<TopSellingItemDto> topItems = aggregateTopItems(paidOrderIds);

        return new RevenueReportDto(
                effectiveFrom,
                effectiveTo,
                totalRevenue,
                settledPayments.size(),
                cashRevenue,
                vietqrRevenue,
                dailySeries,
                topItems
        );
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> listAuditLogs(int limit) {
        if (limit <= 0) {
            throw new BadRequestException("INVALID_LIMIT", "Tham số limit phải lớn hơn 0.");
        }
        int capped = Math.min(limit, 500);
        return auditLogRepo.findRecentWithActor(PageRequest.of(0, capped)).stream()
                .map(ReportService::toAuditLogDto)
                .toList();
    }

    private List<TopSellingItemDto> aggregateTopItems(List<Long> paidOrderIds) {
        if (paidOrderIds.isEmpty()) {
            return List.of();
        }
        List<OrderItem> soldItems = orderItemRepo.findActiveItemsWithCategoryByOrderIds(
                paidOrderIds,
                OrderItemStatus.CANCELLED
        );
        Map<Long, ItemAccumulator> byMenuId = new HashMap<>();
        for (OrderItem oi : soldItems) {
            MenuItem dish = oi.getMenuItem();
            BigDecimal lineTotal = oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity()));
            byMenuId.computeIfAbsent(
                    dish.getId(),
                    id -> new ItemAccumulator(id, dish.getName(), dish.getCategory().getName())
            ).accumulate(oi.getQuantity(), lineTotal);
        }

        return byMenuId.values().stream()
                .map(ItemAccumulator::toDto)
                .sorted(Comparator.comparingLong(TopSellingItemDto::totalQuantity).reversed()
                        .thenComparing(TopSellingItemDto::totalRevenue, Comparator.reverseOrder())
                        .thenComparing(TopSellingItemDto::menuItemId))
                .limit(10)
                .toList();
    }

    private static AuditLogDto toAuditLogDto(AuditLog entry) {
        User actor = entry.getActor();
        return new AuditLogDto(
                entry.getId(),
                actor != null ? actor.getUsername() : null,
                actor != null ? actor.getFullName() : null,
                entry.getAction(),
                entry.getTargetType(),
                entry.getTargetId(),
                entry.getDetail(),
                entry.getCreatedAt()
        );
    }

    private static final class DailyBucket {
        private BigDecimal revenue = BigDecimal.ZERO;
        private long orderCount = 0L;

        private void add(BigDecimal amount) {
            this.revenue = this.revenue.add(amount);
            this.orderCount++;
        }
    }

    private static final class ItemAccumulator {
        private final Long menuItemId;
        private final String menuItemName;
        private final String categoryName;
        private long totalQuantity;
        private BigDecimal totalRevenue = BigDecimal.ZERO;

        private ItemAccumulator(Long menuItemId, String menuItemName, String categoryName) {
            this.menuItemId = menuItemId;
            this.menuItemName = menuItemName;
            this.categoryName = categoryName;
        }

        private void accumulate(int qty, BigDecimal lineTotal) {
            this.totalQuantity += qty;
            this.totalRevenue = this.totalRevenue.add(lineTotal);
        }

        private TopSellingItemDto toDto() {
            return new TopSellingItemDto(menuItemId, menuItemName, categoryName, totalQuantity, totalRevenue);
        }
    }
}
