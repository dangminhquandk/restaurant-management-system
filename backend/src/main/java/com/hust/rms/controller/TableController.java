package com.hust.rms.controller;

import com.hust.rms.dto.order.OrderDto;
import com.hust.rms.dto.table.*;
import com.hust.rms.security.RmsUserPrincipal;
import com.hust.rms.service.TableService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * HUST IT3180 RMS — Boundary endpoint cho Sơ đồ bàn, Khóa lạc quan @Version, Chuyển & Gộp bàn (FR-04..07).
 */
@RestController
@RequestMapping("/api/v1/tables")
public class TableController {

    private final TableService tableSvc;

    public TableController(TableService tableSvc) {
        this.tableSvc = tableSvc;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF','KITCHEN','ADMIN')")
    public List<DiningTableDto> queryFloorTables(@RequestParam(required = false) Long areaId) {
        return tableSvc.listTables(areaId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public DiningTableDto registerDiningTable(@Valid @RequestBody TableUpsertRequest payload) {
        return tableSvc.createTable(payload);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DiningTableDto modifyDiningTable(@PathVariable Long id, @Valid @RequestBody TableUpsertRequest payload) {
        return tableSvc.updateTable(id, payload);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void removeDiningTable(@PathVariable Long id) {
        tableSvc.deleteTable(id);
    }

    @PostMapping("/{id}/open")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public OpenTableResponse openGuestTable(
            @PathVariable Long id,
            @Valid @RequestBody OpenTableRequest payload,
            @AuthenticationPrincipal RmsUserPrincipal actor
    ) {
        return tableSvc.openTable(id, payload, actor);
    }

    @PostMapping("/{id}/clean")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public DiningTableDto markTableCleaned(@PathVariable Long id) {
        return tableSvc.cleanTable(id);
    }

    @PostMapping("/{id}/transfer")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public OrderDto relocateActiveOrder(
            @PathVariable Long id,
            @Valid @RequestBody TransferTableRequest payload,
            @AuthenticationPrincipal RmsUserPrincipal actor
    ) {
        return tableSvc.transferTable(id, payload, actor);
    }

    @PostMapping("/merge")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public OrderDto consolidateGuestTables(
            @Valid @RequestBody MergeTablesRequest payload,
            @AuthenticationPrincipal RmsUserPrincipal actor
    ) {
        return tableSvc.mergeTables(payload, actor);
    }
}

