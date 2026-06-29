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
import org.springframework.web.bind.annotation.PostMapping;  // HTTP POST 메서드 매핑 어노테이션
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
            summary = "로그아웃",
            description = """
                    서버에 로그아웃을 알립니다. 서버는 200을 반환하고, 클라이언트는 저장된 JWT 토큰을 삭제해야 합니다.

                    JWT는 서버가 상태를 저장하지 않으므로 서버 측에서 토큰을 무효화할 수 없습니다.
                    실제 로그아웃은 클라이언트가 토큰을 삭제하는 것으로 완료됩니다.
                    """,
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "로그아웃 성공 (클라이언트가 토큰 삭제 필요)")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // JWT는 Stateless(무상태)이므로 서버가 토큰을 무효화할 수 없음
        // 이 엔드포인트는 클라이언트에게 "토큰을 삭제해도 된다"는 신호를 보내는 역할
        return ResponseEntity.ok().build();
    }

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