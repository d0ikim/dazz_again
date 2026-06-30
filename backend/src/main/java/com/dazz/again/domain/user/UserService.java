// 유저 관련 비즈니스 로직을 처리하는 파일
package com.dazz.again.domain.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 읽기 전용 — 현재는 조회만 수행
public class UserService {

    private final UserRepository userRepository;

    // JWT에서 꺼낸 userId로 유저 단건 조회
    public User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("유저를 찾을 수 없습니다. id=" + userId));
    }
}