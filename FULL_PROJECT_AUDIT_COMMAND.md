# POTAL 전체 프로젝트 감사 명령어
# Claude Code에 복사-붙여넣기하세요
# 2026-03-15 18:30 KST

---

아래 작업을 순서대로 실행해줘. **문서에 적힌 내용을 믿지 말고, 실제 파일을 직접 읽어서** 현재 상태를 정확히 파악해.

## 목표
portal/ 폴더와 외장하드(/Volumes/soulmaten/POTAL/)의 **모든 파일을 실제로 읽고**, 프로젝트의 진짜 현재 상태를 파악해서 `docs/FULL_PROJECT_AUDIT.md` 리포트를 생성해.

## 작업 순서 (한 번에 하나씩, 절대 규칙)

### Phase 1: 코드베이스 전체 구조 스캔

```bash
# 1-1. 전체 파일 트리 (node_modules, .next, .git 제외)
find ~/portal -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -not -path "*/build/*" \
  -not -name "*.log" \
  -not -name "*.lock" \
  -not -name "tsconfig.tsbuildinfo" \
  | sort > /tmp/portal_all_files.txt
wc -l /tmp/portal_all_files.txt
```

```bash
# 1-2. 파일 유형별 통계
echo "=== 파일 유형별 개수 ==="
cat /tmp/portal_all_files.txt | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -30
```

### Phase 2: 핵심 코드 파일 전부 읽기

아래 파일들을 **전부 cat으로 읽어서** 내용을 파악해. 각 파일이 뭘 하는지, 어떤 상태인지 메모해.

**2-1. API 엔드포인트 (app/api/v1/ 전체)**
```bash
find ~/portal/app/api/v1 -name "route.ts" | sort
```
위 결과의 모든 route.ts 파일을 전부 읽어. 각 엔드포인트가 실제로 뭘 하는지, import하는 모듈이 존재하는지, 에러 가능성이 있는지 확인.

**2-2. Cost Engine 핵심 (app/lib/cost-engine/)**
```bash
# GlobalCostEngine.ts — 가장 핵심 파일
cat ~/portal/app/lib/cost-engine/GlobalCostEngine.ts
# CostEngine.ts
cat ~/portal/app/lib/cost-engine/CostEngine.ts
# macmap-lookup.ts
cat ~/portal/app/lib/cost-engine/macmap-lookup.ts
# trade-remedy-lookup.ts
cat ~/portal/app/lib/cost-engine/trade-remedy-lookup.ts
# section301-lookup.ts
cat ~/portal/app/lib/cost-engine/section301-lookup.ts
# eu-vat-rates.ts
cat ~/portal/app/lib/cost-engine/eu-vat-rates.ts
# ioss-oss.ts
cat ~/portal/app/lib/cost-engine/ioss-oss.ts
# origin-detection.ts
cat ~/portal/app/lib/cost-engine/origin-detection.ts
# index.ts
cat ~/portal/app/lib/cost-engine/index.ts
# types.ts
cat ~/portal/app/lib/cost-engine/types.ts
# adapters.ts
cat ~/portal/app/lib/cost-engine/adapters.ts
```

**2-3. AI Classifier (app/lib/cost-engine/ai-classifier/)**
```bash
# 전체 파일 읽기
cat ~/portal/app/lib/cost-engine/ai-classifier/claude-classifier.ts
cat ~/portal/app/lib/cost-engine/ai-classifier/vector-search.ts
cat ~/portal/app/lib/cost-engine/ai-classifier/product-mappings.ts
cat ~/portal/app/lib/cost-engine/ai-classifier/ai-classifier-wrapper.ts
cat ~/portal/app/lib/cost-engine/ai-classifier/confidence-score.ts
cat ~/portal/app/lib/cost-engine/ai-classifier/audit-trail.ts
cat ~/portal/app/lib/cost-engine/ai-classifier/description-validator.ts
cat ~/portal/app/lib/cost-engine/ai-classifier/index.ts
```

