package com.example.aidto;

import java.util.List;

import com.example.aidto.tools.AIToolDefinition;
import com.example.aidto.tools.ToolList;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AIRequest {
    private String model;
    private List<AIMessage> messages;
    private List<AIToolDefinition> tools;
    private Thinking thinking;

    public AIRequest(String model, List<AIMessage> messages) {
        this.model = model;
        this.messages = messages;
        this.tools = ToolList.ALL;
        this.thinking = new Thinking();
    }

    @Data
    @NoArgsConstructor
    public static class Thinking {
        private String type = "disabled";
    }
}
