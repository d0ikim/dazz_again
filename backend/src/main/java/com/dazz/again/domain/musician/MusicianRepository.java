// 뮤지션 DB 조회 쿼리를 정의하는 파일
package com.dazz.again.domain.musician;

import org.springframework.data.jpa.repository.JpaRepository; // Spring Data JPA가 제공하는 기본 DB 조작 인터페이스
import org.springframework.data.domain.Sort;                   // 정렬 조건을 담는 객체
import org.springframework.stereotype.Repository;              // 이 인터페이스가 DB 접근 역할임을 Spring에게 알리는 어노테이션

import java.util.List;
import java.util.Optional; // 값이 있을 수도, 없을 수도 있는 경우를 표현하는 타입

// JpaRepository<Musician, Long> : Musician 테이블을 다루고, PK 타입은 Long이라고 선언
// JpaRepository를 상속하면 save(), findById(), findAll(), delete() 등 기본 메서드를 자동으로 사용 가능
@Repository
public interface MusicianRepository extends JpaRepository<Musician, Long> {

    // 전체 뮤지션을 id 오름차순으로 조회
    // 실행되는 SQL: SELECT * FROM musician ORDER BY id ASC
    List<Musician> findAll(Sort sort);

    // 활동명에 키워드가 포함된 뮤지션 검색 (id 오름차순)
    // 실행되는 SQL: SELECT * FROM musician WHERE stage_name LIKE '%keyword%' ORDER BY id ASC
    List<Musician> findByStageNameContaining(String keyword, Sort sort);

    // 악기(포지션)에 키워드가 포함된 뮤지션 검색 (id 오름차순)
    // 실행되는 SQL: SELECT * FROM musician WHERE position LIKE '%keyword%' ORDER BY id ASC
    List<Musician> findByPositionContaining(String keyword, Sort sort);

    // userId로 뮤지션 프로필 조회 — PUT /api/musicians/me 에서 "내 프로필" 찾을 때 사용
    // 실행되는 SQL: SELECT * FROM musician WHERE user_id = ?
    // Optional: 아직 프로필이 없는 뮤지션도 있으므로 null 대신 Optional.empty() 반환
    Optional<Musician> findByUserId(Long userId);
}