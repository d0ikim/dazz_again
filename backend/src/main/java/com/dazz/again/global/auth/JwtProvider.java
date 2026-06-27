// JWT 토큰을 생성하고 검증하는 파일
package com.dazz.again.global.auth;

import io.jsonwebtoken.Claims;           // JWT 안에 담긴 정보(클레임) 꺼낼 때 사용
import io.jsonwebtoken.JwtException;    // JWT가 위조되거나 만료됐을 때 발생하는 예외
import io.jsonwebtoken.Jwts;            // JWT 생성/파싱의 진입점
import io.jsonwebtoken.security.Keys;   // 비밀 키를 안전하게 만들어주는 유틸
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey; // JWT 서명에 쓸 암호화 키 타입
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")              // application.yaml의 jwt.secret 값을 주입
    private String secretString;

    @Value("${jwt.expiration-ms}")       // 토큰 유효시간 (밀리초 단위, 예: 3600000 = 1시간)
    private long expirationMs;

    private SecretKey secretKey;

    @PostConstruct  // 스프링이 이 빈을 생성한 직후 한 번 실행 — secretString을 실제 암호화 키로 변환
    public void init() {
        // 문자열 비밀키를 JWT 서명용 SecretKey 객체로 변환
        this.secretKey = Keys.hmacShaKeyFor(secretString.getBytes());
    }

    // JWT 토큰 생성 — 로그인 성공 시 호출
    public String generateToken(Long userId, String role) {
        return Jwts.builder()
                .subject(userId.toString())          // 토큰의 주인 (유저 ID)
                .claim("role", role)                 // 추가 정보: 유저 역할 (GENERAL, MUSICIAN, ADMIN)
                .issuedAt(new Date())                // 발급 시각
                .expiration(new Date(System.currentTimeMillis() + expirationMs)) // 만료 시각
                .signWith(secretKey)                 // 비밀 키로 서명 (위변조 방지)
                .compact();                          // 문자열 토큰으로 변환
    }

    // 토큰에서 유저 ID 추출
    public Long getUserId(String token) {
        return Long.parseLong(getClaims(token).getSubject());
    }

    // 토큰에서 역할 추출
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // 토큰 유효성 검증 — 위조되거나 만료된 토큰이면 false 반환
    public boolean validate(String token) {
        try {
            getClaims(token); // 파싱이 성공하면 유효한 토큰
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // 토큰을 파싱해서 안에 담긴 정보(Claims)를 꺼냄 — 내부에서만 사용
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey) // 서명 검증 (우리 서버가 발급한 토큰인지 확인)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}