// 공연장 DB테이블구조 정의하는 파일
package com.dazz.again.domain.venue; // 이 파일이 속한 패키지(폴더) 위치를 선언

import com.fasterxml.jackson.annotation.JsonPropertyOrder; // JSON 응답 필드 순서를 지정하는 어노테이션
import jakarta.persistence.Column;   // DB 컬럼 속성을 설정하는 어노테이션
import jakarta.persistence.Entity;   // 이 클래스가 DB 테이블과 연결된다고 선언하는 어노테이션
import jakarta.persistence.GeneratedValue; // PK 값을 자동으로 생성해주는 어노테이션
import jakarta.persistence.GenerationType; // PK 자동 생성 전략 종류 (IDENTITY = DB가 알아서 증가)
import jakarta.persistence.Id;       // 이 필드가 PK(기본키)임을 선언하는 어노테이션
import jakarta.persistence.Table;   // 연결할 DB 테이블 이름을 지정하는 어노테이션
import lombok.AccessLevel;          // Lombok: 접근제어자 수준 설정에 사용
import lombok.AllArgsConstructor;   // Lombok: 모든 필드를 받는 생성자를 자동 생성 (@Builder가 필요로 함)
import lombok.Builder;              // Lombok: 빌더 패턴으로 객체를 생성할 수 있게 해줌
import lombok.Getter;               // Lombok: 모든 필드의 getter 메서드를 자동 생성
import lombok.NoArgsConstructor;    // Lombok: 파라미터 없는 기본 생성자를 자동 생성 (JPA 필수)

@JsonPropertyOrder({"id", "name", "location", "instagramUrl", "homepageUrl", "description"})
@Entity                             // JPA에게 "이 클래스는 DB 테이블이야"라고 알림
@Table(name = "venue")              // 연결할 테이블 이름을 "venue"로 지정
@Getter                             // id, name 등 모든 필드에 대해 getXxx() 메서드 자동 생성
@NoArgsConstructor(access = AccessLevel.PROTECTED)  // JPA가 내부적으로 쓸 기본 생성자, 외부에서 직접 new Venue() 못하게 막음
@AllArgsConstructor(access = AccessLevel.PRIVATE)   // @Builder가 내부적으로 사용할 전체 필드 생성자, 외부 직접 호출 불가
@Builder                            // Venue.builder().name("블루노트").build() 방식으로 객체 생성 가능하게 해줌
public class Venue {

    @Id                                                 // 이 필드가 PK(기본키)
    @GeneratedValue(strategy = GenerationType.IDENTITY) // INSERT 시 DB가 1, 2, 3... 자동으로 ID 부여
    private Long id;                                    // 공연장 고유 번호

    @Column(nullable = false)           // DB에서 이 컬럼은 NULL 불가
    private String name;                // 공연장 이름 (예: "블루노트 서울")

    @Column(nullable = false)           // NULL 불가
    private String location;            // 공연장 위치 (예: "서울시 마포구 ...")

    @Column                             // NULL 허용
    private String instagramUrl;        // 공연장 인스타그램 URL

    @Column                             // NULL 허용
    private String homepageUrl;         // 공연장 홈페이지 URL

    @Column                             // NULL 허용 (선택 정보)
    private String description;         // 공연장 메모/설명

    // ADMIN이 공연장 정보를 수정할 때 호출 — 전달받은 값으로 모든 필드를 교체
    public void update(String name, String location, String instagramUrl, String homepageUrl, String description) {
        this.name = name;
        this.location = location;
        this.instagramUrl = instagramUrl;
        this.homepageUrl = homepageUrl;
        this.description = description;
    }
}