package com.hust.rms.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.hust.rms.repository.OrderRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * HUST IT3180 RMS — Kiểm thử đơn vị cho OrderCodeGenerator sau tái cấu trúc Chương 8.
 */
class OrderCodeGeneratorTest {

    @Test
    @DisplayName("Sinh mã hóa đơn tuần tự và tự động bỏ qua mã bị trùng trong CSDL")
    void generatesSequentialCodeAndSkipsExistingCollision() {
        OrderRepository orderRepo = mock(OrderRepository.class);
        Clock fixedClock = Clock.fixed(
                Instant.parse("2026-05-15T04:30:00Z"),
                ZoneId.of("Asia/Ho_Chi_Minh")
        );
        when(orderRepo.existsByOrderCode("ORD-20260515-0001")).thenReturn(true);
        when(orderRepo.existsByOrderCode("ORD-20260515-0002")).thenReturn(false);

        OrderCodeGenerator generator = new OrderCodeGenerator(orderRepo, fixedClock);

        String code = generator.nextUniqueCode();
        assertThat(code).isEqualTo("ORD-20260515-0002");
        verify(orderRepo).existsByOrderCode("ORD-20260515-0001");
        verify(orderRepo).existsByOrderCode("ORD-20260515-0002");
    }
}
