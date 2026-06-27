// 공연 관련 비즈니스 로직을 처리하는 파일
package com.dazz.again.domain.performance;

import lombok.RequiredArgsConstructor;                         // Lombok: final 필드를 받는 생성자를 자동 생성 (의존성 주입에 사용)
import org.springframework.data.domain.Sort;                   // 정렬 조건을 담는 객체
import org.springframework.stereotype.Service;                 // 이 클래스가 비즈니스 로직을 담당하는 Service임을 Spring에게 알리는 어노테이션
import org.springframework.transaction.annotation.Transactional; // DB 작업을 하나의 트랜잭션으로 묶어주는 어노테이션

import java.util.List;

@Service
@RequiredArgsConstructor                                       // final로 선언된 performanceRepository를 받는 생성자를 Lombok이 자동 생성
@Transactional(readOnly = true)                                // 이 클래스의 모든 메서드는 기본적으로 읽기 전용 트랜잭션으로 실행 (성능 최적화)
public class PerformanceService {

    private final PerformanceRepository performanceRepository; // DB 접근을 위한 Repository (생성자로 자동 주입됨)

    private static final Sort START_TIME_ASC = Sort.by("startTime").ascending(); // 모든 조회에 공통으로 쓸 공연시작시간 오름차순 정렬 조건

    // 전체 공연 목록 반환 (공연시작시간 오름차순)
    public List<Performance> findAll() {
        return performanceRepository.findAll(START_TIME_ASC);
    }

    // 공연명으로 검색 (공연시작시간 오름차순)
    public List<Performance> searchByTitle(String keyword) {
        return performanceRepository.findByTitleContaining(keyword, START_TIME_ASC);
    }

    // 장르로 검색 (공연시작시간 오름차순)
    public List<Performance> searchByGenre(String keyword) {
        return performanceRepository.findByGenreContaining(keyword, START_TIME_ASC);
    }
}