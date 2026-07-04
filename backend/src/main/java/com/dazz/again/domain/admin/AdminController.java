// ADMIN 전용 REST API 엔드포인트를 정의하는 파일
package com.dazz.again.domain.admin;

import com.dazz.again.domain.musician.Musician;                  // 뮤지션 엔티티 — 등록/수정 응답에 사용
import com.dazz.again.domain.musician.MusicianRequest;           // 뮤지션 등록/수정 요청 DTO
import com.dazz.again.domain.musician.MusicianService;           // 뮤지션 등록/수정 비즈니스 로직
import com.dazz.again.domain.performance.Performance;            // 공연 엔티티 — 등록/수정 응답에 사용
import com.dazz.again.domain.performance.PerformanceRequest;     // 공연 등록/수정 요청 DTO
import com.dazz.again.domain.performance.PerformanceService;     // 공연 등록/수정 비즈니스 로직
import com.dazz.again.domain.venue.Venue;                        // 공연장 엔티티 — 등록/수정 응답에 사용
import com.dazz.again.domain.venue.VenueRequest;                 // 공연장 등록/수정 요청 DTO
import com.dazz.again.domain.venue.VenueService;                 // 공연장 등록/수정 비즈니스 로직
import io.swagger.v3.oas.annotations.Operation;                  // Swagger에서 각 API의 요약 설명을 표시하는 어노테이션
import io.swagger.v3.oas.annotations.responses.ApiResponse;      // Swagger에서 HTTP 응답 코드별 설명을 표시하는 어노테이션
import io.swagger.v3.oas.annotations.security.SecurityRequirement; // Swagger에서 "이 API는 JWT 인증 필요"를 자물쇠 아이콘으로 표시
import io.swagger.v3.oas.annotations.tags.Tag;                   // Swagger에서 API 그룹 이름을 지정하는 어노테이션
import lombok.RequiredArgsConstructor;                           // final 필드를 생성자 주입으로 자동 처리
import org.springframework.http.ResponseEntity;                  // HTTP 상태코드 + 응답 바디를 함께 반환하는 클래스
import org.springframework.web.bind.annotation.GetMapping;       // HTTP GET 요청을 이 메서드에 매핑
import org.springframework.web.bind.annotation.PatchMapping;     // HTTP PATCH 요청을 이 메서드에 매핑
import org.springframework.web.bind.annotation.PathVariable;     // URL 경로의 {id} 부분을 메서드 파라미터로 받는 어노테이션
import org.springframework.web.bind.annotation.PostMapping;      // HTTP POST 요청을 이 메서드에 매핑
import org.springframework.web.bind.annotation.PutMapping;       // HTTP PUT 요청을 이 메서드에 매핑
import org.springframework.web.bind.annotation.RequestBody;      // HTTP 요청 바디의 JSON을 자바 객체로 변환하는 어노테이션
import org.springframework.web.bind.annotation.RequestMapping;   // 이 컨트롤러의 공통 URL 접두사 지정
import org.springframework.web.bind.annotation.RestController;   // JSON 응답을 반환하는 컨트롤러 선언

import java.util.List;               // 여러 건의 응답을 담는 컬렉션
import java.util.NoSuchElementException; // 존재하지 않는 리소스 조회 시 발생하는 예외