**2-4. HS Code 관련 (app/lib/cost-engine/hs-code/)**
```bash
ls -la ~/portal/app/lib/cost-engine/hs-code/
# 안의 모든 .ts 파일 전부 읽기
find ~/portal/app/lib/cost-engine/hs-code -name "*.ts" -exec cat {} \;
```

**2-5. DB 레이어 (app/lib/cost-engine/db/)**
```bash
ls -la ~/portal/app/lib/cost-engine/db/
# 안의 모든 .ts 파일 전부 읽기
find ~/portal/app/lib/cost-engine/db -name "*.ts" -exec cat {} \;
```

**2-6. Tariff API (app/lib/cost-engine/tariff-api/)**
```bash
ls -la ~/portal/app/lib/cost-engine/tariff-api/
find ~/portal/app/lib/cost-engine/tariff-api -name "*.ts" -exec cat {} \;
```

**2-7. Screening & Restrictions**
```bash
find ~/portal/app/lib/cost-engine/screening -name "*.ts" -exec cat {} \;
find ~/portal/app/lib/cost-engine/restrictions -name "*.ts" -exec cat {} \;
```

**2-8. Monitoring & Notifications**
```bash
find ~/portal/app/lib/monitoring -name "*.ts" -exec cat {} \;
find ~/portal/app/lib/notifications -name "*.ts" -exec cat {} \;
```

**2-9. API Auth & Billing**
```bash
find ~/portal/app/lib/api-auth -name "*.ts" -exec cat {} \;
find ~/portal/app/lib/billing -name "*.ts" -exec cat {} \;
```

**2-10. 페이지 컴포넌트 핵심**
```bash
cat ~/portal/app/page.tsx
cat ~/portal/app/layout.tsx
cat ~/portal/app/dashboard/DashboardContent.tsx
cat ~/portal/app/pricing/page.tsx
cat ~/portal/app/developers/page.tsx
cat ~/portal/components/layout/Header.tsx
cat ~/portal/components/layout/Footer.tsx
```

**2-11. Middleware & Config**
```bash
cat ~/portal/middleware.ts
cat ~/portal/vercel.json
cat ~/portal/next.config.ts
cat ~/portal/package.json
cat ~/portal/.env.local
```

**2-12. MCP Server**
```bash
cat ~/portal/mcp-server/src/index.ts 2>/dev/null || find ~/portal/mcp-server/src -name "*.ts" -exec cat {} \;
cat ~/portal/mcp-server/package.json
cat ~/portal/mcp-server/server.json
cat ~/portal/mcp-server/registry-metadata.json
```

**2-13. Shopify Extension**
```bash
cat ~/portal/extensions/potal-widget/shopify.extension.toml
find ~/portal/extensions/potal-widget -name "*.liquid" -exec echo "--- {} ---" \; -exec cat {} \;
```

**2-14. Plugins (WooCommerce, BigCommerce, Magento)**
```bash
cat ~/portal/plugins/woocommerce/potal-landed-cost/potal-landed-cost.php
cat ~/portal/plugins/bigcommerce/potal-widget-installer.js
find ~/portal/plugins/magento -name "*.php" -exec echo "--- {} ---" \; -exec cat {} \;
```

**2-15. AI Agents**
```bash
cat ~/portal/ai-agents/custom-gpt/gpt-instructions.md
cat ~/portal/ai-agents/custom-gpt/openapi-gpt-actions.json
cat ~/portal/ai-agents/gemini-gem/gem-instructions.md
cat ~/portal/ai-agents/meta-ai/ai-studio-instructions.md
cat ~/portal/ai-agents/B2B_OUTREACH_TARGETS.md
cat ~/portal/ai-agents/LLM_COMMERCE_INTEGRATION_ANALYSIS.md
```

**2-16. Supabase Migrations 전부**
```bash
# 파일명 목록
ls -la ~/portal/supabase/migrations/
# 017 이후 마이그레이션만 읽기 (007~009는 너무 큼, 스킵)
for f in ~/portal/supabase/migrations/01[0-9]*.sql ~/portal/supabase/migrations/02*.sql ~/portal/supabase/migrations/03*.sql; do
  echo "=== $(basename $f) ==="
  cat "$f"
  echo ""
done
```

