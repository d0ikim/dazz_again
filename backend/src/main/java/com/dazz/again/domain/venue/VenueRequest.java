// ADMIN이 공연장을 등록하거나 수정할 때 클라이언트에서 받는 요청 데이터를 담는 파일
package com.dazz.again.domain.venue;

import lombok.Getter;   // 모든 필드에 getter 메서드를 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 기본 생성자 자동 생성 — Spring이 JSON을 이 객체로 변환할 때 필요

// @Entity 없음 — DB 테이블이 아니라 요청 데이터를 잠시 담는 그릇(DTO)
@Getter
@NoArgsConstructor
public class VenueRequest {

    private String name;          // 공연장 이름 (필수)
    private String location;      // 공연장 위치 (필수)
    private String instagramUrl;  // 인스타그램 URL (선택)
    private String homepageUrl;   // 홈페이지 URL (선택)
    private String description;   // 공연장 설명 (선택)
}