package com.hust.rms;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.rms.common.util.Crc16Util;
import com.hust.rms.domain.entity.DiningTable;
import com.hust.rms.domain.entity.MenuItem;
import com.hust.rms.repository.DiningTableRepository;
import com.hust.rms.repository.MenuItemRepository;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * HUST IT3180 RMS — Kiểm thử tích hợp Chuyển/Gộp bàn ACID, Bảng quyết định Hủy món, Thanh toán VietQR/Cash,
 * Cấu hình hệ thống, Báo cáo doanh thu và Nhật ký kiểm toán (FR-06, FR-07, FR-11..18, FR-22, US-20).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RealtimeOperationsPaymentReportIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private DiningTableRepository tableRepo;

    @Autowired
    private MenuItemRepository dishRepo;

    private String loginAs(String username, String password) throws Exception {
        MvcResult res = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", username, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return json.readTree(res.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private DiningTable findTable(String name) {
        return tableRepo.findByName(name).orElseThrow();
    }

    private MenuItem findDish(String name) {
        return dishRepo.findAll().stream()
                .filter(d -> name.equals(d.getName()))
                .findFirst()
                .orElseThrow();
    }

    private long openTable(DiningTable table, String jwt) throws Exception {
        MvcResult res = mvc.perform(post("/api/v1/tables/" + table.getId() + "/open")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("expectedVersion", table.getVersion()))))
                .andExpect(status().isOk())
                .andReturn();
        return json.readTree(res.getResponse().getContentAsString()).path("order").path("id").asLong();
    }

    @Test
    @DisplayName("BL-04 End-to-End: Chuyển bàn, Gộp bàn ACID, Hủy món theo RBAC, KDS, VietQR/Cash, Doanh thu & AuditLog")
    void fullPhase3OperationsPaymentsAndAnalyticsBehavePerSddContract() throws Exception {
        String adminJwt = loginAs("admin", "admin123");
        String staffJwt = loginAs("staff1", "staff123");
        String kitchenJwt = loginAs("kitchen1", "kitchen123");

        DiningTable t204 = findTable("T2-04");
        DiningTable t205 = findTable("T2-05");
        DiningTable t206 = findTable("T2-06");
        DiningTable t207 = findTable("T2-07");
        DiningTable t208 = findTable("T2-08");

        MenuItem goiCuon = findDish("Gỏi Cuốn Tôm Thịt");     // 55.000đ
        MenuItem comRang = findDish("Cơm Rang Dưa Bò");       // 68.000đ
        MenuItem traDao = findDish("Trà Đào Cam Sả");         // 38.000đ
        MenuItem boLucLac = findDish("Bò Lúc Lắc Khoai Tây"); // 135.000đ

        // 1. Chuyển bàn (FR-06): Mở T2-04, thêm 2x Gỏi Cuốn (110.000đ)
        long orderT204 = openTable(t204, staffJwt);
        mvc.perform(post("/api/v1/orders/" + orderT204 + "/items")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "items", List.of(Map.of("menuItemId", goiCuon.getId(), "quantity", 2))
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalAmount").value(110000));

        // Chuyển sang chính bàn nguồn -> 400
        mvc.perform(post("/api/v1/tables/" + t204.getId() + "/transfer")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("targetTableId", t204.getId()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SAME_TABLE_TRANSFER"));

        // Mở T2-05 (1x Cơm Rang = 68.000đ) -> thử chuyển T2-04 sang bàn đang OCCUPIED T2-05 -> 409
        long orderT205 = openTable(t205, staffJwt);
        mvc.perform(post("/api/v1/orders/" + orderT205 + "/items")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "items", List.of(Map.of("menuItemId", comRang.getId(), "quantity", 1))
                        ))))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/v1/tables/" + t204.getId() + "/transfer")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("targetTableId", t205.getId()))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TARGET_TABLE_NOT_AVAILABLE"));

        // Chuyển hợp lệ T2-04 -> T2-06 (trống) -> T2-04 về AVAILABLE, T2-06 lên OCCUPIED
        mvc.perform(post("/api/v1/tables/" + t204.getId() + "/transfer")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("targetTableId", t206.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tableName").value("T2-06"))
                .andExpect(jsonPath("$.totalAmount").value(110000));
        assertEquals("AVAILABLE", findTable("T2-04").getStatus().name());
        assertEquals("OCCUPIED", findTable("T2-06").getStatus().name());

        // 2. Gộp bàn ACID (FR-07): Mở T2-07 (1x Trà Đào = 38.000đ), gộp [T2-05, T2-07] vào T2-06
        long orderT207 = openTable(t207, staffJwt);
        mvc.perform(post("/api/v1/orders/" + orderT207 + "/items")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "items", List.of(Map.of("menuItemId", traDao.getId(), "quantity", 1))
                        ))))
                .andExpect(status().isCreated());

        // Bàn nguồn chứa bàn đích -> 400
        mvc.perform(post("/api/v1/tables/merge")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "sourceTableIds", List.of(t205.getId(), t206.getId()),
                                "targetTableId", t206.getId()
                        ))))
                .andExpect(status().isBadRequest());

        // Gộp [T2-05, T2-07] vào T2-06 (đang OCCUPIED): tổng 110k + 68k + 38k = 216.000đ
        mvc.perform(post("/api/v1/tables/merge")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "sourceTableIds", List.of(t207.getId(), t205.getId()),
                                "targetTableId", t206.getId()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tableName").value("T2-06"))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.totalAmount").value(216000));
        assertEquals("AVAILABLE", findTable("T2-05").getStatus().name());
        assertEquals("AVAILABLE", findTable("T2-07").getStatus().name());

        // Gộp T2-06 sang bàn trống T2-08 (AVAILABLE) -> tự mở đơn mới trên T2-08 và giải phóng T2-06
        MvcResult mergeToEmptyRes = mvc.perform(post("/api/v1/tables/merge")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "sourceTableIds", List.of(t206.getId()),
                                "targetTableId", t208.getId()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tableName").value("T2-08"))
                .andExpect(jsonPath("$.totalAmount").value(216000))
                .andReturn();
        JsonNode mergedOrderNode = json.readTree(mergeToEmptyRes.getResponse().getContentAsString());
        long orderT208 = mergedOrderNode.get("id").asLong();
        assertEquals("AVAILABLE", findTable("T2-06").getStatus().name());
        assertEquals("OCCUPIED", findTable("T2-08").getStatus().name());

        long goiCuonItemId = -1L;
        long comRangItemId = -1L;
        long traDaoItemId = -1L;
        for (JsonNode itemNode : mergedOrderNode.get("items")) {
            long mId = itemNode.get("menuItemId").asLong();
            long iId = itemNode.get("id").asLong();
            if (mId == goiCuon.getId()) {
                goiCuonItemId = iId;
            } else if (mId == comRang.getId()) {
                comRangItemId = iId;
            } else if (mId == traDao.getId()) {
                traDaoItemId = iId;
            }
        }

        // 3. KDS Queue & Bảng quyết định Hủy món (FR-11, FR-13)
        mvc.perform(get("/api/v1/kds/items")
                        .header("Authorization", "Bearer " + kitchenJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)));

        // STAFF hủy món PENDING (Trà Đào 38k) không cần lý do -> 200 OK, còn 178.000đ
        mvc.perform(post("/api/v1/orders/" + orderT208 + "/items/" + traDaoItemId + "/cancel")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value(178000));

        // STAFF không được phép bấm COOKING trên KDS -> 403
        mvc.perform(patch("/api/v1/kds/items/" + comRangItemId + "/status")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COOKING\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("KDS_COOKING_ROLE_REQUIRED"));

        // KITCHEN chuyển Cơm Rang sang COOKING -> 200 OK
        mvc.perform(patch("/api/v1/kds/items/" + comRangItemId + "/status")
                        .header("Authorization", "Bearer " + kitchenJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COOKING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COOKING"));

        // STAFF cố hủy món đang COOKING -> 403
        mvc.perform(post("/api/v1/orders/" + orderT208 + "/items/" + comRangItemId + "/cancel")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("reason", "Khách giục"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("STAFF_CANNOT_CANCEL_COOKING_ITEM"));

        // ADMIN hủy món đang COOKING nhưng bỏ trống lý do -> 400
        mvc.perform(post("/api/v1/orders/" + orderT208 + "/items/" + comRangItemId + "/cancel")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CANCEL_REASON_REQUIRED"));

        // ADMIN hủy món đang COOKING kèm lý do hợp lệ -> 200 OK + ghi AuditLog, tổng còn 110.000đ
        mvc.perform(post("/api/v1/orders/" + orderT208 + "/items/" + comRangItemId + "/cancel")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("reason", "Khách báo dị ứng bò"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value(110000));

        // Bếp nấu xong Gỏi Cuốn -> STAFF bưng ra bàn (SERVED) -> cố hủy món SERVED -> 400
        mvc.perform(patch("/api/v1/kds/items/" + goiCuonItemId + "/status")
                        .header("Authorization", "Bearer " + kitchenJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COOKING\"}"))
                .andExpect(status().isOk());
        mvc.perform(patch("/api/v1/kds/items/" + goiCuonItemId + "/status")
                        .header("Authorization", "Bearer " + kitchenJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"READY\"}"))
                .andExpect(status().isOk());
        mvc.perform(patch("/api/v1/kds/items/" + goiCuonItemId + "/status")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SERVED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SERVED"));

        mvc.perform(post("/api/v1/orders/" + orderT208 + "/items/" + goiCuonItemId + "/cancel")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("reason", "Muộn"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CANNOT_CANCEL_ITEM"));

        // 4. Yêu cầu thanh toán, Cấu hình VietQR động & Xác nhận thanh toán (UC-05, UC-14, FR-16, FR-17)
        mvc.perform(post("/api/v1/orders/" + orderT208 + "/request-payment")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/orders/" + orderT208 + "/request-payment")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk());
        assertEquals("WAITING_PAYMENT", findTable("T2-08").getStatus().name());

        // STAFF đọc được GET /api/v1/admin/settings nhưng không được PUT
        mvc.perform(get("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vietqrBankBin").value("970415"));
        mvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "restaurantName", "Test",
                                "vietqrBankBin", "970436",
                                "vietqrAccountNumber", "0123456789",
                                "vietqrAccountName", "TEST"
                        ))))
                .andExpect(status().isForbidden());

        // ADMIN nhập BIN sai định dạng -> 400
        mvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "restaurantName", "Nhà Hàng Bách Khoa Bistro",
                                "vietqrBankBin", "97AB",
                                "vietqrAccountNumber", "0123456789",
                                "vietqrAccountName", "NHA HANG DEMO"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_BANK_BIN"));

        // ADMIN đổi tài khoản thụ hưởng -> VietQR preview sinh theo cấu hình mới
        mvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "restaurantName", "Nhà Hàng Bách Khoa Bistro",
                                "vietqrBankBin", "970436",
                                "vietqrAccountNumber", "001100888999",
                                "vietqrAccountName", "Bách Khoa Bistro"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vietqrBankBin").value("970436"));

        MvcResult qrPreviewRes = mvc.perform(post("/api/v1/orders/" + orderT208 + "/payments/vietqr-preview")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(110000))
                .andExpect(jsonPath("$.bankBin").value("970436"))
                .andExpect(jsonPath("$.accountName").value("BACH KHOA BISTRO"))
                .andReturn();
        String qrPayload = json.readTree(qrPreviewRes.getResponse().getContentAsString()).get("qrPayload").asText();
        assertEquals(
                Crc16Util.computeHex(qrPayload.substring(0, qrPayload.length() - 4)),
                qrPayload.substring(qrPayload.length() - 4)
        );

        // Khôi phục cấu hình VietQR mặc định
        mvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "restaurantName", "Nhà Hàng Bách Khoa Bistro",
                                "vietqrBankBin", "970415",
                                "vietqrAccountNumber", "113366668888",
                                "vietqrAccountName", "NHA HANG DEMO IT3180"
                        ))))
                .andExpect(status().isOk());

        // Chốt thanh toán VIETQR cho T2-08 -> đơn PAID, bàn CLEANING; chốt lại lần 2 -> 409
        mvc.perform(post("/api/v1/orders/" + orderT208 + "/payments/confirm")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"VIETQR\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(110000))
                .andExpect(jsonPath("$.changeAmount").value(0))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        assertEquals("CLEANING", findTable("T2-08").getStatus().name());

        mvc.perform(post("/api/v1/orders/" + orderT208 + "/payments/confirm")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"VIETQR\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ORDER_ALREADY_PAID"));

        mvc.perform(post("/api/v1/tables/" + t208.getId() + "/clean")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AVAILABLE"));

        // Mở lại T2-04: kiểm tra chặn thanh toán 0đ (400), thiếu tiền mặt (400), và chốt CASH trả tiền thừa
        long secondOrderT204 = openTable(findTable("T2-04"), staffJwt);
        mvc.perform(post("/api/v1/orders/" + secondOrderT204 + "/payments/vietqr-preview")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("EMPTY_ORDER_AMOUNT"));

        mvc.perform(post("/api/v1/orders/" + secondOrderT204 + "/items")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "items", List.of(Map.of("menuItemId", boLucLac.getId(), "quantity", 2))
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalAmount").value(270000));

        mvc.perform(post("/api/v1/orders/" + secondOrderT204 + "/payments/confirm")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("method", "CASH", "amountReceived", 250000))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_CASH_RECEIVED"));

        mvc.perform(post("/api/v1/orders/" + secondOrderT204 + "/payments/confirm")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("method", "CASH", "amountReceived", 300000))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(270000))
                .andExpect(jsonPath("$.changeAmount").value(30000));

        mvc.perform(post("/api/v1/tables/" + t204.getId() + "/clean")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk());

        // 5. Báo cáo Doanh thu & Nhật ký Kiểm toán (FR-22, US-20)
        mvc.perform(get("/api/v1/admin/reports/revenue")
                        .param("from", "2026-12-20")
                        .param("to", "2026-12-10")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_DATE_RANGE"));

        MvcResult reportRes = mvc.perform(get("/api/v1/admin/reports/revenue")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailySeries.length()").value(7))
                .andExpect(jsonPath("$.paidOrderCount").value(org.hamcrest.Matchers.greaterThanOrEqualTo(7)))
                .andReturn();
        JsonNode reportNode = json.readTree(reportRes.getResponse().getContentAsString());
        BigDecimal totalRev = reportNode.get("totalRevenue").decimalValue();
        BigDecimal cashRev = reportNode.get("cashRevenue").decimalValue();
        BigDecimal vietqrRev = reportNode.get("vietqrRevenue").decimalValue();
        assertEquals(0, totalRev.compareTo(cashRev.add(vietqrRev)), "Tổng doanh thu phải bằng CASH + VIETQR");
        assertTrue(reportNode.get("topItems").size() > 0 && reportNode.get("topItems").size() <= 10);

        MvcResult auditRes = mvc.perform(get("/api/v1/admin/audit-logs")
                        .param("limit", "50")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode auditArray = json.readTree(auditRes.getResponse().getContentAsString());
        Set<String> loggedActions = new HashSet<>();
        for (JsonNode logItem : auditArray) {
            loggedActions.add(logItem.get("action").asText());
        }
        assertTrue(loggedActions.contains("TABLE_TRANSFERRED"));
        assertTrue(loggedActions.contains("TABLES_MERGED"));
        assertTrue(loggedActions.contains("ORDER_ITEM_CANCELLED_COOKING"));
        assertTrue(loggedActions.contains("SETTINGS_UPDATED"));
        assertTrue(loggedActions.contains("PAYMENT_CONFIRMED"));
    }
}
