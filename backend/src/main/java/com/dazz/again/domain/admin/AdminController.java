// ADMIN 전용 REST API 엔드포인트를 정의하는 파일
package com.dazz.again.domain.admin;

import io.swagger.v3.oas.annotations.Operation;                  // Swagger에서 각 API의 요약 설명을 표시하는 어노테이션
import io.swagger.v3.oas.annotations.responses.ApiResponse;      // Swagger에서 HTTP 응답 코드별 설명을 표시하는 어노테이션
import io.swagger.v3.oas.annotations.security.SecurityRequirement; // Swagger에서 "이 API는 JWT 인증 필요"를 자물쇠 아이콘으로 표시
import io.swagger.v3.oas.annotations.tags.Tag;                   // Swagger에서 API 그룹 이름을 지정하는 어노테이션
import lombok.RequiredArgsConstructor;                           // final 필드를 생성자 주입으로 자동 처리
import org.springframework.http.ResponseEntity;                  // HTTP 상태코드 + 응답 바디를 함께 반환하는 클래스
import org.springframework.web.bind.annotation.GetMapping;       // HTTP GET 요청을 이 메서드에 매핑
import org.springframework.web.bind.annotation.PatchMapping;     // HTTP PATCH 요청을 이 메서드에 매핑
import org.springframework.web.bind.annotation.PathVariable;     // URL 경로의 {id} 부분을 메서드 파라미터로 받는 어노테이션
import org.springframework.web.bind.annotation.RequestMapping;   // 이 컨트롤러의 공통 URL 접두사 지정
import org.springframework.web.bind.annotation.RestController;   // JSON 응답을 반환하는 컨트롤러 선언

import java.util.List; // 여러 건의 응답을 담는 컬렉션

@Tag(name = "관리자 API", description = "ADMIN 전용 — 뮤지션 인증 신청 목록 조회 / 승인 / 거부")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

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
}
