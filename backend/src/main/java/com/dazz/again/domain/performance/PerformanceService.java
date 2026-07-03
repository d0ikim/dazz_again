// 공연 관련 비즈니스 로직을 처리하는 파일
package com.dazz.again.domain.performance;

import com.dazz.again.domain.musician.Musician;                // 뮤지션 엔티티 — 공연 추가 시 본인 뮤지션 프로필 조회에 사용
import com.dazz.again.domain.musician.MusicianRepository;      // 뮤지션 DB 조회
import com.dazz.again.domain.venue.Venue;                      // 공연장 엔티티 — 공연 등록/수정 시 공연장 조회에 사용
import com.dazz.again.domain.venue.VenueRepository;           // 공연장 DB 조회
import lombok.RequiredArgsConstructor;                         // Lombok: final 필드를 받는 생성자를 자동 생성 (의존성 주입에 사용)
import org.springframework.data.domain.Sort;                   // 정렬 조건을 담는 객체
import org.springframework.stereotype.Service;                 // 이 클래스가 비즈니스 로직을 담당하는 Service임을 Spring에게 알리는 어노테이션
import org.springframework.transaction.annotation.Transactional; // DB 작업을 하나의 트랜잭션으로 묶어주는 어노테이션

import java.util.List;
import java.util.NoSuchElementException; // 존재하지 않는 공연/공연장 조회 시 던질 예외

@Service
@RequiredArgsConstructor                                       // final로 선언된 performanceRepository를 받는 생성자를 Lombok이 자동 생성
@Transactional(readOnly = true)                                // 이 클래스의 모든 메서드는 기본적으로 읽기 전용 트랜잭션으로 실행 (성능 최적화)
public class PerformanceService {

    private final PerformanceRepository performanceRepository;         // DB 접근을 위한 Repository (생성자로 자동 주입됨)
    private final VenueRepository venueRepository;                    // 공연장 조회용 — venueId로 Venue 엔티티를 가져올 때 사용
    private final MusicianRepository musicianRepository;               // 뮤지션 조회용 — userId로 본인 Musician 엔티티를 가져올 때 사용
    private final PerformanceLineupRepository performanceLineupRepository; // 라인업 저장용 — 공연 추가 후 본인을 라인업에 등록할 때 사용

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

    // 공연 단건 조회 — id로 공연 1건을 DB에서 찾아 반환, 없으면 예외 발생
    public Performance findById(Long id) {
        return performanceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("존재하지 않는 공연입니다. id=" + id));
    }

    // 특정 뮤지션이 출연한 공연 목록 (공연시작시간 오름차순)
    public List<Performance> findByMusicianId(Long musicianId) {
        return performanceRepository.findByMusicianId(musicianId);
    }

    // MUSICIAN 전용 — 본인 공연 이력 추가
    // 1) userId로 내 뮤지션 프로필 조회 → 2) 공연 저장 → 3) 라인업에 본인 등록
    @Transactional // DB에 저장하므로 읽기 전용 해제
    public Performance addByMusician(Long userId, PerformanceRequest request) {
        // 1단계: JWT에서 꺼낸 userId로 내 뮤지션 프로필을 DB에서 조회
        //        뮤지션 프로필이 없는 유저(관리자가 승인 전 등)는 예외 발생
        Musician musician = musicianRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("뮤지션 프로필이 존재하지 않습니다."));

        // 2단계: 요청의 venueId로 공연장 조회
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new NoSuchElementException("존재하지 않는 공연장입니다. id=" + request.getVenueId()));

        // 3단계: Performance 엔티티 생성 후 저장 — save() 호출로 DB에 INSERT, id가 채워진 객체 반환
        Performance performance = Performance.builder()
                .venue(venue)
                .startTime(request.getStartTime())
                .title(request.getTitle())
                .genre(request.getGenre())
                .setInfo(request.getSetInfo())
                .setList(request.getSetList())
                .cancelled(request.isCancelled())
                .sourceUrl(request.getSourceUrl())
                .build();
        performanceRepository.save(performance); // 여기서 performance.id가 채워짐

        // 4단계: 방금 저장한 공연에 본인을 라인업으로 등록
        //        PerformanceLineupId(공연id, 뮤지션id)로 복합키 구성
        PerformanceLineup lineup = PerformanceLineup.builder()
                .id(new PerformanceLineupId(performance.getId(), musician.getId())) // 복합키 생성
                .performance(performance)  // 방금 저장한 공연 객체
                .musician(musician)        // 내 뮤지션 프로필 객체
                .build();
        performanceLineupRepository.save(lineup); // performance_lineup 테이블에 INSERT

        return performance; // 저장된 공연 정보 반환
    }

    // ADMIN 전용 — 공연 등록 — 요청 DTO의 venueId로 공연장을 조회한 뒤 Performance 엔티티로 변환 후 저장
    @Transactional // DB에 저장하므로 읽기 전용 해제
    public Performance create(PerformanceRequest request) {
        Venue venue = venueRepository.findById(request.getVenueId()) // 프론트에서 받은 venueId(숫자)로 DB에서 Venue 객체를 조회
                .orElseThrow(() -> new NoSuchElementException("존재하지 않는 공연장입니다. id=" + request.getVenueId())); // 없는 공연장이면 예외 발생

        Performance performance = Performance.builder() // 빌더 패턴으로 Performance 객체 생성 시작
                .venue(venue)                          // 위에서 조회한 Venue 객체 — JPA는 숫자(id)가 아닌 객체를 요구
                .startTime(request.getStartTime())     // 공연 일시
                .title(request.getTitle())             // 공연명
                .genre(request.getGenre())             // 장르 (null 가능)
                .setInfo(request.getSetInfo())         // 세트 정보 (null 가능)
                .setList(request.getSetList())         // 셋리스트 (null 가능)
                .cancelled(request.isCancelled())      // 취소 여부 — boolean이라 isCancelled()로 호출
                .sourceUrl(request.getSourceUrl())     // 출처 URL (null 가능)
                .build();                              // 객체 생성 완료

        return performanceRepository.save(performance); // INSERT INTO performance ... — 새 객체라 save() 필요
    }

    // ADMIN 전용 — 공연 수정 — id로 기존 공연을 찾아 update() 호출
    @Transactional // DB를 변경하므로 읽기 전용 해제
    public Performance update(Long id, PerformanceRequest request) {
        Performance performance = performanceRepository.findById(id) // URL의 {id}로 수정할 공연을 DB에서 조회
                .orElseThrow(() -> new NoSuchElementException("존재하지 않는 공연입니다. id=" + id)); // 없는 공연이면 예외 발생

        Venue venue = venueRepository.findById(request.getVenueId()) // 수정된 venueId로 새 공연장 조회 — 공연장도 바꿀 수 있음
                .orElseThrow(() -> new NoSuchElementException("존재하지 않는 공연장입니다. id=" + request.getVenueId())); // 없는 공연장이면 예외 발생

        performance.update(      // Performance 엔티티의 update() 메서드 호출 — 필드값 교체
                venue,           // 조회한 Venue 객체
                request.getStartTime(),  // 공연 일시
                request.getTitle(),      // 공연명
                request.getGenre(),      // 장르
                request.getSetInfo(),    // 세트 정보
                request.getSetList(),    // 셋리스트
                request.isCancelled(),   // 취소 여부
                request.getSourceUrl()   // 출처 URL
        );                       // save() 없음 — @Transactional + 더티 체킹으로 트랜잭션 종료 시 UPDATE 자동 실행
        return performance;      // 수정된 엔티티 반환
    }
}