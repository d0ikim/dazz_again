// 뮤지션 인증 신청 DB 조회/저장 인터페이스를 정의하는 파일
package com.dazz.again.domain.verify;

import org.springframework.data.jpa.repository.JpaRepository; // JPA 기본 CRUD 메서드를 제공하는 인터페이스

import java.util.List;   // 여러 건의 신청을 리스트로 반환할 때 사용
import java.util.Optional; // 값이 있을 수도, 없을 수도 있는 경우를 표현하는 타입

// JpaRepository<VerificationRequest, Long> : VerificationRequest 엔티티를 다루고, PK 타입은 Long
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {

    // 특정 유저가 특정 상태의 신청을 이미 갖고 있는지 확인 — 중복 신청 방지용
    boolean existsByUserIdAndStatus(Long userId, VerificationRequest.Status status);

    // 특정 유저의 가장 최근 신청 조회 — "내 신청 상태 확인" API에서 사용
    Optional<VerificationRequest> findTopByUserIdOrderByRequestedAtDesc(Long userId);

    // 특정 상태의 신청 목록을 신청 시각 오름차순으로 조회 — ADMIN이 먼저 신청한 사람부터 처리하기 위해 ASC 정렬
    List<VerificationRequest> findAllByStatusOrderByRequestedAtAsc(VerificationRequest.Status status);
}