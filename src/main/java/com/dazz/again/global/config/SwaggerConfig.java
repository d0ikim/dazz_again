package com.dazz.again.global.config; // 전역 설정 패키지

import io.swagger.v3.oas.models.OpenAPI;        // Swagger 전체 문서 설정 객체
import io.swagger.v3.oas.models.info.Info;       // API 제목/설명/버전 정보 객체
import org.springframework.context.annotation.Bean;          // Spring 빈으로 등록하는 어노테이션
import org.springframework.context.annotation.Configuration; // 이 클래스가 설정 파일임을 Spring에게 알림

@Configuration // Spring이 시작될 때 이 클래스를 설정으로 읽음
public class SwaggerConfig {

    @Bean // openAPI() 메서드의 반환값을 Spring 빈으로 등록 → Swagger가 자동으로 사용
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("DAZZ API") // Swagger UI 상단에 표시될 제목
                        .description("""
                                ## DAZZ - 서울 재즈 씬 플랫폼 API

                                서울의 재즈 공연장, 뮤지션, 공연 정보를 검색할 수 있는 API 문서입니다.

                                ### 현재 제공 기능
                                - **공연장(Venue)**: 전체 목록 조회 및 이름/주소 검색

                                ### 사용 방법
                                각 API 항목을 클릭 → 'Try it out' 버튼 → 파라미터 입력 → 'Execute' 버튼
                                """)
                        .version("v0.1.0")); // API 버전
    }
}