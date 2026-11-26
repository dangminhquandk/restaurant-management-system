package com.hust.rms;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.hust.rms.common.exception.BadRequestException;
import com.hust.rms.common.util.Crc16Util;
import com.hust.rms.common.util.EmvCoVietQrBuilder;
import com.hust.rms.domain.entity.Order;
import com.hust.rms.domain.enums.PaymentMethod;
import com.hust.rms.domain.payment.CashPaymentStrategy;
import com.hust.rms.domain.payment.PaymentComputation;
import com.hust.rms.domain.payment.VietQRPaymentStrategy;
import com.hust.rms.dto.payment.ConfirmPaymentRequest;
import com.hust.rms.dto.payment.VietQrPreviewDto;
import com.hust.rms.dto.setting.SystemSettingsDto;
import com.hust.rms.service.SettingService;
import java.math.BigDecimal;
import org.junit.jupiter.api.*;

/**
 * HUST IT3180 RMS — Kiểm thử đơn vị CRC-16/CCITT-FALSE, cấu trúc TLV VietQR NAPAS 247 và phân tích giá trị biên Tiền mặt.
 */
class Crc16AndVietQrUnitTest {

    @Test
    @DisplayName("CRC-16/CCITT-FALSE: vector chuẩn '123456789' phải cho kết quả '29B1'")
    void crc16StandardCheckVectorMatches29B1() {
        assertEquals("29B1", Crc16Util.computeHex("123456789"));
        assertEquals("FFFF", Crc16Util.computeHex(""));
        assertThrows(IllegalArgumentException.class, () -> Crc16Util.computeHex(null));
    }

    @Test
    @DisplayName("VietQRPaymentStrategy: sinh đúng cấu trúc EMVCo TLV NAPAS 247, chuẩn hóa tên thụ hưởng <= 25 ký tự và khớp CRC16")
    void vietQrStrategyBuildsValidNapasEmvCoPayloadWithVerifiedCrc() {
        SettingService settingSvc = mock(SettingService.class);
        when(settingSvc.getSettings()).thenReturn(new SystemSettingsDto(
                "Nhà Hàng Bách Khoa Bistro",
                "970415",
                "113366668888",
                "Nhà Hàng Bách Khoa Hà Nội Siêu Dài Quá Hai Lăm Ký Tự"
        ));

        VietQRPaymentStrategy vietQrStrategy = new VietQRPaymentStrategy(settingSvc);
        assertEquals(PaymentMethod.VIETQR, vietQrStrategy.method());

        Order sampleOrder = new Order();
        sampleOrder.setId(99L);
        sampleOrder.setOrderCode("ORD-20261126-0099");
        sampleOrder.setTotalAmount(new BigDecimal("485000"));

        VietQrPreviewDto preview = vietQrStrategy.buildDynamicPayload(sampleOrder);
        String qr = preview.qrPayload();

        assertTrue(qr.startsWith("000201010212"), "Phải mở đầu bằng Payload Format 01 & Dynamic QR 12");
        assertTrue(qr.contains("0010A000000727"), "Phải chứa NAPAS AID A000000727");
        assertTrue(qr.contains("00069704150112113366668888"), "Phải nhúng BIN 970415 và STK 113366668888");
        assertTrue(qr.contains("0208QRIBFTTA"), "Phải chỉ định dịch vụ chuyển nhanh NAPAS 247 qua tài khoản");
        assertTrue(qr.contains("530370454064850005802VN"), "Phải chứa mã tiền tệ 704, số tiền 485000 và quốc gia VN");
        assertTrue(qr.contains("6006HA NOI"), "Phải chứa thành phố HA NOI");
        assertTrue(qr.contains("THANHTOAN ORD-20261126-0099"), "Phải chứa nội dung chuyển khoản gắn mã đơn");
        assertTrue(preview.accountName().length() <= 25, "Tên thụ hưởng EMVCo tối đa 25 ký tự ASCII");

        String withoutCrcValue = qr.substring(0, qr.length() - 4);
        String tailCrc = qr.substring(qr.length() - 4);
        assertTrue(withoutCrcValue.endsWith("6304"));
        assertEquals(Crc16Util.computeHex(withoutCrcValue), tailCrc, "CRC16 cuối chuỗi phải khớp tuyệt đối");

        PaymentComputation comp = vietQrStrategy.process(sampleOrder, new ConfirmPaymentRequest(PaymentMethod.VIETQR, null));
        assertEquals(new BigDecimal("485000"), comp.amount());
        assertEquals(new BigDecimal("485000"), comp.amountReceived());
        assertEquals(BigDecimal.ZERO, comp.changeAmount());
        assertEquals(qr, comp.qrPayload());

        assertThrows(IllegalArgumentException.class, () ->
                EmvCoVietQrBuilder.buildDynamicVietQr("970415", "123", "RMS", BigDecimal.ZERO, "TEST"));
    }

    @Test
    @DisplayName("CashPaymentStrategy: kiểm thử giá trị biên BVA (null, thiếu 1đ, vừa đủ, dư tiền thừa)")
    void cashStrategyEnforcesBoundaryConditions() {
        CashPaymentStrategy cashStrategy = new CashPaymentStrategy();
        assertEquals(PaymentMethod.CASH, cashStrategy.method());

        Order invoice = new Order();
        invoice.setTotalAmount(new BigDecimal("354000"));

        // Biên dưới không hợp lệ: null & 353.999đ
        BadRequestException nullEx = assertThrows(BadRequestException.class, () ->
                cashStrategy.process(invoice, new ConfirmPaymentRequest(PaymentMethod.CASH, null)));
        assertEquals("INSUFFICIENT_CASH_RECEIVED", nullEx.getCode());

        BadRequestException shortEx = assertThrows(BadRequestException.class, () ->
                cashStrategy.process(invoice, new ConfirmPaymentRequest(PaymentMethod.CASH, new BigDecimal("353999"))));
        assertEquals("INSUFFICIENT_CASH_RECEIVED", shortEx.getCode());

        // Đúng biên: 354.000đ -> tiền thừa = 0
        PaymentComputation exactComp = cashStrategy.process(
                invoice,
                new ConfirmPaymentRequest(PaymentMethod.CASH, new BigDecimal("354000"))
        );
        assertEquals(BigDecimal.ZERO, exactComp.changeAmount());
        assertNull(exactComp.qrPayload());

        // Trên biên: 500.000đ -> tiền thừa = 146.000đ
        PaymentComputation changeComp = cashStrategy.process(
                invoice,
                new ConfirmPaymentRequest(PaymentMethod.CASH, new BigDecimal("500000"))
        );
        assertEquals(new BigDecimal("146000"), changeComp.changeAmount());
    }
}
