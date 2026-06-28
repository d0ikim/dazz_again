// 인맥지도 전체 응답을 담는 DTO 파일
// GraphEdgeResponse가 "엣지 하나"를 담는다면, GraphResponse는 "전체 응답"을 담는 바깥 그릇
package com.dazz.again.domain.musician;

import java.util.List;

public record GraphResponse(

        // 인맥지도의 중심 뮤지션 (예: GET /api/musicians/1/graph 요청 시 id=1인 뮤지션)
        Musician center,

        // 중심 뮤지션과 협연한 뮤지션 목록 + 각각의 협연 횟수
        // List<GraphEdgeResponse> = GraphEdgeResponse 여러 개를 순서 있게 담는 컬렉션
        List<GraphEdgeResponse> edges

        // 최종 API 응답 JSON 모양:
        // {
        //   "center": { "id": 1, "stageName": "김재즈", "position": "PIANO", ... },
        //   "edges": [
        //     { "musician": { "id": 2, "stageName": "박세션", ... }, "weight": 3 },
        //     { "musician": { "id": 3, "stageName": "한드럼", ... }, "weight": 1 }
        //   ]
        // }
) {}