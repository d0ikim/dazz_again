package com.dazz.again.domain.venue; // Venue 도메인 패키지에 속한 파일

import org.springframework.data.jpa.repository.JpaRepository; // Spring Data JPA가 제공하는 기본 DB 조작 인터페이스
import org.springframework.stereotype.Repository; // 이 인터페이스가 DB 접근 역할임을 Spring에게 알리는 어노테이션

import java.util.List; // 여러 개의 Venue를 담을 List 타입

// JpaRepository<Venue, Long> : Venue 테이블을 다루고, PK 타입은 Long이라고 선언
// JpaRepository를 상속하면 save(), findById(), findAll(), delete() 등 기본 메서드를 자동으로 사용 가능
@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {

    // 메서드 이름만 작성하면 Spring Data JPA가 자동으로 SQL을 만들어줌
    // "findBy + 필드명 + Containing" = 해당 필드에 키워드가 포함된 데이터를 조회
    // 실행되는 SQL: SELECT * FROM venue WHERE name LIKE '%keyword%'
    List<Venue> findByNameContaining(String keyword);

    // 위치에 키워드가 포함된 공연장 검색
    // 실행되는 SQL: SELECT * FROM venue WHERE location LIKE '%keyword%'
    List<Venue> findByLocationContaining(String keyword);
}