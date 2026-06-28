// 공연-뮤지션 연결 테이블(performance_lineup)을 조회하는 Repository 파일
package com.dazz.again.domain.performance;

import com.dazz.again.domain.musician.GraphEdgeResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceLineupRepository extends JpaRepository<PerformanceLineup, PerformanceLineupId> {

    // 특정 뮤지션과 함께 공연한 뮤지션 목록 + 협연 횟수를 계산하는 쿼리
    //
    // 동작 방식을 단계별로 풀면:
    //
    // 1단계 — 서브쿼리: 중심 뮤지션이 출연한 공연 ID 목록을 먼저 구함
    //   SELECT pl2.performance
    //   FROM PerformanceLineup pl2
    //   WHERE pl2.musician.id = :musicianId
    //   → 예) 뮤지션 1번이 출연한 공연: [공연A, 공연B, 공연C]
    //
    // 2단계 — 메인쿼리: 그 공연들에 출연한 다른 뮤지션을 모두 가져옴 (본인 제외)
    //   SELECT pl.musician, COUNT(pl.performance)
    //   FROM PerformanceLineup pl
    //   WHERE pl.performance IN (1단계 결과)
    //     AND pl.musician.id <> :musicianId   ← 본인은 제외
    //   GROUP BY pl.musician                  ← 뮤지션별로 묶어서
    //   ORDER BY COUNT(...) DESC              ← 협연 횟수 많은 순으로 정렬
    //
    // new GraphEdgeResponse(...) = JPQL 생성자 표현식
    // 쿼리 결과 한 행을 바로 GraphEdgeResponse 객체로 만들어줌 (Object[] 변환 불필요)
    @Query("""
            SELECT new com.dazz.again.domain.musician.GraphEdgeResponse(pl.musician, COUNT(pl.performance))
            FROM PerformanceLineup pl
            WHERE pl.performance IN (
                SELECT pl2.performance FROM PerformanceLineup pl2 WHERE pl2.musician.id = :musicianId
            )
            AND pl.musician.id <> :musicianId
            GROUP BY pl.musician
            ORDER BY COUNT(pl.performance) DESC
            """)
    List<GraphEdgeResponse> findCoPerformers(@Param("musicianId") Long musicianId);
}
