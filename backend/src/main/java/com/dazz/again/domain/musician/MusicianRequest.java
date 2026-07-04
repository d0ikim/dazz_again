// ADMIN이 뮤지션을 등록하거나 수정할 때 클라이언트에서 받는 요청 데이터를 담는 파일
package com.dazz.again.domain.musician;

import lombok.Getter;   // 모든 필드에 getter 메서드를 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 기본 생성자 자동 생성 — Spring이 JSON을 이 객체로 변환할 때 필요

// @Entity 없음 — DB 테이블이 아니라 요청 데이터를 잠시 담는 그릇(DTO)
@Getter
@NoArgsConstructor
public class MusicianRequest {

    private String stageName;       // 활동명 (필수)
    private String realName;        // 본명 (선택)
    private String position;        // 악기 (필수)
    private String bio;             // 소개 (선택)
    private String snsUrl;          // 인스타그램 URL (선택)
    private String profileImageUrl; // 프로필 사진 URL (선택)
    private String sourceUrl;       // 출처 URL (선택)

    // sourceType, userId는 요청에 포함하지 않음
    // — 관리자가 등록/수정하는 뮤지션은 항상 sourceType="ADMIN_CURATED", userId=null로 서비스에서 고정 처리
}