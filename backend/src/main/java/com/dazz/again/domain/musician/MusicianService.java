// 뮤지션 관련 비즈니스 로직을 처리하는 파일
package com.dazz.again.domain.musician;

import com.dazz.again.domain.performance.PerformanceLineupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor                                       // final로 선언된 musicianRepository를 받는 생성자를 Lombok이 자동 생성
@Transactional(readOnly = true)                                // 이 클래스의 모든 메서드는 기본적으로 읽기 전용 트랜잭션으로 실행 (성능 최적화)
public class MusicianService {

    private final MusicianRepository musicianRepository;               // 뮤지션 DB 접근
    private final PerformanceLineupRepository performanceLineupRepository; // 공연-뮤지션 연결 테이블 접근 (graph 쿼리용)

    private static final Sort ID_ASC = Sort.by("id").ascending(); // 모든 조회에 공통으로 쓸 id 오름차순 정렬 조건

    // 전체 뮤지션 목록 반환 (id 오름차순)
    public List<Musician> findAll() {
        return musicianRepository.findAll(ID_ASC);
    }

    // id로 뮤지션 단건 조회 — 없으면 404로 이어지도록 예외를 던짐
    public Musician findById(Long id) {
        // JpaRepository 기본 제공 메서드. Optional<Musician>을 반환하므로
        // orElseThrow로 없을 때 예외를 터뜨려 호출부(Controller)가 404로 처리할 수 있게 함
        return musicianRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("뮤지션을 찾을 수 없습니다. id=" + id));
    }

    // 활동명으로 검색 (id 오름차순)
    public List<Musician> searchByStageName(String keyword) {
        return musicianRepository.findByStageNameContaining(keyword, ID_ASC);
    }

    // 악기로 검색 (id 오름차순)
    public List<Musician> searchByPosition(String keyword) {
        return musicianRepository.findByPositionContaining(keyword, ID_ASC);
    }

    // 로그인한 MUSICIAN 유저가 자신의 프로필을 수정하는 메서드
    // 프로필이 없으면 새로 만들고, 있으면 수정함 (upsert: update + insert)
    @Transactional // 데이터를 저장/수정하므로 읽기 전용 해제
    public Musician updateMyProfile(Long userId, MusicianUpdateRequest request) {

        // userId로 기존 뮤지션 프로필 조회
        // Optional이 비어 있으면(프로필 없음) 빈 프로필 새로 생성, 있으면 기존 객체 사용
        Musician musician = musicianRepository.findByUserId(userId)
                .orElse(Musician.builder()          // 프로필이 없으면 새 뮤지션 객체 생성
                        .stageName("")              // 필수 필드(NOT NULL)이므로 빈 값으로 초기화
                        .position("")               // 필수 필드(NOT NULL)이므로 빈 값으로 초기화
                        .sourceType("SELF")         // 뮤지션 본인이 직접 입력했음을 표시
                        .userId(userId)             // 이 프로필의 주인 유저 ID 연결
                        .build());

        // 요청에서 받은 값으로 프로필 수정 (null인 필드는 기존 값 유지)
        musician.updateProfile(
                request.getStageName(),
                request.getRealName(),
                request.getPosition(),
                request.getBio(),
                request.getSnsUrl(),
                request.getProfileImageUrl()
        );

        // DB에 저장 (새 객체면 INSERT, 기존 객체면 UPDATE)
        return musicianRepository.save(musician);
    }

    // 인맥지도 데이터 조회 — 중심 뮤지션 + 협연자 목록 + 협연 횟수를 하나의 GraphResponse로 반환
    public GraphResponse getGraph(Long musicianId) {
        // 1. 중심 뮤지션 조회 (없으면 NoSuchElementException → Controller에서 404 처리)
        Musician center = findById(musicianId); // Repository1 호출

        // 2. 협연자 목록 + 협연 횟수 조회 (PerformanceLineupRepository의 @Query 실행)
        List<GraphEdgeResponse> edges = performanceLineupRepository.findCoPerformers(musicianId);   // Repository2 호출

        // 3. center + edges를 묶어서 GraphResponse로 반환
        return new GraphResponse(center, edges);    // 두 Repository의 결과를 조합(Service레이어가 존재하는 이유 - "어떤 데이터를 어떻게 조합할지")
    }
}