package com.example.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {
    private Integer code; // 响应码
    private String msg; // 响应信息
    private T data; // 返回的数据

    public static <T> Result<T> success() {
        return new Result<T>(200, "success", null);
    }

    public static <T> Result<T> success(T data) {
        return new Result<T>(200, "success", data);
    }

    public static <T> Result<T> error(Integer code, String msg) {
        return new Result<T>(code, msg, null);
    }
}

// 200 成功
// 400 参数不合法
// 401 未登录
// 403 无权操作
// 404 资源不存在
// 405 方法不支持
// 429 请求过于频繁
// 500 服务器错误
// 503 服务暂时不可用