// 지금까지 만든 모든 인증/인가 파일을 하나로 연결하는 Spring Security 설정 파일
package com.dazz.again.global.config;

import com.dazz.again.global.auth.CustomOAuth2UserService;
import com.dazz.again.global.auth.JwtFilter;
import com.dazz.again.global.auth.OAuth2LoginSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;                  // HTTP 메서드(GET, PUT 등)를 상수로 제공하는 클래스
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration      // "이 클래스가 Spring Security 설정파일이야"
@EnableWebSecurity  // Spring Security 활성화 "기본security설정 끄고, 대신 여기있는 걸 써"
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final JwtFilter jwtFilter;

    @Bean   // Spring은 객체를 직접 new로 안만들고, Spring Container가 대신 만들고 관리하는데, `Spring이 관리하는 객체`를 Bean이라고 부름."이 메서드가 반환하는 객체를 Spring이 빈으로 등록해서 관리해줘" 라는 뜻의 어노테이션
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))  // Security필터체인에 "CORS설정은 아래 메서드를 따라라"고 연결하는 한 줄
            .csrf(AbstractHttpConfigurer::disable)

            // 세션 미사용: JWT를 쓰면 서버가 로그인 상태를 세션으로 기억할 필요가 없음
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // URL별 접근 권한(인가) 설정
            // 주의: 규칙은 위에서부터 순서대로 평가되므로, 더 구체적인 규칙을 위에 배치해야 함
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.PUT, "/api/musicians/me").hasAuthority("MUSICIAN")  // 1. 뮤지션 프로필 수정은 MUSICIAN만
                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")                         // 2. 관리자 API는 ADMIN만
                .requestMatchers("/api/venues/**", "/api/musicians/**", "/api/performances/**").permitAll()  // 공연장/뮤지션/공연 조회는 누구나
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()   // Swagger 문서는 누구나
                .requestMatchers("/oauth2/**", "/login/**").permitAll()             // 카카오 로그인 URL은 누구나
                .anyRequest().authenticated()                                        // 나머지는 로그인 필요
            )

            // 카카오 소셜 로그인 설정
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(u -> u.userService(customOAuth2UserService))  // 로그인 후 유저 처리 서비스 등록
                .successHandler(oAuth2LoginSuccessHandler)                      // 로그인 성공 시 JWT 발급 핸들러 등록
            )

            // JwtFilter를 Spring Security 필터 체인에 등록
            // UsernamePasswordAuthenticationFilter 앞에 끼워넣어 모든 요청에서 먼저 실행되게 함
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // 어떤 출처를 허용할지
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        // 어떤 HTTP메서드를 허용할지
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // 어떤 요청헤더를 허용할지 (* = 전부)
        config.setAllowedHeaders(List.of("*"));
        // Authorization 헤더(JWT)를 포함한 요청 허용
        config.setAllowCredentials(true);   // JWT 쿠키 또는 Authorization 헤더 허용

        // "모든 URL경로(/**)에 위 설정 적용해라"
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}