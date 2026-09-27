package com.example.filter;

import java.io.IOException;

import org.springframework.util.StringUtils;

import com.alibaba.fastjson.JSONObject;
import com.example.common.Result;
import com.example.utils.JwtUtils;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
// import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
// @WebFilter(urlPatterns = "/*")
@RequiredArgsConstructor
public class TokenFilter implements Filter {

    private final JwtUtils jwtUtils;

    @Override // 拦截请求
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        // 获取 url 判定登录操作
        String url = req.getRequestURL().toString();
        log.info("请求的url: {}", url);

        if (url.contains("login")) {
            log.info("登录操作，放行");
            chain.doFilter(request, response);
            return;
        }

        // 获取 token 匹配令牌
        String jwt = req.getHeader("token");

        if (!StringUtils.hasLength(jwt)) {
            log.info("请求头为空，返回未登录信息");
            Result<Object> error = Result.error(401, "未登录");
            String notLogin = JSONObject.toJSONString(error);
            resp.getWriter().write(notLogin);
            return;
        }

        try {
            jwtUtils.parseJWT(jwt);
        } catch (Exception e) {
            e.printStackTrace();
            log.info("解析令牌错误，未登录");
            Result<Object> error = Result.error(401, "未登录");
            String notLogin = JSONObject.toJSONString(error);
            resp.getWriter().write(notLogin);
            return;
        }

        // 放行
        log.info("令牌合法，放行");
        chain.doFilter(request, response);
    }

}
