package com.hust.rms.event;

import com.hust.rms.domain.enums.OrderItemStatus;
import com.hust.rms.dto.order.OrderItemDto;
import java.time.Instant;
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class StompBroadcastListener {

    private final SimpMessagingTemplate messagingTemplate;

    public StompBroadcastListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTableChanged(TableChangedEvent event) {
        messagingTemplate.convertAndSend("/topic/tables", event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderItemsChanged(OrderItemsChangedEvent event) {
        messagingTemplate.convertAndSend("/topic/kds/orders", event);
        if ("ITEM_STATUS_CHANGED".equals(event.eventType()) && event.items() != null) {
            for (OrderItemDto item : event.items()) {
                if (item.status() == OrderItemStatus.READY) {
                    Map<String, Object> notification = Map.of(
                            "eventType", "ITEM_READY",
                            "orderId", event.orderId(),
                            "orderCode", event.orderCode(),
                            "tableId", event.tableId(),
                            "tableName", event.tableName(),
                            "itemId", item.id(),
                            "menuItemName", item.menuItemName(),
                            "quantity", item.quantity(),
                            "message", String.format(
                                    "Bàn %s: %dx %s đã nấu xong!",
                                    event.tableName(),
                                    item.quantity(),
                                    item.menuItemName()
                            ),
                            "timestamp", Instant.now()
                    );
                    messagingTemplate.convertAndSend("/topic/pos/notifications", notification);
                }
            }
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMenuAvailabilityChanged(MenuAvailabilityChangedEvent event) {
        messagingTemplate.convertAndSend("/topic/menu/availability", event);
    }
}