**2-17. Scripts 전부**
```bash
# Python 스크립트
find ~/portal/scripts -name "*.py" -exec echo "=== {} ===" \; -exec cat {} \;
# TypeScript 스크립트
find ~/portal/scripts -name "*.ts" -exec echo "=== {} ===" \; -exec cat {} \;
```

**2-18. Tests**
```bash
find ~/portal/__tests__ -name "*.ts" -exec echo "=== {} ===" \; -exec cat {} \;
```

**2-19. Cron Jobs (app/api/cron/)**
```bash
find ~/portal/app/api/cron -name "route.ts" -exec echo "=== {} ===" \; -exec cat {} \;
```

### Phase 3: 외장하드 스캔

```bash
# 3-1. 외장하드 POTAL 폴더 전체 구조
ls -la /Volumes/soulmaten/POTAL/ 2>/dev/null
# 있으면 아래도 실행:
find /Volumes/soulmaten/POTAL -type d | head -50
find /Volumes/soulmaten/POTAL -type f | wc -l

# 3-2. regulations 폴더 상세
ls -laR /Volumes/soulmaten/POTAL/regulations/ 2>/dev/null | head -100
# 각 소스별 파일 수와 용량
du -sh /Volumes/soulmaten/POTAL/regulations/*/ 2>/dev/null

# 3-3. hs-bulk 폴더 상세
ls -laR /Volumes/soulmaten/POTAL/hs-bulk/ 2>/dev/null | head -50

# 3-4. wdc-products 폴더 상세
ls -la /Volumes/soulmaten/POTAL/wdc-products/ 2>/dev/null | head -20
du -sh /Volumes/soulmaten/POTAL/wdc-products/ 2>/dev/null

# 3-5. COLLECTION_LOG.md 읽기
cat /Volumes/soulmaten/POTAL/regulations/COLLECTION_LOG.md 2>/dev/null
```

### Phase 4: Supabase DB 실제 행수 확인

```bash
# 모든 주요 테이블 행수 한번에 확인
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_97aa957c65b6b22e65018e0a3e5039dc8c5d5cfd" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT
    (SELECT count(*) FROM countries) as countries,
    (SELECT count(*) FROM vat_gst_rates) as vat_gst_rates,
    (SELECT count(*) FROM de_minimis_thresholds) as de_minimis,
    (SELECT count(*) FROM customs_fees) as customs_fees,
    (SELECT count(*) FROM macmap_trade_agreements) as trade_agreements,
    (SELECT count(*) FROM macmap_ntlc_rates) as ntlc_rates,
    (SELECT count(*) FROM trade_remedy_cases) as remedy_cases,
    (SELECT count(*) FROM trade_remedy_products) as remedy_products,
    (SELECT count(*) FROM trade_remedy_duties) as remedy_duties,
    (SELECT count(*) FROM safeguard_exemptions) as safeguard,
    (SELECT count(*) FROM hs_classification_vectors) as vectors,
    (SELECT count(*) FROM product_hs_mappings) as hs_mappings,
    (SELECT count(*) FROM gov_tariff_schedules) as gov_schedules,
    (SELECT count(*) FROM enterprise_leads) as enterprise_leads;"}'

# MIN/AGR 테이블 (별도 — 행수가 많아서)
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_97aa957c65b6b22e65018e0a3e5039dc8c5d5cfd" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT
    (SELECT count(*) FROM macmap_min_rates) as min_rates,
    (SELECT count(*) FROM macmap_agr_rates) as agr_rates;"}'

# precomputed 테이블
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_97aa957c65b6b22e65018e0a3e5039dc8c5d5cfd" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT
    (SELECT count(*) FROM precomputed_landed_costs) as precomputed_lc,
    (SELECT count(*) FROM precomputed_hs10_candidates) as hs10_candidates;"}'

# SDN/CSL 관련
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_97aa957c65b6b22e65018e0a3e5039dc8c5d5cfd" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT
    (SELECT count(*) FROM sdn_entries) as sdn_entries,
    (SELECT count(*) FROM sdn_aliases) as sdn_aliases,
    (SELECT count(*) FROM sdn_addresses) as sdn_addresses,
    (SELECT count(*) FROM sdn_ids) as sdn_ids,
    (SELECT count(*) FROM csl_entries) as csl_entries;"}'

# 전체 테이블 목록 (혹시 빠진 테이블 확인)
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_97aa957c65b6b22e65018e0a3e5039dc8c5d5cfd" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT tablename FROM pg_tables WHERE schemaname = '\''public'\'' ORDER BY tablename;"}'
```

