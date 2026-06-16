package com.dazz.again.domain.venue;

import io.swagger.v3.oas.annotations.Operation;            // API 메서드 설명 어노테이션
import io.swagger.v3.oas.annotations.Parameter;            // API 파라미터 설명 어노테이션
import io.swagger.v3.oas.annotations.responses.ApiResponse;  // API 응답 코드 설명 어노테이션
import io.swagger.v3.oas.annotations.tags.Tag;             // API 그룹 이름 어노테이션
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "공연장 API", description = "서울 재즈 공연장 목록 조회 및 검색") // Swagger에서 이 Controller의 그룹 이름과 설명
@RestController
@RequestMapping("/api/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueService venueService;

    @Operation(
            summary = "전체 공연장 목록 조회",
            description = "등록된 모든 공연장 목록을 반환합니다."
    )
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping
    public ResponseEntity<List<Venue>> findAll() {
        List<Venue> venues = venueService.findAll();
        return ResponseEntity.ok(venues);
    }

    @Operation(
            summary = "공연장 검색",
            description = """
                    이름 또는 주소 키워드로 공연장을 검색합니다.

                    **type 파라미터**
                    - `name` : 공연장 이름으로 검색 (예: 블루노트)
                    - `address` : 주소로 검색 (예: 강남, 홍대, 마포)
                    """
    )
    @ApiResponse(responseCode = "200", description = "검색 성공")
    @ApiResponse(responseCode = "400", description = "type 값이 name 또는 address가 아닌 경우")
    @GetMapping("/search")
    public ResponseEntity<List<Venue>> search(
            @Parameter(description = "검색 기준 (name: 이름 검색 / address: 주소 검색)", example = "name")
            @RequestParam String type,
            @Parameter(description = "검색 키워드", example = "블루노트")
            @RequestParam String keyword
    ) {
        List<Venue> result;

        if (type.equals("name")) {
            result = venueService.searchByName(keyword);
        } else if (type.equals("address")) {
            result = venueService.searchByAddress(keyword);
        } else {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(result);
    }
}