// 뮤지션 관련 비즈니스 로직을 처리하는 파일
package com.dazz.again.domain.musician;

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

    private final MusicianRepository musicianRepository;       // DB 접근을 위한 Repository (생성자로 자동 주입됨)

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
}