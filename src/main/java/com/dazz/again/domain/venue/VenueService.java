package com.dazz.again.domain.venue; // Venue 도메인 패키지에 속한 파일

import lombok.RequiredArgsConstructor; // Lombok: final 필드를 받는 생성자를 자동 생성 (의존성 주입에 사용)
import org.springframework.stereotype.Service; // 이 클래스가 비즈니스 로직을 담당하는 Service임을 Spring에게 알리는 어노테이션
import org.springframework.transaction.annotation.Transactional; // DB 작업을 하나의 트랜잭션으로 묶어주는 어노테이션

import java.util.List; // 여러 개의 Venue를 담을 List 타입

@Service // Spring이 이 클래스를 서비스 빈으로 등록 → Controller에서 주입받아 사용 가능
@RequiredArgsConstructor // final로 선언된 venueRepository를 받는 생성자를 Lombok이 자동 생성
@Transactional(readOnly = true) // 이 클래스의 모든 메서드는 기본적으로 읽기 전용 트랜잭션으로 실행 (성능 최적화)
public class VenueService {

    private final VenueRepository venueRepository; // DB 접근을 위한 Repository (생성자로 자동 주입됨)

    // 공연장 이름으로 검색 — keyword가 이름에 포함된 공연장 목록 반환
    public List<Venue> searchByName(String keyword) {
        return venueRepository.findByNameContaining(keyword); // Repository의 메서드 호출 → SQL 실행
    }

    // 공연장 주소로 검색 — keyword가 주소에 포함된 공연장 목록 반환
    public List<Venue> searchByAddress(String keyword) {
        return venueRepository.findByAddressContaining(keyword); // Repository의 메서드 호출 → SQL 실행
    }

    // 전체 공연장 목록 반환 — JpaRepository 기본 제공 메서드 사용
    public List<Venue> findAll() {
        return venueRepository.findAll(); // SELECT * FROM venue
    }
}