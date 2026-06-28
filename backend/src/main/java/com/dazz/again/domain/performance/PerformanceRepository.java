// 공연 DB 조회 쿼리를 정의하는 파일
package com.dazz.again.domain.performance;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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

    // 특정 뮤지션이 출연한 공연 목록 (start_time 오름차순)
    // performance_lineup 테이블을 조인해야 해서 메서드 이름 자동생성 방식으로는 불가능 → @Query로 직접 JPQL 작성
    // JPQL: 테이블명 대신 엔티티 클래스명(PerformanceLineup), 컬럼명 대신 필드명(musician.id)을 씀
    // 실행되는 SQL: SELECT p.* FROM performance p
    //              JOIN performance_lineup pl ON p.id = pl.performance_id
    //              WHERE pl.musician_id = :musicianId
    //              ORDER BY p.start_time ASC
    @Query("SELECT pl.performance FROM PerformanceLineup pl WHERE pl.musician.id = :musicianId ORDER BY pl.performance.startTime ASC")
    List<Performance> findByMusicianId(@Param("musicianId") Long musicianId);
}