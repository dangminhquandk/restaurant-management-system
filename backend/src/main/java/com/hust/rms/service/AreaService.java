package com.hust.rms.service;

import com.hust.rms.common.exception.ConflictException;
import com.hust.rms.common.exception.ResourceNotFoundException;
import com.hust.rms.domain.entity.Area;
import com.hust.rms.dto.area.AreaDto;
import com.hust.rms.dto.area.AreaUpsertRequest;
import com.hust.rms.repository.AreaRepository;
import com.hust.rms.repository.DiningTableRepository;
import com.hust.rms.service.mapper.DtoMapper;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages dining areas/floors and enforces uniqueness and table-reference constraints.
 */
@Service
public class AreaService {

    private final AreaRepository areaRepository;
    private final DiningTableRepository diningTableRepository;

    public AreaService(AreaRepository areaRepository, DiningTableRepository diningTableRepository) {
        this.areaRepository = areaRepository;
        this.diningTableRepository = diningTableRepository;
    }

    @Transactional(readOnly = true)
    public List<AreaDto> listAreas() {
        return areaRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .map(DtoMapper::toAreaDto)
                .toList();
    }

    @Transactional
    public AreaDto createArea(AreaUpsertRequest request) {
        String normalizedName = request.name().trim();
        if (areaRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new ConflictException("AREA_NAME_DUPLICATE", "Tên khu vực đã tồn tại.");
        }
        Area area = new Area();
        area.setName(normalizedName);
        area.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        area.setDescription(request.description());
        return DtoMapper.toAreaDto(areaRepository.save(area));
    }

    @Transactional
    public AreaDto updateArea(Long id, AreaUpsertRequest request) {
        Area area = findAreaOrThrow(id);
        String normalizedName = request.name().trim();
        if (areaRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new ConflictException("AREA_NAME_DUPLICATE", "Tên khu vực đã tồn tại.");
        }
        area.setName(normalizedName);
        if (request.displayOrder() != null) {
            area.setDisplayOrder(request.displayOrder());
        }
        area.setDescription(request.description());
        return DtoMapper.toAreaDto(areaRepository.save(area));
    }

    @Transactional
    public void deleteArea(Long id) {
        Area area = findAreaOrThrow(id);
        if (diningTableRepository.existsByAreaId(id)) {
            throw new ConflictException("AREA_HAS_TABLES", "Không thể xóa khu vực vẫn còn bàn ăn.");
        }
        areaRepository.delete(area);
    }

    private Area findAreaOrThrow(Long id) {
        return areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AREA_NOT_FOUND", "Không tìm thấy khu vực."));
    }
}
