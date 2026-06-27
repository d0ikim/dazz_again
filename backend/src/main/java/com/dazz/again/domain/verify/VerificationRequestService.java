// 뮤지션 인증 신청 관련 비즈니스 로직을 처리하는 파일
package com.dazz.again.domain.verify;

import com.dazz.again.domain.user.User;
import com.dazz.again.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본은 읽기 전용, 쓰기 메서드에는 별도로 @Transactional 추가
public class VerificationRequestService {

    private final VerificationRequestRepository verificationRequestRepository;
    private final UserRepository userRepository;

    // 뮤지션 인증 신청 — JWT에서 추출한 userId를 받아 처리
    @Transactional // 저장 작업이므로 읽기 전용 해제
    public VerificationRequest apply(Long userId) {

        // 신청자가 실제로 존재하는 유저인지 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        // 이미 MUSICIAN인 유저는 신청 불필요
        if (user.getRole() == User.Role.MUSICIAN) {
            throw new IllegalStateException("이미 인증된 뮤지션입니다.");
        }

        // PENDING 상태의 신청이 이미 존재하면 중복 신청 차단
        if (verificationRequestRepository.existsByUserIdAndStatus(userId, VerificationRequest.Status.PENDING)) {
            throw new IllegalStateException("이미 검토 중인 인증 신청이 있습니다.");
        }

        // 신청 저장 (status 기본값 PENDING, requestedAt은 @CreatedDate가 자동 기록)
        VerificationRequest request = VerificationRequest.builder()
                .userId(userId)
                .build();

        return verificationRequestRepository.save(request);
    }

    // 내 신청 상태 조회 — 가장 최근 신청 1건을 반환 (없으면 예외)
    public VerificationRequest findMyRequest(Long userId) {
        return verificationRequestRepository.findTopByUserIdOrderByRequestedAtDesc(userId)
                .orElseThrow(() -> new IllegalArgumentException("신청 내역이 없습니다."));
    }
}