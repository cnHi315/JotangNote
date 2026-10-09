package com.example.aidto.tools;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AIToolDefinition {
    private String type = "function";
    private Function function;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Function {
        private String name;
        private String description;
        private Map<String, Object> parameters;
    }

    public AIToolDefinition(Function function) {
        this.function = function;
    }
}
