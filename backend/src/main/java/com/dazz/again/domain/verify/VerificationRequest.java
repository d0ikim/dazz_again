// 뮤지션 인증 신청 DB 테이블 구조를 정의하는 파일
package com.dazz.again.domain.verify;

import jakarta.persistence.Column;                                          // DB 컬럼 속성 설정
import jakarta.persistence.Entity;                                         // 이 클래스가 DB 테이블임을 선언
import jakarta.persistence.EntityListeners;                                // Auditing 기능을 이 엔티티에 적용
import jakarta.persistence.EnumType;                                       // Enum을 DB에 저장할 방식 선택
import jakarta.persistence.Enumerated;                                     // Enum 필드에 저장 방식을 지정하는 어노테이션
import jakarta.persistence.GeneratedValue;                                 // PK 자동 생성
import jakarta.persistence.GenerationType;                                 // PK 자동 생성 전략
import jakarta.persistence.Id;                                             // PK 선언
import jakarta.persistence.Table;                                          // 연결할 테이블 이름 지정
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;                    // 최초 저장 시각 자동 기록
import org.springframework.data.jpa.domain.support.AuditingEntityListener; // Auditing 실제 구현체

import java.time.LocalDateTime;

@EntityListeners(AuditingEntityListener.class) // requestedAt 자동 기록 활성화
@Entity
@Table(name = "verification_request")          // DB 테이블 이름
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class VerificationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                           // 신청 고유 번호 (DB 자동 증가)

    @Column(nullable = false)
    private Long userId;                       // 신청한 유저 ID (users 테이블의 id 참조)

    @Enumerated(EnumType.STRING)               // DB에 문자열("PENDING","APPROVED","REJECTED")로 저장
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;    // 최초 신청 시 항상 PENDING

    @CreatedDate
    @Column(nullable = false, updatable = false) // 최초 기록 후 변경 불가
    private LocalDateTime requestedAt;         // 신청 일시 (자동 기록)

    // 인증 신청 처리 상태 — VerificationRequest 안에서만 쓰이므로 내부 enum으로 정의
    public enum Status {
        PENDING,    // 검토 중 (신청 직후 상태)
        APPROVED,   // 승인됨 (ADMIN이 승인)
        REJECTED    // 거절됨 (ADMIN이 거절)
    }

    // ADMIN이 승인할 때 호출 — status를 APPROVED로 변경
    public void approve() {
        this.status = Status.APPROVED;
    }

    // ADMIN이 거부할 때 호출 — status를 REJECTED로 변경
    public void reject() {
        this.status = Status.REJECTED;
    }
}