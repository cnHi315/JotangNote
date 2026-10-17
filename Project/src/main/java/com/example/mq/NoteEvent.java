package com.example.mq;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoteEvent {
    private String eventId;
    private String eventType;
    private Long noteId;
    private Long userId;
    private LocalDateTime occurredAt;
}