### Phase 5: Vercel 배포 상태 확인

```bash
# 현재 배포된 Vercel 환경변수 목록 (값은 안 보임)
curl -s "https://api.vercel.com/v9/projects/potal/env" \
  -H "Authorization: Bearer vcp_JmhT3kWcLCnVqZrMqTNAGwVX7sUa0bnL" | python3 -c "
import sys, json
data = json.load(sys.stdin)
envs = data.get('envs', [])
print(f'총 환경변수: {len(envs)}개')
for e in sorted(envs, key=lambda x: x.get('key','')):
    print(f\"  {e.get('key')} ({e.get('target',[''])})\")
" 2>/dev/null || echo "Vercel API 접근 실패"

# Cron 설정 확인
cat ~/portal/vercel.json
```

### Phase 6: 빌드 테스트

```bash
cd ~/portal && npm run build 2>&1 | tail -30
```

### Phase 7: 리포트 생성

위에서 수집한 모든 정보를 기반으로 `docs/FULL_PROJECT_AUDIT.md` 파일을 생성해.

리포트 포맷:
```markdown
# POTAL 전체 프로젝트 감사 리포트
> 생성일: [날짜시간 KST]
> 감사 방법: 모든 파일 직접 읽기 + DB 실제 쿼리

## 1. 코드베이스 통계
- 총 파일 수: [N]
- 파일 유형별 분포: ...
- 코드 라인 수 추정: ...

## 2. API 엔드포인트 현황 (실제 확인)
| 경로 | 메서드 | 기능 | 상태 | 비고 |
각 route.ts를 실제로 읽고 정리

## 3. Cost Engine 분석
- GlobalCostEngine.ts: [라인수], [주요 함수], [import하는 모듈]
- 실제 동작 흐름 정리
- 누락되거나 깨진 import 있는지

## 4. AI Classifier 파이프라인
- 5단계 파이프라인 실제 코드 확인
- vector-search, product-mappings, claude-classifier 연결 상태

## 5. DB 테이블 현황 (실제 쿼리 결과)
| 테이블 | 문서 기록 | 실제 행수 | 차이 |
문서(CLAUDE.md)에 적힌 숫자 vs 실제 DB 쿼리 결과 비교

## 6. 외장하드 데이터
- regulations/ 폴더 실제 내용물
- hs-bulk/ 폴더 실제 내용물
- wdc-products/ 폴더 실제 내용물

## 7. Vercel 배포 상태
- 환경변수 목록
- Cron 설정
- 빌드 성공 여부

## 8. 문서 vs 실제 불일치 목록
CLAUDE.md, session-context.md에 적힌 내용 중
실제와 다른 부분을 전부 나열

## 9. 발견된 문제점
- 깨진 import / 존재하지 않는 파일 참조
- 빌드 에러
- 빈 폴더/미구현 파일
- 보안 이슈 (노출된 키 등)

## 10. 추천 액션
발견된 문제별 수정 방안
```

**절대 규칙:**
1. 파일을 실제로 읽지 않고 추측하지 마
2. DB 쿼리를 실제로 실행하고 결과를 기록해
3. "~인 것 같다", "~로 추정된다" 사용 금지. 확인한 것만 적어
4. 한 번에 하나의 Phase만 실행 (멀티태스킹 금지)
5. Phase 7 리포트는 반드시 생성해서 docs/FULL_PROJECT_AUDIT.md에 저장
6. 이 작업이 끝나면 리포트 파일 경로와 핵심 발견사항 3개를 알려줘
