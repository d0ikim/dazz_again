// 공연 REST API 엔드포인트를 정의하는 파일
package com.dazz.again.domain.performance;

import io.swagger.v3.oas.annotations.Operation;              // API 메서드 설명 어노테이션
import io.swagger.v3.oas.annotations.Parameter;              // API 파라미터 설명 어노테이션
import io.swagger.v3.oas.annotations.responses.ApiResponse;  // API 응답 코드 설명 어노테이션
import io.swagger.v3.oas.annotations.security.SecurityRequirement; // Swagger에서 자물쇠 아이콘 표시용
import io.swagger.v3.oas.annotations.tags.Tag;               // API 그룹 이름 어노테이션
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder; // 현재 요청의 인증 정보 저장소 (JwtFilter가 userId를 여기에 저장)
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;  // HTTP POST 요청을 이 메서드에 매핑하는 어노테이션
import org.springframework.web.bind.annotation.RequestBody;  // HTTP 요청 바디의 JSON을 자바 객체로 변환하는 어노테이션
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.NoSuchElementException; // 존재하지 않는 공연/공연장/뮤지션 프로필 조회 시 발생하는 예외

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

    @Operation(summary = "공연 단건 조회", description = "id로 특정 공연 1건을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @ApiResponse(responseCode = "404", description = "해당 id의 공연 없음")
    @GetMapping("/{id}")
    public ResponseEntity<Performance> findById(
            @Parameter(description = "공연 id", example = "1")
            @PathVariable Long id
    ) {
        try {
            return ResponseEntity.ok(performanceService.findById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build(); // 존재하지 않는 공연 id면 404 반환
        }
    }

    @Operation(summary = "뮤지션별 공연 목록 조회", description = "특정 뮤지션이 출연한 공연 목록을 공연시작시간 오름차순으로 반환합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping("/musician/{musicianId}")
    public ResponseEntity<List<Performance>> findByMusicianId(
            @Parameter(description = "뮤지션 id", example = "1")
            @PathVariable Long musicianId
    ) {
        return ResponseEntity.ok(performanceService.findByMusicianId(musicianId));
    }

    @Operation(
            summary = "본인 공연 이력 추가",
            description = "로그인한 MUSICIAN이 자신이 출연한 공연을 직접 추가합니다. 공연(performance) 저장 후 라인업(performance_lineup)에도 본인이 자동 등록됩니다.",
            security = @SecurityRequirement(name = "bearerAuth") // Swagger에서 자물쇠 아이콘 표시
    )
    @ApiResponse(responseCode = "200", description = "추가 성공")
    @ApiResponse(responseCode = "400", description = "존재하지 않는 공연장 id, 또는 뮤지션 프로필 없음")
    @ApiResponse(responseCode = "401", description = "토큰 없음 또는 만료")
    @ApiResponse(responseCode = "403", description = "MUSICIAN 역할이 아님")
    @PostMapping
    public ResponseEntity<?> addByMusician(@RequestBody PerformanceRequest request) {
        // JwtFilter가 JWT파싱해서 userId+role 꺼냄 -> Authentication객체를 만들어 SecurityContextHolder에 저장함
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal(); // SecurityContextHolder에 저장한 userId를 꺼냄
        try {
            return ResponseEntity.ok(performanceService.addByMusician(userId, request));
        } catch (NoSuchElementException e) {
            // 존재하지 않는 공연장 id이거나 뮤지션 프로필이 없으면 400 반환
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}