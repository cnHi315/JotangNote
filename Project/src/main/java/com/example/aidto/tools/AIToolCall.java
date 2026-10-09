package com.example.aidto.tools;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AIToolCall {
    private String id;
    private String type;
    private Function function;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Function {
        private String name;
        private String arguments;
    }
}
