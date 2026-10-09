package com.example.aidto;

import java.util.List;

import com.example.aidto.tools.AIToolCall;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AIMessage {
    private String role;
    private String content;
    private List<AIToolCall> tool_calls;
    private String tool_call_id;

    public AIMessage(String role, String content) {
        this.content = content;
        this.role = role;
    }
}
