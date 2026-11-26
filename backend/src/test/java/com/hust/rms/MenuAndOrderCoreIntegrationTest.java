package com.hust.rms;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.rms.domain.entity.DiningTable;
import com.hust.rms.domain.entity.MenuItem;
import com.hust.rms.repository.DiningTableRepository;
import com.hust.rms.repository.MenuItemRepository;
import java.util.List;
import java.util.Map;
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
 * HUST IT3180 RMS — Kiểm thử tích hợp Tìm kiếm tiếng Việt không dấu, Xóa mềm, Chặn món hết & Chặn xóa bàn bận.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MenuAndOrderCoreIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private DiningTableRepository tableRepo;

    @Autowired
    private MenuItemRepository dishRepo;

    private String loginToken(String username, String password) throws Exception {
        MvcResult resp = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", username, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return json.readTree(resp.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    @DisplayName("TC-13..15, 32..34: Tìm tiếng Việt không dấu, gọi món, chặn món tạm hết (422), xóa mềm và chặn xóa bàn bận (409)")
    void vietnameseSearchOrderBatchSoftDeleteAndOccupiedTableGuardWorkEndToEnd() throws Exception {
        String adminJwt = loginToken("admin", "admin123");
        String staffJwt = loginToken("staff1", "staff123");
        String kitchenJwt = loginToken("kitchen1", "kitchen123");

        // 1. Tìm kiếm không dấu "pho bo" khớp "Phở Bò Tái Lăn" (FR-08)
        mvc.perform(get("/api/v1/menu-items")
                        .param("search", "pho bo")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Phở Bò Tái Lăn"));

        // 2. Mở bàn T1-03 và gửi lượt món đầu tiên (FR-05, FR-09)
        DiningTable tableT103 = tableRepo.findAll().stream()
                .filter(t -> "T1-03".equals(t.getName()))
                .findFirst()
                .orElseThrow();

        MvcResult openRes = mvc.perform(post("/api/v1/tables/" + tableT103.getId() + "/open")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("expectedVersion", tableT103.getVersion()))))
                .andExpect(status().isOk())
                .andReturn();
        long orderId = json.readTree(openRes.getResponse().getContentAsString()).path("order").path("id").asLong();

        MenuItem bunCha = dishRepo.findAll().stream()
                .filter(m -> "Bún Chả Hà Nội".equals(m.getName()))
                .findFirst()
                .orElseThrow();

        String batchPayload = json.writeValueAsString(Map.of(
                "items", List.of(Map.of("menuItemId", bunCha.getId(), "quantity", 2, "note", "Ít cay, không hành"))
        ));
        mvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(batchPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalAmount").value(140000))
                .andExpect(jsonPath("$.items[0].batchNo").value(1));

        // 3. Chặn xóa bàn T1-03 đang OCCUPIED -> 409 TABLE_IN_USE (FR-21)
        mvc.perform(delete("/api/v1/tables/" + tableT103.getId())
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TABLE_IN_USE"));

        // 4. Bếp đánh dấu món hết -> POS cố gọi thêm món đó bị từ chối 422 (FR-15)
        mvc.perform(patch("/api/v1/menu-items/" + bunCha.getId() + "/availability")
                        .header("Authorization", "Bearer " + kitchenJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isAvailable\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isAvailable").value(false));

        mvc.perform(post("/api/v1/orders/" + orderId + "/items")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(batchPayload))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("MENU_ITEM_UNAVAILABLE"));

        // 5. Xóa mềm món đã nằm trong hóa đơn lịch sử ORD-SEED-0001 không làm gãy truy vấn lịch sử (FR-20)
        MenuItem nemRan = dishRepo.findAll().stream()
                .filter(m -> "Nem Rán Hà Nội".equals(m.getName()))
                .findFirst()
                .orElseThrow();
        mvc.perform(delete("/api/v1/menu-items/" + nemRan.getId())
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isNoContent());

        JsonNode historyNode = json.readTree(mvc.perform(get("/api/v1/orders")
                        .param("status", "PAID")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        long seedOrderId = historyNode.get(0).get("id").asLong();
        mvc.perform(get("/api/v1/orders/" + seedOrderId)
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }
}
