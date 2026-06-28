// 인맥지도 엣지(선) 하나를 담는 응답 DTO 파일
// DTO(Data Transfer Object) = DB 엔티티를 그대로 내보내지 않고, API 응답 전용으로 따로 만든 데이터 포장 클래스
package com.dazz.again.domain.musician;

// record = Java 16+에서 추가된 문법. 불변 데이터를 담는 클래스를 아주 짧게 선언할 수 있음.
// 아래 한 줄이 생성자 + getter + equals + hashCode + toString 을 전부 자동으로 만들어줌.
// 일반 class로 쓰면 @Getter, @AllArgsConstructor 등을 붙여야 하는데 record는 그게 필요 없음.
public record GraphEdgeResponse(

        // 협연 뮤지션 정보 (이름, 악기 등 Musician 엔티티 통째로)
        Musician musician,

        // 함께 공연한 횟수. JPQL의 COUNT() 결과값이 Long 타입이라서 Long으로 선언.
        Long weight

        // 이 record는 나중에 JPQL 쿼리에서 아래처럼 직접 호출됨:
        // SELECT new GraphEdgeResponse(pl.musician, COUNT(pl.performance)) FROM ...
        // → JPQL이 쿼리 결과를 이 생성자에 자동으로 넣어줌 (생성자 표현식)
) {}