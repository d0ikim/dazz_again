// 유저 DB 테이블 구조를 정의하는 파일
package com.dazz.again.domain.user;

import jakarta.persistence.Column;                                          // DB 컬럼 속성 설정
import jakarta.persistence.Entity;                                         // 이 클래스가 DB 테이블임을 선언
import jakarta.persistence.EntityListeners;                                // 아래 Auditing 기능을 이 엔티티에 적용
import jakarta.persistence.EnumType;                                       // Enum을 DB에 저장할 방식 선택 (STRING or ORDINAL)
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
import org.springframework.data.annotation.CreatedDate;                    // 엔티티 최초 저장 시각을 자동 기록
import org.springframework.data.annotation.LastModifiedDate;               // 엔티티 수정 시각을 자동 갱신
import org.springframework.data.jpa.domain.support.AuditingEntityListener; // Auditing 기능의 실제 구현체

import java.time.LocalDateTime;

@EntityListeners(AuditingEntityListener.class) // createdAt, updatedAt 자동 기록 활성화 (JPA Auditing)
@Entity
@Table(name = "users")  // PostgreSQL에서 "user"는 예약어라 충돌 방지를 위해 "users"로 지정
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                        // 유저 고유 번호 (DB 자동 증가)

    @Column(nullable = false, unique = true)
    private Long kakaoId;                   // 카카오 계정 고유 번호 — 중복 가입 방지용 (카카오가 부여)

    @Column(nullable = false)
    private String nickname;                // 유저 닉네임 (최초 가입 시 카카오 프로필 이름으로 설정)

    @Column
    private String profileImageUrl;         // 프로필 이미지 URL (카카오 프로필 사진, 없을 수도 있음)

    @Enumerated(EnumType.STRING)            // DB에 숫자(0,1,2) 대신 문자열("GENERAL","MUSICIAN","ADMIN")로 저장
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.GENERAL;       // 최초 가입 시 기본값은 GENERAL (일반 유저)

    @CreatedDate
    @Column(nullable = false, updatable = false)  // updatable=false: 최초 기록 후 절대 변경 안 됨
    private LocalDateTime createdAt;        // 가입 일시 (자동 기록)

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;        // 마지막 수정 일시 (자동 갱신)

    // 유저 역할(권한) 종류 — User 클래스 안에서만 쓰이므로 내부 enum으로 정의
    public enum Role {
        GENERAL,    // 일반 유저: 공연장/뮤지션/공연 검색만 가능
        MUSICIAN,   // 인증 뮤지션: 본인 프로필 관리 가능
        ADMIN       // 관리자: 모든 데이터 입력/수정 + 뮤지션 인증 승인 가능
    }

    // ADMIN이 뮤지션 인증을 승인할 때 역할을 변경하기 위한 메서드
    public void updateRole(Role role) {
        this.role = role;
    }
}