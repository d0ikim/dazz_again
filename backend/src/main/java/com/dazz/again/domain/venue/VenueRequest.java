// ADMIN이 공연장을 등록하거나 수정할 때 클라이언트에서 받는 요청 데이터를 담는 파일
package com.dazz.again.domain.venue;

import jakarta.validation.constraints.Pattern; // Bean Validation — 필드값이 정규식과 일치하는지 검사
import lombok.Getter;   // 모든 필드에 getter 메서드를 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 기본 생성자 자동 생성 — Spring이 JSON을 이 객체로 변환할 때 필요

// @Entity 없음 — DB 테이블이 아니라 요청 데이터를 잠시 담는 그릇(DTO)
@Getter
@NoArgsConstructor
public class VenueRequest {

    // URL 형식 검사용 정규식 — musician 패키지의 것과 같지만,
    // venue 도메인이 musician 도메인 클래스에 의존하지 않도록 따로 정의 (도메인 간 결합 방지)
    // ^$: 빈 문자열 허용 / (https?://)?: 스킴 생략 가능 / [^\s]+\.[^\s]+: 공백 없이 점 포함
    static final String URL_PATTERN = "^$|^(https?://)?[^\\s]+\\.[^\\s]+$";
    static final String URL_MESSAGE = "URL 형식이 아닙니다 (예: https://example.com)";

    private String name;          // 공연장 이름 (필수)
    private String location;      // 공연장 위치 (필수)

    @Pattern(regexp = URL_PATTERN, message = URL_MESSAGE) // 형식이 틀리면 컨트롤러 진입 전에 400 에러
    private String instagramUrl;  // 인스타그램 URL (선택)

    @Pattern(regexp = URL_PATTERN, message = URL_MESSAGE)
    private String homepageUrl;   // 홈페이지 URL (선택)

    private String description;   // 공연장 설명 (선택)
}