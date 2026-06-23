// API 요청마다 JWT 토큰을 확인하는 필터 파일
package com.dazz.again.global.auth;

import jakarta.servlet.FilterChain;       // 다음 필터로 요청을 넘겨주는 역할
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; // Spring Security용 인증 객체
import org.springframework.security.core.authority.SimpleGrantedAuthority;              // 권한(역할) 표현 객체
import org.springframework.security.core.context.SecurityContextHolder;                 // 현재 요청의 인증 정보를 보관하는 저장소
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter; // 요청당 딱 한 번만 실행되는 필터 기반 클래스

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    // 모든 API 요청이 컨트롤러에 도달하기 전에 이 메서드를 먼저 통과함
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractToken(request); // 요청 헤더에서 토큰 꺼내기

        if (token != null && jwtProvider.validate(token)) { // 토큰이 있고 유효하면
            Long userId = jwtProvider.getUserId(token);     // 토큰에서 유저 ID 추출
            String role = jwtProvider.getRole(token);       // 토큰에서 역할 추출

            // Spring Security에게 "이 요청은 userId=xxx, role=xxx인 유저의 요청이야"라고 알려줌
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    Collections.singleton(new SimpleGrantedAuthority(role))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);   // SecurityContextHolder(요청하나가 처리되는동안 Spring Security가 유저정보를 꺼내쓸 수 있는 `요청전용 임시저장소`
        }

        filterChain.doFilter(request, response); // 인증 처리 후 다음 단계(컨트롤러)로 요청 넘기기
    }

    // Authorization 헤더에서 "Bearer " 뒤의 토큰 문자열만 추출
    // 요청 헤더 형식: Authorization: Bearer eyJhbGci...
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7); // "Bearer " 7글자를 잘라내고 순수 토큰만 반환
        }
        return null; // 토큰이 없으면 null (로그인 안 한 요청)
    }
}