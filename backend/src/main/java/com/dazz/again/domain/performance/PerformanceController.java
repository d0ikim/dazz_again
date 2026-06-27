// 공연 REST API 엔드포인트를 정의하는 파일
package com.dazz.again.domain.performance;

import io.swagger.v3.oas.annotations.Operation;              // API 메서드 설명 어노테이션
import io.swagger.v3.oas.annotations.Parameter;              // API 파라미터 설명 어노테이션
import io.swagger.v3.oas.annotations.responses.ApiResponse;  // API 응답 코드 설명 어노테이션
import io.swagger.v3.oas.annotations.tags.Tag;               // API 그룹 이름 어노테이션
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "공연 API", description = "서울 재즈 공연 목록 조회 및 검색")
@RestController
@RequestMapping("/api/performances")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;

    @Operation(
            summary = "전체 공연 목록 조회",
            description = "등록된 모든 공연 목록을 공연시작시간 오름차순으로 반환합니다."
    )
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping
    public ResponseEntity<List<Performance>> findAll() {
        List<Performance> performances = performanceService.findAll();
        return ResponseEntity.ok(performances);
    }

    @Operation(
            summary = "공연 검색",
            description = """
                    공연명 또는 장르 키워드로 공연을 검색합니다.

                    **type 파라미터**
                    - `title` : 공연명으로 검색 (예: The Steady Duo)
                    - `genre` : 장르로 검색 (예: JAZZ, LATIN)
                    """
    )
    @ApiResponse(responseCode = "200", description = "검색 성공")
    @ApiResponse(responseCode = "400", description = "type 값이 title 또는 genre가 아닌 경우")
    @GetMapping("/search")
    public ResponseEntity<List<Performance>> search(
            @Parameter(description = "검색 기준 (title: 공연명 검색 / genre: 장르 검색)", example = "title")
            @RequestParam String type,
            @Parameter(description = "검색 키워드", example = "The Steady Duo")
            @RequestParam String keyword
    ) {
        List<Performance> result;

        if (type.equals("title")) {
            result = performanceService.searchByTitle(keyword);
        } else if (type.equals("genre")) {
            result = performanceService.searchByGenre(keyword);
        } else {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(result);
    }
}