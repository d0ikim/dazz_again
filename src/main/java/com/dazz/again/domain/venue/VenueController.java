package com.dazz.again.domain.venue; // Venue 도메인 패키지에 속한 파일

import lombok.RequiredArgsConstructor; // Lombok: final 필드를 받는 생성자 자동 생성
import org.springframework.http.ResponseEntity; // HTTP 응답 코드(200, 404 등)와 데이터를 함께 반환하는 클래스
import org.springframework.web.bind.annotation.GetMapping; // HTTP GET 요청을 처리하는 메서드임을 선언
import org.springframework.web.bind.annotation.RequestMapping; // 이 Controller의 기본 URL 경로를 선언
import org.springframework.web.bind.annotation.RequestParam; // URL의 ?keyword=블루노트 같은 파라미터를 받는 어노테이션
import org.springframework.web.bind.annotation.RestController; // JSON을 반환하는 Controller임을 선언 (@Controller + @ResponseBody)

import java.util.List; // 여러 개의 Venue를 담을 List 타입

@RestController // 이 클래스가 HTTP 요청을 받고 JSON으로 응답하는 Controller임을 Spring에게 알림
@RequestMapping("/api/venues") // 이 Controller의 모든 URL은 /api/venues 로 시작
@RequiredArgsConstructor // final로 선언된 venueService를 받는 생성자를 Lombok이 자동 생성
public class VenueController {

    private final VenueService venueService; // 비즈니스 로직을 처리하는 Service (Spring이 자동 주입)

    // GET /api/venues → 전체 공연장 목록 반환
    @GetMapping
    public ResponseEntity<List<Venue>> findAll() {
        List<Venue> venues = venueService.findAll(); // Service에서 전체 목록 조회
        return ResponseEntity.ok(venues); // HTTP 200 OK와 함께 JSON으로 반환
    }

    // GET /api/venues/search?type=name&keyword=블루노트 → 이름으로 공연장 검색
    // GET /api/venues/search?type=address&keyword=강남 → 주소로 공연장 검색
    @GetMapping("/search")
    public ResponseEntity<List<Venue>> search(
            @RequestParam String type,    // URL의 ?type=name 또는 ?type=address 값을 받음
            @RequestParam String keyword  // URL의 ?keyword=블루노트 값을 받음
    ) {
        List<Venue> result;

        if (type.equals("name")) {
            result = venueService.searchByName(keyword); // 이름으로 검색
        } else if (type.equals("address")) {
            result = venueService.searchByAddress(keyword); // 주소로 검색
        } else {
            return ResponseEntity.badRequest().build(); // type이 name도 address도 아니면 HTTP 400 반환
        }

        return ResponseEntity.ok(result); // HTTP 200 OK와 함께 검색 결과 JSON으로 반환
    }
}