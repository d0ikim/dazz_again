// 카카오(또는 소셜)로그인 응답형식에서 필요한정보만 골라담는 파싱(원하는값을 꺼내는) 작업하는 파일
package com.dazz.again.global.auth;

import com.dazz.again.domain.user.User;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class OAuth2Attributes {

    private Long kakaoId;           // 카카오가 부여한 유저 고유 번호
    private String nickname;        // 카카오 프로필 이름
    private String profileImageUrl; // 카카오 프로필 이미지 URL

    // 카카오 응답 Map → OAuth2Attributes 객체로 변환
    // attributes: Spring이 카카오 서버에서 받아온 유저 정보 (Map 형태)
    public static OAuth2Attributes ofKakao(Map<String, Object> attributes) {
        Long kakaoId = (Long) attributes.get("id"); // 최상단에 바로 있음

        // 카카오 응답은 중첩 구조라 두 단계로 파고 들어가야 함
        // attributes → "kakao_account" → "profile" → nickname, profile_image_url
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        Map<String, Object> profile      = (Map<String, Object>) kakaoAccount.get("profile");

        String nickname        = (String) profile.get("nickname");
        String profileImageUrl = (String) profile.get("profile_image_url");

        return OAuth2Attributes.builder()
                .kakaoId(kakaoId)
                .nickname(nickname)
                .profileImageUrl(profileImageUrl)
                .build();
    }

    // OAuth2Attributes → User 엔티티로 변환 (첫 로그인 시 신규 유저 생성에 사용)
    public User toUser() {
        return User.builder()
                .kakaoId(kakaoId)
                .nickname(nickname)
                .profileImageUrl(profileImageUrl)
                .build(); // role은 User.java의 @Builder.Default 덕분에 자동으로 GENERAL
    }
}