// 로그인한 유저 '본인 정보 조회' API를 정의하는 파일
package com.dazz.again.domain.user;

import io.swagger.v3.oas.annotations.Operation;              // API 메서드 설명 어노테이션
import io.swagger.v3.oas.annotations.responses.ApiResponse;  // API 응답 코드 설명 어노테이션
import io.swagger.v3.oas.annotations.security.SecurityRequirement; // Swagger에서 자물쇠 아이콘 표시용
import io.swagger.v3.oas.annotations.tags.Tag;               // API 그룹 이름 어노테이션
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder; // 현재 요청의 인증 정보 저장소
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.NoSuchElementException;

@Tag(name = "인증 API", description = "로그인 유저 본인 정보 조회")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Operation(
            summary = "내 정보 조회",
            description = "현재 로그인한 유저의 정보를 반환합니다. JWT 토큰이 필요합니다.",
            security = @SecurityRequirement(name = "bearerAuth") // Swagger에서 자물쇠 아이콘 표시
    )
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @ApiResponse(responseCode = "401", description = "토큰 없음 또는 만료")
    @ApiResponse(responseCode = "404", description = "유저를 찾을 수 없음")
    @GetMapping("/me")
    public ResponseEntity<User> getMe() {
        // JwtFilter가 요청마다 SecurityContextHolder에 저장해 둔 userId를 꺼냄
        // getPrincipal()은 Object 타입을 반환하므로 Long으로 명시적 형변환(캐스팅) 필요
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        try {
            return ResponseEntity.ok(userService.findById(userId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}