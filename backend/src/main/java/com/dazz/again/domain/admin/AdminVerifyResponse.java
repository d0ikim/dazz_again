// ADMIN이 PENDING 목록을 조회할 때 클라이언트에 반환하는 응답 형태를 정의하는 파일
package com.dazz.again.domain.admin;

import com.dazz.again.domain.verify.VerificationRequest; // 인증 신청 엔티티 — Status 열거형과 requestedAt 필드를 가져오기 위해 참조
import lombok.Builder;                                    // 빌더 패턴으로 객체를 생성할 수 있게 해주는 어노테이션
import lombok.Getter;                                     // 모든 필드에 getter 메서드를 자동 생성

import java.time.LocalDateTime; // 신청 일시를 담기 위한 날짜+시각 타입

// 이 클래스는 DB 테이블이 아닌 "응답 데이터 묶음(DTO)"이므로 @Entity 없이 순수 Java 클래스로 작성
@Getter
@Builder
public class AdminVerifyResponse {

    private Long id;                              // 인증 신청 고유 번호
    private Long userId;                          // 신청한 유저 ID
    private String userNickname;                  // 신청한 유저 닉네임 (users 테이블에서 별도로 조회해 합침)
    private VerificationRequest.Status status;    // 현재 신청 상태 (PENDING / APPROVED / REJECTED)
    private LocalDateTime requestedAt;            // 신청 일시

    // VerificationRequest 엔티티와 유저 닉네임을 받아 DTO 객체를 만드는 정적 팩토리 메서드
    // — AdminService에서 "엔티티 → 응답 DTO" 변환 시 사용
    public static AdminVerifyResponse from(VerificationRequest request, String userNickname) {
        return AdminVerifyResponse.builder()
                .id(request.getId())
                .userId(request.getUserId())
                .userNickname(userNickname)
                .status(request.getStatus())
                .requestedAt(request.getRequestedAt())
                .build();
    }
}