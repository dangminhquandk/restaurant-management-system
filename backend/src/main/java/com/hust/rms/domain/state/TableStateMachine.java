package com.hust.rms.domain.state;

import com.hust.rms.common.exception.InvalidStateTransitionException;
import com.hust.rms.domain.enums.TableStatus;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * State Machine governing valid lifecycle transitions of {@link TableStatus}.
 */
@Component
public class TableStateMachine {

    private static final Map<TableStatus, Set<TableStatus>> ALLOWED_TRANSITIONS;

    static {
        Map<TableStatus, Set<TableStatus>> map = new EnumMap<>(TableStatus.class);
        map.put(TableStatus.AVAILABLE, EnumSet.of(TableStatus.OCCUPIED));
        map.put(
                TableStatus.OCCUPIED,
                EnumSet.of(TableStatus.WAITING_PAYMENT, TableStatus.CLEANING, TableStatus.AVAILABLE)
        );
        map.put(
                TableStatus.WAITING_PAYMENT,
                EnumSet.of(TableStatus.OCCUPIED, TableStatus.CLEANING, TableStatus.AVAILABLE)
        );
        map.put(TableStatus.CLEANING, EnumSet.of(TableStatus.AVAILABLE));
        ALLOWED_TRANSITIONS = Map.copyOf(map);
    }

    public void validateTransition(TableStatus current, TableStatus target) {
        Set<TableStatus> validTargets = ALLOWED_TRANSITIONS.getOrDefault(current, Set.of());
        if (!validTargets.contains(target)) {
            throw new InvalidStateTransitionException(
                    "INVALID_TABLE_TRANSITION",
                    String.format("Không thể chuyển trạng thái bàn từ %s sang %s.", current, target)
            );
        }
    }

    public void validateCleanTransition(TableStatus current) {
        if (current != TableStatus.CLEANING) {
            throw new InvalidStateTransitionException(
                    "TABLE_NOT_CLEANING",
                    "Chỉ có thể xác nhận dọn xong khi bàn đang ở trạng thái CLEANING."
            );
        }
    }
}
