package com.hust.rms.controller;

import com.hust.rms.dto.report.AuditLogDto;
import com.hust.rms.dto.report.RevenueReportDto;
import com.hust.rms.service.ReportService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint báo cáo doanh thu, Top 10 món và nhật ký kiểm toán Admin (FR-22, US-20).
 */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportSvc;

    public ReportController(ReportService reportSvc) {
        this.reportSvc = reportSvc;
    }

    @GetMapping("/reports/revenue")
    public RevenueReportDto queryRevenueAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportSvc.buildRevenueReport(from, to);
    }

    @GetMapping("/audit-logs")
    public List<AuditLogDto> queryRecentAuditTrail(@RequestParam(defaultValue = "100") int limit) {
        return reportSvc.listAuditLogs(limit);
    }
}
