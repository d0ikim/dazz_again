// 지금까지 만든 모든 인증/인가 파일을 하나로 연결하는 Spring Security 설정 파일
package com.dazz.again.global.config;

import com.dazz.again.global.auth.CustomOAuth2UserService;
import com.dazz.again.global.auth.JwtFilter;
import com.dazz.again.global.auth.OAuth2LoginSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

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
            // CSRF 비활성화: JWT는 stateless 방식이라 세션/쿠키를 안 쓰므로 CSRF 공격 대상이 아님
            .csrf(AbstractHttpConfigurer::disable)

            // 세션 미사용: JWT를 쓰면 서버가 로그인 상태를 세션으로 기억할 필요가 없음
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // URL별 접근 권한(인가) 설정
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/venues/**", "/api/musicians/**").permitAll()    // 공연장/뮤지션 조회는 누구나
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

        return http.build();    // 위에서 .csrf(), .sessionManagement(), .authorizeHttpRequests() 등으로 쌓아온 설정들을 최종확정해서 하나의 객체로 만드는것. 레고조각 다끼운다음 "완성!" 버튼누르는것과 같음.
    }   // -> 여기까지 이 메서드를 실행해서 나온 SecurityFilterChain을, Spring이 알아서 서버에 적용함
}