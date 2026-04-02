# 홈페이지 + Pricing Layer 2 (9-Field) 반영 명령어

## 실행 방법
아래 전체를 Claude Code 터미널에 한 번에 붙여넣기

```
echo "=== 홈페이지 + Pricing Layer 2 업데이트 ===" && echo "시작: $(date '+%Y-%m-%d %H:%M:%S KST')" && echo "" && \

echo "##############################" && \
echo "# Phase 1: 현재 코드 확인" && \
echo "##############################" && \
echo "" && \

# 1. 홈페이지 Hero/Features 섹션 확인
echo "=== 홈페이지 page.tsx ===" && \
wc -l app/page.tsx && \
echo "" && \

# 2. Pricing 페이지 확인
echo "=== Pricing page.tsx ===" && \
wc -l app/pricing/page.tsx && \
echo "" && \

# 3. Hero 수치/Feature 키워드 확인
echo "=== Hero 영역 현재 수치 ===" && \
grep -n "240\|113M\|63 FTA\|50 Language\|hero\|Hero\|stat\|feature\|Feature" app/page.tsx | head -20 && \
echo "" && \

echo "=== Pricing 현재 Feature 리스트 ===" && \
grep -n "feature\|Feature\|HS Code\|classify\|accuracy\|field\|9-field\|9 field" app/pricing/page.tsx | head -20 && \
echo "" && \

echo "##############################" && \
echo "# Phase 2: 홈페이지 업데이트" && \
echo "##############################" && \
echo "" && \

# 홈페이지 업데이트 내용:
# 1. Hero 섹션: 기존 4개 수치 옆이나 아래에 "9-Field HS Classification — 100% Accuracy" 추가
# 2. Features 섹션: "AI-Powered 9-Field Classification" 피처 카드 추가
#    - 9개 필드 입력 → 100% HS Code 정확도
#    - material (+45%), category (+33%), product_name (+18%) 정확도 영향
#    - 실시간 필드 검증 + 수정 가이드 제공
#    - WCO/ISO 국제 법적 기준 기반
# 3. /guide 페이지 링크 추가

# 읽기 → 수정 위치 파악
cat -n app/page.tsx | head -100
echo "..."
echo "=== Hero stats 영역 찾기 ==="
grep -n "Countries\|Tariff\|FTA\|Language\|AnimatedNumber\|stat" app/page.tsx | head -20

echo ""
echo "=== Features 영역 찾기 ==="
grep -n "feature\|Feature\|section\|Section\|HS Code\|classify\|duty\|widget" app/page.tsx | head -30

echo ""
echo "Phase 2 분석 완료. 이제 코드를 수정합니다."
echo ""

# 실제 수정은 아래 지침에 따라 Claude Code가 자동으로 수행:
#
# [수정 1] Hero 섹션 — 기존 stats 아래 또는 옆에 추가:
# "9-Field Classification" 배지 또는 stat 카드
# 값: "100%" / 라벨: "HS Code Accuracy" / 부제: "with 9-field input"
# 또는 "9 Fields → 100% Accuracy" 형태의 배너
#
# [수정 2] Features 섹션 — 새 피처 카드 추가:
# 제목: "9-Field HS Classification"
# 설명: "Input 9 standardized fields (product name, material, category...) and get 100% accurate HS Codes.
#        Each field is validated against WCO international standards with real-time accuracy feedback."
# 링크: "/guide" (Classification Guide)
# 아이콘: shield-check 또는 target 또는 clipboard-check
#
# [수정 3] CTA 또는 배너:
# "See how 9 fields achieve 100% accuracy →" /guide 링크
#
# [수정 4] Pricing 페이지 — Feature 리스트에 추가:
# "9-Field HS Classification (100% accuracy)" 모든 플랜에 포함
# "Real-time field validation & accuracy feedback" 모든 플랜에 포함
# "/guide" 링크

echo "=== 홈페이지 수정 시작 ===" && \

# Claude Code에게: app/page.tsx를 읽고, Hero stats 영역에 아래 내용을 추가해줘.
# 기존 "240 Countries / 113M+ Tariff Records / 63 FTAs / 50 Languages" 수치 아래 또는 옆에:
#
# 새 stat: { value: "100%", label: "HS Code Accuracy", sublabel: "9-field input" }
# 또는 배너: "9 Fields → 100% Accuracy — See Classification Guide"
#
# Features 섹션에 새 카드:
# {
#   title: "9-Field HS Classification",
#   description: "Input standardized fields — product name, material, category, and more — validated against WCO international standards. Get 100% accurate HS Codes with real-time accuracy feedback.",
#   link: "/guide",
#   linkText: "View Classification Guide"
# }

# 자동 수정 실행
cat app/page.tsx | wc -l && \
echo "홈페이지 파일 읽기 완료. 수정 진행..." && \

# Hero에 9-field stat 추가
# Features에 9-Field Classification 카드 추가
# 두 수정 모두 기존 코드 패턴을 따라서 추가

# [지시] Claude Code야, 아래 작업을 순서대로 해줘:
# 1. app/page.tsx를 읽어서 Hero stats 배열을 찾아 (AnimatedNumber나 stat 관련 배열)
# 2. 거기에 { value: "100%", label: "HS Code Accuracy", sub: "9-field input" } 추가
# 3. Features 배열/섹션을 찾아서 "9-Field HS Classification" 카드 추가
# 4. /guide 링크 포함
# 5. app/pricing/page.tsx를 읽어서 Feature 리스트에 "9-Field HS Classification (100% accuracy)" 추가
# 6. npm run build로 확인
# 7. 성공하면 git add + commit + push (git push 직접 해줘, Mac 터미널 아님)

echo "" && \
echo "=== 구체적 수정 내용 ===" && \
echo "" && \
echo "1. app/page.tsx Hero: '100% HS Accuracy (9-field)' stat 추가" && \
echo "2. app/page.tsx Features: '9-Field Classification' 카드 추가 + /guide 링크" && \
echo "3. app/pricing/page.tsx: '9-Field HS Classification' feature 추가" && \
echo "4. npm run build 확인" && \
echo "5. git add + commit + push" && \
echo "" && \

# Phase 3: 실제 수정
# Claude Code가 위 지시를 읽고 app/page.tsx와 app/pricing/page.tsx를 수정해줄 것

# 먼저 Hero 영역 상세 확인
echo "=== Hero 영역 상세 (stat 배열) ===" && \
grep -n -A3 "240\|Countries\|Tariff.*Record\|FTA\|Language" app/page.tsx | head -40 && \
echo "" && \

echo "=== Features 영역 상세 ===" && \
grep -n -A5 "feature\|Feature" app/page.tsx | head -60 && \
echo "" && \

echo "=== Pricing Features 상세 ===" && \
grep -n -A3 "feature\|Feature\|✓\|✔\|check\|included" app/pricing/page.tsx | head -40 && \
echo "" && \

echo "Phase 1 분석 완료." && \
echo "" && \
echo "이제 위 분석 결과를 보고, app/page.tsx와 app/pricing/page.tsx를 수정해줘." && \
echo "수정 방향:" && \
echo "  - Hero: 기존 4개 stat 옆에 '100% HS Code Accuracy (9-field input)' 추가" && \
echo "  - Features: '9-Field HS Classification' 카드 추가, /guide 링크 포함" && \
echo "  - Pricing: 모든 플랜에 '9-Field HS Classification (100% accuracy)' feature 추가" && \
echo "  - 빌드 확인 후 git push까지 해줘 (이 터미널에서 직접)"
```
