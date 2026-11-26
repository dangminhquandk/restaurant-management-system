package com.hust.rms.service;

import com.hust.rms.repository.OrderRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * HUST IT3180 RMS — Bộ sinh mã hóa đơn duy nhất theo múi giờ nhà hàng (ORD-yyyyMMdd-XXXX).
 * Tách từ TableService theo nguyên lý High Cohesion / Extract Class (Chương 8 — Tái cấu trúc mã nguồn).
 */
@Component
public class OrderCodeGenerator {

    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter ORDER_DATE_FMT = DateTimeFormatter.BASIC_ISO_DATE;

    private final OrderRepository orderRepo;
    private final Clock clock;
    private final AtomicInteger sequence = new AtomicInteger(0);

    @Autowired
    public OrderCodeGenerator(OrderRepository orderRepo) {
        this(orderRepo, Clock.system(RESTAURANT_ZONE));
    }

    OrderCodeGenerator(OrderRepository orderRepo, Clock clock) {
        this.orderRepo = orderRepo;
        this.clock = clock;
    }

    /**
     * Sinh mã hóa đơn kế tiếp chưa tồn tại trong CSDL mà không thay đổi hành vi nghiệp vụ bên ngoài.
     */
    public String nextUniqueCode() {
        String datePart = LocalDate.now(clock).format(ORDER_DATE_FMT);
        while (true) {
            int nextSeq = sequence.incrementAndGet();
            String candidate = String.format("ORD-%s-%04d", datePart, nextSeq);
            if (!orderRepo.existsByOrderCode(candidate)) {
                return candidate;
            }
        }
    }
}
