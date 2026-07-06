// PUT /api/musicians/me 요청 body를 담는 DTO(Data Transfer Object) 파일
// DTO: 클라이언트가 보낸 JSON 데이터를 Java 객체로 변환해서 받는 그릇
package com.dazz.again.domain.musician;

import jakarta.validation.constraints.Pattern; // Bean Validation — 필드값이 정규식과 일치하는지 검사
import lombok.Getter;   // 모든 필드의 getter 메서드를 자동 생성
import lombok.NoArgsConstructor; // 파라미터 없는 기본 생성자 자동 생성 (JSON 역직렬화에 필요)

@Getter
@NoArgsConstructor
public class MusicianUpdateRequest {

    private String stageName;       // 활동명 — null이면 기존 값 유지
    private String realName;        // 본명 — null이면 기존 값 유지
    private String position;        // 악기 — null이면 기존 값 유지
    private String bio;             // 소개 — null이면 기존 값 유지

    // URL 정규식/메시지는 같은 패키지의 MusicianRequest에 정의된 상수를 재사용
    @Pattern(regexp = MusicianRequest.URL_PATTERN, message = MusicianRequest.URL_MESSAGE)
    private String snsUrl;          // 인스타그램 URL — null이면 기존 값 유지

    @Pattern(regexp = MusicianRequest.URL_PATTERN, message = MusicianRequest.URL_MESSAGE)
    private String profileImageUrl; // 프로필 사진 URL — null이면 기존 값 유지
}