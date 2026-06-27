// 뮤지션 인증 신청 REST API 엔드포인트를 정의하는 파일
package com.dazz.again.domain.verify;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "뮤지션 인증 API", description = "뮤지션 인증 신청 및 상태 조회")
@RestController
@RequestMapping("/api/verify")
@RequiredArgsConstructor
public class VerificationRequestController {

    private final VerificationRequestService verificationRequestService;

    @Operation(
            summary = "뮤지션 인증 신청",
            description = "로그인한 유저가 뮤지션 인증을 신청합니다. 이미 신청 중이거나 인증된 뮤지션이면 실패합니다.",
            security = @SecurityRequirement(name = "bearerAuth") // Swagger에서 자물쇠 아이콘 표시
    )
    @ApiResponse(responseCode = "200", description = "신청 성공")
    @ApiResponse(responseCode = "409", description = "이미 신청 중이거나 이미 인증된 뮤지션")
    @PostMapping("/musician")
    public ResponseEntity<?> apply() {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        try {
            VerificationRequest request = verificationRequestService.apply(userId);
            return ResponseEntity.ok(request);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @Operation(
            summary = "내 인증 신청 상태 조회",
            description = "로그인한 유저의 가장 최근 인증 신청 내역을 조회합니다.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @ApiResponse(responseCode = "404", description = "신청 내역 없음")
    @GetMapping("/musician/me")
    public ResponseEntity<?> findMyRequest() {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        try {
            VerificationRequest request = verificationRequestService.findMyRequest(userId);
            return ResponseEntity.ok(request);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}