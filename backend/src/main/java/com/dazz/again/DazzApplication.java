// 서버 실행 진입점!!
// src/main/ : 실제 서비스코드(배포될 코드)
package com.dazz.again;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing; // createdAt/updatedAt 자동 기록 활성화

@EnableJpaAuditing // @CreatedDate, @LastModifiedDate 어노테이션이 실제로 동작하도록 JPA Auditing 켜기
@SpringBootApplication
public class DazzApplication {

    public static void main(String[] args) {
        SpringApplication.run(DazzApplication.class, args);
    }

}
