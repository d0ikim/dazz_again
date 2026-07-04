// 카카오 로그인 성공 직후 JWT를 발급해서 클라이언트에 전달하는 파일
package com.dazz.again.global.auth;

import com.dazz.again.domain.user.User;
import com.dazz.again.domain.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value; // application.yaml의 설정값을 필드에 주입하는 어노테이션
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler; // 로그인 성공 핸들러 기반 클래스
import org.springframework.stereotype.Component;

import java.io.IOException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    // application.yaml의 frontend.url 값 주입 (환경변수 FRONTEND_URL 또는 기본값 localhost:5173)
    // SecurityConfig의 CORS와 달리 여기는 "돌아갈 곳" 하나만 필요하므로 목록이 아닌 단일 값
    @Value("${frontend.url}")
    private String frontendUrl;

    // 카카오 로그인이 성공하면 Spring Security가 이 메서드를 자동으로 호출함
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        // CustomOAuth2UserService가 반환한 OAuth2User 객체에서 카카오ID 꺼내기
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Long kakaoId = (Long) oAuth2User.getAttributes().get("id");

        // 카카오ID로 DB에서 유저 조회 (CustomOAuth2UserService에서 이미 저장했으므로 반드시 존재)
        User user = userRepository.findByKakaoId(kakaoId)
                .orElseThrow(() -> new IllegalStateException("로그인 성공했지만 유저를 찾을 수 없음"));

        // 유저 ID와 역할로 JWT 발급
        String token = jwtProvider.generateToken(user.getId(), user.getRole().name());

        // 발급한 토큰을 URL 파라미터에 담아 프론트엔드로 리다이렉트
        // 브라우저가 응답 헤더를 직접 읽을 수 없으므로, URL로 전달하는 것이 표준적인 방법
        // 프론트엔드: {frontendUrl}?token=eyJ... 에서 token 파라미터를 읽어 저장
        // 주소를 하드코딩하지 않고 환경변수 기반 frontendUrl 사용 → 로컬/배포 환경 모두 대응
        response.sendRedirect(frontendUrl + "?token=" + token);
    }
}