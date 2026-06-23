package com.dazz.again.global.config; // 전역 설정 패키지

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement; // "이 API는 인증이 필요해"를 표시하는 객체
import io.swagger.v3.oas.models.security.SecurityScheme;     // 인증 방식(Bearer JWT)을 정의하는 객체
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        // Bearer JWT 인증 방식 정의
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)  // HTTP 인증 방식 사용
                .scheme("bearer")                // "Bearer {토큰}" 형식
                .bearerFormat("JWT")             // Swagger UI에 "JWT" 라고 표시
                .in(SecurityScheme.In.HEADER)    // Authorization 헤더에 담아서 전송
                .name("Authorization");          // 헤더 이름

        // 모든 API에 자물쇠 아이콘 표시 (인증 필요 표시)
        SecurityRequirement securityRequirement = new SecurityRequirement().addList("bearerAuth");

        return new OpenAPI()
                .info(new Info()
                        .title("DAZZ API")
                        .description("""
                                ## DAZZ - 서울 재즈 씬 플랫폼 API

                                서울의 재즈 공연장, 뮤지션, 공연 정보를 검색할 수 있는 API 문서입니다.

                                ### 인증이 필요한 API 사용 방법
                                1. `/oauth2/authorization/kakao` 로 카카오 로그인
                                2. 서버 로그에서 JWT 토큰 복사
                                3. 우측 상단 **Authorize** 버튼 클릭 → 토큰 입력
                                4. 이후 자물쇠 아이콘이 있는 API 자동으로 인증 헤더 포함
                                """)
                        .version("v0.2.0"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", securityScheme)) // 인증 방식 등록
                .addSecurityItem(securityRequirement);                     // 전체 API에 적용
    }
}