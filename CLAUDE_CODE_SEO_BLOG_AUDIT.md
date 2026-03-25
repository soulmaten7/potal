# SEO 블로그 현황 분석 — B2C→B2B 전환 감사

> ⚠️ 이 작업은 분석만 합니다. 코드 수정, 빌드, git push 하지 않습니다.

## 배경
기존 블로그 3개는 B2C 시절에 작성된 것. POTAL은 B2B Total Landed Cost 인프라 플랫폼으로 피봇했으므로, 기존 콘텐츠가 B2B 타겟에 맞는지 전수 분석 필요.

## 분석 대상 파일
1. `app/blog/page.tsx` — 블로그 랜딩 페이지
2. `app/blog/[slug]/page.tsx` — 개별 포스트 페이지
3. `app/blog/posts.tsx` — 블로그 포스트 데이터 (3개 글)
4. `app/sitemap.ts` — 사이트맵
5. `app/robots.ts` — robots.txt
6. `app/faq/page.tsx` — FAQ 페이지
7. `app/guide/page.tsx` — 필드 가이드
8. `app/learn/page.tsx` — 학습 허브

## 분석 항목 (각 파일별로 수행)

### Step 1: 블로그 포스트 3개 전수 분석
`app/blog/posts.tsx`를 읽고 각 포스트별로:
- **제목**: B2B 타겟에 적합한가? (이커머스 셀러 vs API 사용자/개발자/기업)
- **키워드**: SEO 키워드가 B2B 검색 의도에 맞는가?
- **CTA**: 어디로 유도하는가? (가입? API 문서? 가격표?)
- **내용 톤**: B2C(개인 셀러 대상)인가 B2B(기업/개발자 대상)인가?
- **기술 깊이**: API 사용자에게 유용한 수준인가?
- **수치/데이터**: 최신 POTAL 수치(240개국, 131K tariff lines, 155+ endpoints 등)와 일치하는가?
- **경쟁사 언급**: Avalara, Zonos 등 대비 포지셔닝이 있는가?

각 포스트에 대해 아래 포맷으로 정리:
```
포스트 [N]: [제목]
- B2B 적합도: [높음/중간/낮음]
- 수정 필요 사항: [목록]
- 키워드 제안: [B2B 타겟 키워드]
- CTA 변경: [현재 → 추천]
```

### Step 2: 블로그 인프라 분석
`app/blog/page.tsx`와 `app/blog/[slug]/page.tsx`를 읽고:
- 메타데이터/OG/Twitter 카드 구조
- JSON-LD 스키마 타입 (Blog? Article? TechArticle?)
- 이미지 처리 (next/image? 외부 URL?)
- 페이지네이션 구조
- 카테고리/태그 시스템 유무
- RSS 피드 유무
- 댓글/공유 기능 유무
- 콘텐츠 렌더링 방식 (TSX 하드코딩? MDX? DB?)

### Step 3: SEO 설정 분석
`app/sitemap.ts`와 `app/robots.ts`를 읽고:
- sitemap에 포함된 URL 전체 목록
- changeFrequency, priority 설정 적절성
- robots.txt allow/disallow 규칙
- 블로그 관련 구조화 데이터 확인

### Step 4: FAQ/Guide/Learn 콘텐츠 분석
각 파일을 읽고:
- FAQ: 총 질문 수, 카테고리 구성, B2B 관련 질문 비율
- Guide: 어떤 필드를 다루는지, API 사용자에게 유용한지
- Learn: 현재 콘텐츠 상태, "coming soon" 항목

### Step 5: B2B SEO 전략 제안
위 분석을 기반으로:
1. **유지할 것**: B2B에도 유효한 기존 콘텐츠
2. **수정할 것**: 톤/키워드/CTA만 바꾸면 되는 것
3. **새로 만들 것**: B2B 타겟 신규 블로그 포스트 10개 제목+키워드 제안
   - API 통합 가이드, 개발자 튜토리얼, 산업별 사례 등
   - 타겟 키워드: "landed cost API", "HS code classification API", "customs duty calculator API", "cross-border commerce API" 등
4. **삭제할 것**: B2C 전용이라 B2B에 부적합한 것

## 출력
분석 결과를 `SEO_BLOG_AUDIT_REPORT.md` 파일로 저장한다.
포맷: 마크다운, 각 Step별 섹션, 구체적 수치와 인용 포함.

## ⚠️ 주의
- **코드 수정 금지** — 이 작업은 분석만 합니다
- **빌드 실행 금지** — `npm run build` 하지 않습니다 (다른 터미널과 충돌 방지)
- **git 명령어 금지** — add, commit, push 하지 않습니다
- 분석 결과 파일만 생성합니다