@Tag(name = "관리자 API", description = "ADMIN 전용 — 뮤지션 인증 신청 목록 조회 / 승인 / 거부 / 뮤지션 등록·수정 / 공연장 등록·수정 / 공연 등록·수정")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final MusicianService musicianService;      // 뮤지션 등록/수정 로직 처리
    private final VenueService venueService;           // 공연장 등록/수정 로직 처리
    private final PerformanceService performanceService; // 공연 등록/수정 로직 처리

    @Operation(
            summary = "PENDING 인증 신청 목록 조회",
            description = "아직 처리되지 않은 뮤지션 인증 신청 목록을 신청 일시 오름차순(선착순)으로 반환합니다. ADMIN만 호출 가능.",
            security = @SecurityRequirement(name = "bearerAuth") // Swagger에서 자물쇠 아이콘 표시
    )
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @GetMapping("/verify/pending")
    public ResponseEntity<List<AdminVerifyResponse>> getPendingList() {
        // AdminService에서 PENDING 상태의 신청 목록을 조회해 DTO 리스트로 반환
        return ResponseEntity.ok(adminService.getPendingList());
    }

    @Operation(
            summary = "인증 신청 승인",
            description = "지정한 신청을 승인합니다. VerificationRequest.status → APPROVED, User.role → MUSICIAN으로 변경됩니다. ADMIN만 호출 가능.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "승인 성공")
    @ApiResponse(responseCode = "400", description = "이미 처리된 신청이거나 존재하지 않는 신청")
    @PatchMapping("/verify/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        // {id} 경로 변수로 신청 ID를 받아 AdminService에 승인 처리 요청
        try {
            adminService.approve(id);
            return ResponseEntity.ok("승인 완료");
        } catch (IllegalArgumentException | IllegalStateException e) {
            // 존재하지 않는 신청 or 이미 처리된 신청이면 400 반환
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(
            summary = "인증 신청 거부",
            description = "지정한 신청을 거부합니다. VerificationRequest.status → REJECTED로 변경됩니다. User.role은 변경되지 않습니다. ADMIN만 호출 가능.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "거부 성공")
    @ApiResponse(responseCode = "400", description = "이미 처리된 신청이거나 존재하지 않는 신청")
    @PatchMapping("/verify/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        // {id} 경로 변수로 신청 ID를 받아 AdminService에 거부 처리 요청
        try {
            adminService.reject(id);
            return ResponseEntity.ok("거부 완료");
        } catch (IllegalArgumentException | IllegalStateException e) {
            // 존재하지 않는 신청 or 이미 처리된 신청이면 400 반환
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 뮤지션 관리 ───────────────────────────────────────────────────────────

    @Operation(
            summary = "뮤지션 등록",
            description = "새 뮤지션을 등록합니다. sourceType은 자동으로 ADMIN_CURATED, userId는 null(주인 없는 프로필)로 저장됩니다. ADMIN만 호출 가능.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "등록 성공")
    @PostMapping("/musicians")
    public ResponseEntity<Musician> createMusician(@RequestBody MusicianRequest request) {
        // 요청 바디의 JSON을 MusicianRequest 객체로 받아 MusicianService에 등록 요청
        return ResponseEntity.ok(musicianService.createByAdmin(request));
    }

    @Operation(
            summary = "뮤지션 수정",
            description = "기존 뮤지션 정보를 수정합니다. 본인(MUSICIAN) 여부와 무관하게 모든 뮤지션을 수정할 수 있습니다. ADMIN만 호출 가능.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "수정 성공")
    @ApiResponse(responseCode = "400", description = "존재하지 않는 뮤지션")
    @PutMapping("/musicians/{id}")
    public ResponseEntity<?> updateMusician(@PathVariable Long id, @RequestBody MusicianRequest request) {
        // {id}로 수정할 뮤지션을 특정하고, 요청 바디로 새 값을 받아 MusicianService에 수정 요청
        try {
            return ResponseEntity.ok(musicianService.updateByAdmin(id, request));
        } catch (NoSuchElementException e) {
            // 존재하지 않는 뮤지션 id면 400 반환
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 공연장 관리 ───────────────────────────────────────────────────────────

    @Operation(
            summary = "공연장 등록",
            description = "새 공연장을 등록합니다. ADMIN만 호출 가능.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "등록 성공")
    @PostMapping("/venues")
    public ResponseEntity<Venue> createVenue(@RequestBody VenueRequest request) {
        // 요청 바디의 JSON을 VenueRequest 객체로 받아 VenueService에 등록 요청
        return ResponseEntity.ok(venueService.create(request));
    }

    @Operation(
            summary = "공연장 수정",
            description = "기존 공연장 정보를 수정합니다. ADMIN만 호출 가능.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "수정 성공")
    @ApiResponse(responseCode = "400", description = "존재하지 않는 공연장")
    @PutMapping("/venues/{id}")
    public ResponseEntity<?> updateVenue(@PathVariable Long id, @RequestBody VenueRequest request) {
        // {id}로 수정할 공연장을 특정하고, 요청 바디로 새 값을 받아 VenueService에 수정 요청
        try {
            return ResponseEntity.ok(venueService.update(id, request));
        } catch (NoSuchElementException e) {
            // 존재하지 않는 공연장 id면 400 반환
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 공연 관리 ─────────────────────────────────────────────────────────────

    @Operation(
            summary = "공연 등록",
            description = """
                    새 공연을 등록합니다. ADMIN만 호출 가능.

                    **musicianIds (라인업)**
                    - 출연 뮤지션 id 목록을 함께 보내면 공연 저장 후 라인업(performance_lineup)에도 등록됩니다.
                    - 생략(null)하면 라인업 없이 공연만 등록됩니다.
                    - 존재하지 않는 뮤지션 id가 섞여 있으면 공연 등록까지 전부 취소(롤백)됩니다.
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "등록 성공")
    @ApiResponse(responseCode = "400", description = "존재하지 않는 공연장 또는 뮤지션 id")
    @PostMapping("/performances")
    public ResponseEntity<?> createPerformance(@RequestBody PerformanceRequest request) {
        // 요청 바디의 JSON을 PerformanceRequest 객체로 받아 PerformanceService에 등록 요청
        try {
            return ResponseEntity.ok(performanceService.create(request));
        } catch (NoSuchElementException e) {
            // 요청의 venueId에 해당하는 공연장이 없거나 musicianIds에 없는 뮤지션이 있으면 400 반환
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(
            summary = "공연 수정",
            description = """
                    기존 공연 정보를 수정합니다. ADMIN만 호출 가능.

                    **musicianIds (라인업)**
                    - 목록을 보내면 기존 라인업을 전부 지우고 보낸 목록으로 교체합니다.
                    - 빈 배열([])을 보내면 라인업이 전부 삭제됩니다.
                    - 생략(null)하면 라인업은 건드리지 않고 공연 정보만 수정됩니다.
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "수정 성공")
    @ApiResponse(responseCode = "400", description = "존재하지 않는 공연, 공연장 또는 뮤지션 id")
    @PutMapping("/performances/{id}")
    public ResponseEntity<?> updatePerformance(@PathVariable Long id, @RequestBody PerformanceRequest request) {
        // {id}로 수정할 공연을 특정하고, 요청 바디로 새 값을 받아 PerformanceService에 수정 요청
        try {
            return ResponseEntity.ok(performanceService.update(id, request));
        } catch (NoSuchElementException e) {
            // 존재하지 않는 공연, 공연장 또는 뮤지션 id면 400 반환
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
