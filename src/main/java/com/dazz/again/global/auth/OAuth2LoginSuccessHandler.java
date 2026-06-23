// 카카오 로그인 성공 직후 JWT를 발급해서 클라이언트에 전달하는 파일
package com.dazz.again.global.auth;

import com.dazz.again.domain.user.User;
import com.dazz.again.domain.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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

        // 발급한 토큰을 응답 헤더에 담아서 클라이언트에 전달
        response.setHeader("Authorization", "Bearer " + token);
//        log.info("[JWT 발급] userId={}, role={}, token={}", user.getId(), user.getRole(), token);
    }
}