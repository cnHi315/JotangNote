package com.example.interceptor;

import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import com.example.common.Result;
import com.example.utils.JwtUtils;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoginCheckInterceptor implements HandlerInterceptor {

    private final JwtUtils jwtUtils;

    private final JsonMapper jsonMapper;

    @Override // 目标资源方法运行前运行，判断是否放行
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

        // 避免中文编码问题
        response.setContentType("application/json;charset=utf-8");

        // 获取 token 匹配令牌
        String jwt = request.getHeader("token");

        if (!StringUtils.hasLength(jwt)) {
            log.warn("请求头无 token, 拒绝登录");
            return writeError(response, 401, "未登录");
        }

        try {
            Claims claims = jwtUtils.parseJWT(jwt);
            Long userId = claims.get("userId", Long.class);
            String username = claims.get("username", String.class);
            request.setAttribute("userId", userId);
            request.setAttribute("username", username);
        } catch (Exception e) {
            log.warn("解析令牌错误", e);
            return writeError(response, 401, "未登录");
        }

        // 放行
        log.debug("令牌合法，放行");
        return true;
    }

    @Override // 目标资源方法运行后运行
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
            @Nullable ModelAndView modelAndView) throws Exception {
    }

    @Override // 视图渲染完成后运行
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
            @Nullable Exception ex) throws Exception {
    }

    private boolean writeError(HttpServletResponse response, Integer code, String msg) throws Exception {
        Result<Object> error = Result.error(code, msg);
        String notLogin = jsonMapper.writeValueAsString(error);
        response.getWriter().write(notLogin);
        return false;
    }

}