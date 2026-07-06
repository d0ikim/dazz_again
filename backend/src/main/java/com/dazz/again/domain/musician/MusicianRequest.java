// ADMIN이 뮤지션을 등록하거나 수정할 때 클라이언트에서 받는 요청 데이터를 담는 파일
package com.dazz.again.domain.musician;

import jakarta.validation.constraints.Pattern; // Bean Validation — 필드값이 정규식과 일치하는지 검사
import lombok.Getter;   // 모든 필드에 getter 메서드를 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 기본 생성자 자동 생성 — Spring이 JSON을 이 객체로 변환할 때 필요

// @Entity 없음 — DB 테이블이 아니라 요청 데이터를 잠시 담는 그릇(DTO)
@Getter
@NoArgsConstructor
public class MusicianRequest {

    // URL 형식 검사용 정규식:
    //  ^$             → 빈 문자열 허용 (선택 입력 필드이므로)
    //  (https?://)?   → http:// 또는 https:// 는 있어도 되고 없어도 됨
    //  [^\s]+\.[^\s]+ → 공백 없이 점(.)이 포함된 주소 (예: instagram.com/dazz)
    // ※ @Pattern은 값이 null이면 검사를 건너뜀 → 빈 문자열("")까지 허용하려고 ^$ 를 추가
    static final String URL_PATTERN = "^$|^(https?://)?[^\\s]+\\.[^\\s]+$";
    static final String URL_MESSAGE = "URL 형식이 아닙니다 (예: https://instagram.com/dazz)";

    private String stageName;       // 활동명 (필수)
    private String realName;        // 본명 (선택)
    private String position;        // 악기 (필수)
    private String bio;             // 소개 (선택)

    @Pattern(regexp = URL_PATTERN, message = URL_MESSAGE) // 형식이 틀리면 컨트롤러 진입 전에 400 에러
    private String snsUrl;          // 인스타그램 URL (선택)

    @Pattern(regexp = URL_PATTERN, message = URL_MESSAGE)
    private String profileImageUrl; // 프로필 사진 URL (선택)

    @Pattern(regexp = URL_PATTERN, message = URL_MESSAGE)
    private String sourceUrl;       // 출처 URL (선택)

    // sourceType, userId는 요청에 포함하지 않음
    // — 관리자가 등록/수정하는 뮤지션은 항상 sourceType="ADMIN_CURATED", userId=null로 서비스에서 고정 처리
}