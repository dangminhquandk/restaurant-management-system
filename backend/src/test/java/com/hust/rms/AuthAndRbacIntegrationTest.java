package com.hust.rms;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
 * HUST IT3180 RMS — Kiểm thử tích hợp Xác thực BCrypt/JWT và Ma trận RBAC (FR-01..03, NFR-05).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthAndRbacIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    private String issueShiftToken(String loginId, String secretPhrase) throws Exception {
        String payload = json.writeValueAsString(Map.of("username", loginId, "password", secretPhrase));
        MvcResult resp = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();
        JsonNode root = json.readTree(resp.getResponse().getContentAsString());
        return root.get("accessToken").asText();
    }

    @Test
    @DisplayName("TC-01..04: Tài khoản seed đăng nhập thành công và phân quyền RBAC chặn đúng 401/403")
    void seededAccountsAndRbacMatrixBehavePerContract() throws Exception {
        String adminJwt = issueShiftToken("admin", "admin123");
        String staffJwt = issueShiftToken("staff1", "staff123");
        String kitchenJwt = issueShiftToken("kitchen1", "kitchen123");

        // Sai mật khẩu -> 401
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", "admin", "password", "wrongpass"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        // Không có token -> 401
        mvc.perform(get("/api/v1/tables"))
                .andExpect(status().isUnauthorized());

        // STAFF truy cập /admin/users -> 403
        mvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + staffJwt))
                .andExpect(status().isForbidden());

        // KITCHEN cố mở bàn của STAFF -> 403
        mvc.perform(post("/api/v1/tables/1/open")
                        .header("Authorization", "Bearer " + kitchenJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expectedVersion\":0}"))
                .andExpect(status().isForbidden());

        // STAFF đổi trạng thái hết món của KITCHEN -> 403
        mvc.perform(patch("/api/v1/menu-items/1/availability")
                        .header("Authorization", "Bearer " + staffJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isAvailable\":false}"))
                .andExpect(status().isForbidden());

        // ADMIN truy cập danh sách nhân sự -> 200 (5 thành viên Nhóm 1)
        mvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5));

        // Bảo vệ ADMIN cuối cùng không bị tự khóa -> 400
        mvc.perform(patch("/api/v1/admin/users/1/status")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isActive\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("LAST_ADMIN_PROTECTION"));
    }
}
