// 유저 DB 조회/저장 인터페이스를 정의하는 파일
package com.dazz.again.domain.user;

import org.springframework.data.jpa.repository.JpaRepository; // JPA 기본 CRUD 메서드를 제공하는 인터페이스

import java.util.Optional; // 값이 있을 수도, 없을 수도 있는 경우를 표현하는 타입

// JpaRepository<User, Long> : User 엔티티를 다루고, PK 타입은 Long
public interface UserRepository extends JpaRepository<User, Long> {

    // 카카오ID로 유저를 조회 — 이미 가입한 유저인지 확인할 때 사용
    // Optional: 카카오ID가 DB에 없으면(첫 로그인) null 대신 Optional.empty()를 반환해 NullPointerException 방지 (있으면 꺼내고, 없으면 새로 만들어)
    Optional<User> findByKakaoId(Long kakaoId);
}