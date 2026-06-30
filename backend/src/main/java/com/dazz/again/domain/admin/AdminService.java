// ADMIN 전용 비즈니스 로직(대기목록 조회 / 승인 / 거부)을 처리하는 파일
package com.dazz.again.domain.admin;

import com.dazz.again.domain.user.User;                                    // 유저 엔티티 — role 변경 및 닉네임 조회에 사용
import com.dazz.again.domain.user.UserRepository;                         // 유저 DB 조회
import com.dazz.again.domain.verify.VerificationRequest;                  // 인증 신청 엔티티
import com.dazz.again.domain.verify.VerificationRequestRepository;        // 인증 신청 DB 조회/저장
import lombok.RequiredArgsConstructor;                                     // final 필드를 생성자 주입으로 자동 처리
import org.springframework.stereotype.Service;                             // 이 클래스가 비즈니스 로직 담당임을 Spring에 알림
import org.springframework.transaction.annotation.Transactional;          // DB 작업을 하나의 트랜잭션으로 묶음

import java.util.List; // 여러 건의 응답을 담는 컬렉션

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본은 읽기 전용, 쓰기 메서드에만 별도로 @Transactional 추가
public class AdminService {

    private final VerificationRequestRepository verificationRequestRepository;
    private final UserRepository userRepository;

    // PENDING 상태의 인증 신청 목록 조회 — 신청 일시 오름차순(선착순)으로 반환
    public List<AdminVerifyResponse> getPendingList() {
        List<VerificationRequest> pendingList =
                verificationRequestRepository.findAllByStatusOrderByRequestedAtAsc(VerificationRequest.Status.PENDING);

        // 각 신청 건마다 userId로 유저를 조회해 닉네임을 합쳐 DTO로 변환
        return pendingList.stream()
                .map(request -> {
                    User user = userRepository.findById(request.getUserId())
                            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다. id=" + request.getUserId()));
                    return AdminVerifyResponse.from(request, user.getNickname());
                })
                .toList();
    }

    // 인증 신청 승인 — VerificationRequest.status → APPROVED, User.role → MUSICIAN 으로 변경
    @Transactional // DB를 변경하므로 읽기 전용 해제
    public void approve(Long requestId) {
        VerificationRequest request = verificationRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신청입니다."));

        // 이미 처리된 신청인지 확인 (PENDING이 아니면 다시 처리 불가)
        if (request.getStatus() != VerificationRequest.Status.PENDING) {
            throw new IllegalStateException("이미 처리된 신청입니다.");
        }

        // 신청 상태를 APPROVED로 변경
        request.approve();

        // 신청자의 역할을 MUSICIAN으로 승격
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        user.updateRole(User.Role.MUSICIAN);
    }

    // 인증 신청 거부 — VerificationRequest.status → REJECTED 로 변경 (User.role은 그대로 GENERAL 유지)
    @Transactional // DB를 변경하므로 읽기 전용 해제
    public void reject(Long requestId) {
        VerificationRequest request = verificationRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신청입니다."));

        // 이미 처리된 신청인지 확인
        if (request.getStatus() != VerificationRequest.Status.PENDING) {
            throw new IllegalStateException("이미 처리된 신청입니다.");
        }

        // 신청 상태를 REJECTED로 변경
        request.reject();
    }
}