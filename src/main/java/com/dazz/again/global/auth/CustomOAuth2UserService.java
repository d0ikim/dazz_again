// 카카오 로그인 성공 후 유저 정보를 DB에 저장하거나 조회하는 핵심 서비스
package com.dazz.again.global.auth;

import com.dazz.again.domain.user.User;
import com.dazz.again.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;  // Spring이 기본 제공하는 OAuth2 유저 조회 서비스
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;        // 카카오 서버에 유저 정보 요청할 때 필요한 정보를 담은 객체
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;              // Spring Security가 인식하는 유저 객체
import org.springframework.security.oauth2.core.user.OAuth2User;                     // OAuth2 유저의 공통 인터페이스
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    // 카카오 로그인이 성공하면 Spring Security가 이 메서드를 자동으로 호출함
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {

        // 1단계: 부모 클래스(DefaultOAuth2UserService)가 카카오 서버에서 유저 정보를 가져옴
        //        우리가 직접 카카오 API를 호출하지 않아도 됨 — Spring이 대신 처리
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 2단계: 카카오 응답(복잡한 Map)을 우리가 쓰기 편한 OAuth2Attributes 객체로 파싱
        OAuth2Attributes attributes = OAuth2Attributes.ofKakao(oAuth2User.getAttributes());

        // 3단계: DB에서 기존 유저 조회 — 없으면 새로 저장 (첫 로그인 시 자동 회원가입)
        User user = userRepository.findByKakaoId(attributes.getKakaoId())
                .orElseGet(() -> userRepository.save(attributes.toUser()));

        // 4단계: Spring Security가 인식할 수 있는 형태로 변환해서 반환
        //        이후 JwtFilter, SecurityConfig 등이 이 객체를 기반으로 권한을 판단함
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(user.getRole().name())), // 권한 (예: "GENERAL")
                oAuth2User.getAttributes(),  // 원본 카카오 응답 Map
                "id"                         // 카카오 응답에서 유저를 구별하는 키 이름
        );
    }
}