// 공연 DB 조회 쿼리를 정의하는 파일
package com.dazz.again.domain.performance;

import org.springframework.data.domain.Sort;           // 정렬 조건을 담는 객체
import org.springframework.data.jpa.repository.JpaRepository; // Spring Data JPA가 제공하는 기본 DB 조작 인터페이스
import org.springframework.stereotype.Repository;      // 이 인터페이스가 DB 접근 역할임을 Spring에게 알리는 어노테이션

import java.util.List;

// JpaRepository<Performance, Long> : Performance 테이블을 다루고, PK 타입은 Long이라고 선언
@Repository
public interface PerformanceRepository extends JpaRepository<Performance, Long> {

    // 전체 공연 목록을 start_time 오름차순으로 조회
    // 실행되는 SQL: SELECT * FROM performance ORDER BY start_time ASC
    List<Performance> findAll(Sort sort);

    // 공연명에 키워드가 포함된 공연 검색 (start_time 오름차순)
    // 실행되는 SQL: SELECT * FROM performance WHERE title LIKE '%keyword%' ORDER BY start_time ASC
    List<Performance> findByTitleContaining(String keyword, Sort sort);

    // 장르로 공연 검색 (start_time 오름차순)
    // 실행되는 SQL: SELECT * FROM performance WHERE genre LIKE '%keyword%' ORDER BY start_time ASC
    List<Performance> findByGenreContaining(String keyword, Sort sort);
}