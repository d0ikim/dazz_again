// 서버 실행 진입점!!드
// src/main/ : 실제 서비스코드(배포될 코드)
package com.dazz.again;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DazzApplication {

    public static void main(String[] args) {
        SpringApplication.run(DazzApplication.class, args);
    }

}
