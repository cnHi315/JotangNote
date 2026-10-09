package com.example.aidto.tools;

import java.util.List;
import java.util.Map;

import com.example.aidto.tools.AIToolDefinition.Function;

public class ToolList {
    private ToolList() {
    }

    public static final List<AIToolDefinition> ALL = List.of(
            getNoteById());

    private static AIToolDefinition getNoteById() {
        return new AIToolDefinition(new Function(
                "getNoteById",
                "根据笔记 ID 查询笔记全文",
                Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "id", Map.of("type", "integer", "description", "笔记ID")),
                        "required", List.of("id"))));
    }

}
