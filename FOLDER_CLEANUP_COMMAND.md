# POTAL 폴더 구조 대청소 — Claude Code 실행 명령어
# 2026-04-03 작성
# 터미널1 (Opus)에서 실행

## 목표
루트에 흩어진 40+ 엑셀, 오래된 MD, 중복 파일들을 정리해서
CLAUDE.md에 정의된 깔끔한 구조로 만들기.

## 목표 구조
```
potal/
├── app/                    ← 코드 (건드리지 않음)
├── components/             ← 코드 (건드리지 않음)
├── utils/                  ← 코드 (건드리지 않음)
├── scripts/                ← 스크립트 (건드리지 않음)
├── __tests__/              ← 테스트 (건드리지 않음)
├── extensions/             ← Shopify 위젯 (건드리지 않음)
├── plugins/                ← WooCommerce/BigCommerce/Magento (건드리지 않음)
├── sdk/                    ← SDK (건드리지 않음)
├── mcp-server/             ← MCP 서버 (건드리지 않음)
├── supabase/               ← Supabase (건드리지 않음)
├── public/                 ← 정적 파일 (건드리지 않음)
├── data/                   ← tariff-research, regulations 등 실사용 데이터
├── ai-agents/              ← GPT/Gemini/Meta AI 에이전트 설정
├── marketing/              ← 데모 영상, 스크린샷, Product Hunt, 피치덱
│   ├── POTAL Demo/         ← 데모 영상 MOV 파일들
│   ├── STEP 1-screen shot/ ← 캡처 스크린샷
│   ├── product-hunt-assets/ ← PH 갤러리 이미지
│   ├── gifs/               ← 데모 GIF 파일들
│   └── enterprise/         ← Capability Deck, Requirements PDF
├── content/                ← 콘텐츠 제작 참고 파일
│   ├── demo-scripts/
│   ├── recordings/
│   ├── social-media/
│   └── thumbnails/
├── docs/                   ← Claude Code용 문서 (기존 유지)
├── archive/                ← 과거 기록 (기존 + 루트에서 이동)
│   ├── commands/           ← (기존)
│   ├── benchmarks/         ← (기존)
│   ├── audits/             ← (기존)
│   ├── cold-email/         ← (기존)
│   ├── spreadsheets/       ← 루트 엑셀 40+개 이동
│   ├── old-docs/           ← 안쓰는 MD 파일 이동
│   ├── html-charts/        ← AI Agent Org HTML 차트
│   ├── logs/               ← import 로그, progress JSON
│   ├── scripts/            ← import python 스크립트
│   ├── plugins-dist/       ← 배포용 ZIP 파일
│   └── google-drive-sync/  ← POTAL_Google_Drive 폴더 이동
├── CLAUDE.md               ← 프로젝트 설정
├── CHANGELOG.md            ← 변경 기록
├── session-context.md      ← 세션 컨텍스트
├── README.md               ← 프로젝트 소개
└── (코드 설정 파일들: package.json, tsconfig.json 등)
```

## 실행 명령어

아래 내용을 Claude Code 터미널1에 그대로 붙여넣기:

```
potal 폴더 구조를 대청소해줘. 아래 단계를 순서대로 실행해.
빌드 깨지지 않게 주의하고, git mv를 사용해서 히스토리 보존해줘.
각 단계 완료 후 상태를 알려줘.

## STEP 0: 삭제 (쓸모없는 파일)
- portal/ 폴더 전체 삭제 (create-next-app 빈 템플릿, 안 씀)
- .~lock.*.xlsx# 파일 6개 전부 삭제 (LibreOffice 락 파일)
- 루트의 .DS_Store 삭제

## STEP 1: archive/ 하위 폴더 생성
mkdir -p archive/spreadsheets
mkdir -p archive/old-docs
mkdir -p archive/html-charts
mkdir -p archive/logs
mkdir -p archive/scripts
mkdir -p archive/plugins-dist
mkdir -p archive/google-drive-sync
mkdir -p marketing/gifs
mkdir -p marketing/enterprise

## STEP 2: 루트 엑셀 → archive/spreadsheets/ 이동
git mv로 아래 파일들 전부 이동:
- POTAL_107_Feature_Audit.xlsx
- POTAL_125K_Codification_Final.xlsx
- POTAL_12Area_Code_Audit.xlsx
- POTAL_142_Full_Audit_Result.xlsx
- POTAL_240_Customs_Fields_Raw.xlsx
- POTAL_35Issue_Complete_Fix.xlsx
- POTAL_46Issue_Fix_Log.xlsx
- POTAL_58_Feature_Test_Result.xlsx
- POTAL_6digit_vs_7Country_Verification.xlsx
- POTAL_7Country_Codification.xlsx
- POTAL_7Country_Codification_v5.xlsx
- POTAL_7Country_HS_Rules_Summary.xlsx
- POTAL_7Country_Tariff_Collection.xlsx
- POTAL_AI_Agent_Org_Log.xlsx
- POTAL_B2B_Channel_Strategy.xlsx
- POTAL_Claude_Code_Work_Log.xlsx (폐지된 엑셀 로그)
- POTAL_Cowork_Session_Log.xlsx (폐지된 엑셀 로그)
- POTAL_CrossBorder_Marketing_10Countries.xlsx
- POTAL_CrossBorder_Target_Strategy.xlsx
- POTAL_D9_Customer_Acquisition.xlsx (Notion으로 이전됨)
- POTAL_D10_Revenue_Billing.xlsx (Notion으로 이전됨)
- POTAL_D12_Marketing_Partnerships.xlsx (Notion으로 이전됨)
- POTAL_D14_Finance_Tracker.xlsx (Notion으로 이전됨)
- POTAL_D15_Intelligence_Market.xlsx (Notion으로 이전됨)
- POTAL_DEEP_AUDIT_56_RESULT.xlsx
- POTAL_DutyRate_Data_Audit.xlsx
- POTAL_Excel_Master_Registry.xlsx
- POTAL_F_FEATURE_AUDIT_RESULT.xlsx
- POTAL_Feature_Audit_2603290000.xlsx
- POTAL_Feature_Health_Check.xlsx
- POTAL_Feature_Verification_147.xlsx
- POTAL_Layer1_Category_Upgrade.xlsx
- POTAL_Layer2_V7_Intersection.xlsx
- POTAL_MVP_Launch_Checklist.xlsx
- POTAL_Platform_Product_Fields_Raw.xlsx
- POTAL_Pricing_Strategy_Analysis.xlsx
- POTAL_SNS_Content_Playbook.xlsx
- POTAL_Sprint_Priority_List.xlsx
- POTAL_TLC_Verification.xlsx
- POTAL_User_Acquisition_Strategy.xlsx
- POTAL_V3_Codified_Data_Audit.xlsx
- POTAL_V3_REVIEW56_Verification.xlsx
- POTAL_V3_Step4_Deep_Analysis.xlsx
- POTAL_V3_US_HS10_Verification.xlsx
- POTAL_V6_Category_Error_Analysis.xlsx
- POTAL_V6_Detail_Check.xlsx
- POTAL_V6_Pattern_E_Deep.xlsx
- Step3_Synonym_Dict_Result.xlsx

## STEP 3: 루트 오래된 MD → archive/old-docs/ 이동
git mv로 이동:
- ALL_AREAS_DEEP_REVIEW_RESULT.md → archive/old-docs/
- LINKEDIN_UPDATE_B2B.md → archive/old-docs/
- MARKETING_SUMMARY.md → archive/old-docs/
- NEXT_SESSION_START.md → archive/old-docs/
- POTAL_DEMO_VIDEO_GUIDE.md → archive/old-docs/
- POTAL_PRODUCT_HUNT_LAUNCH_PLAN.md → archive/old-docs/
- POTAL_SESSION_BOOT_SEQUENCE.md → archive/old-docs/
- Marketplace_Registration_Guide.md → archive/old-docs/
- SECURITY_FIX_RLS.sql → archive/old-docs/

## STEP 4: 루트 HTML → archive/html-charts/ 이동
git mv로 이동:
- POTAL_AI_Agent_Org_v6.html → archive/html-charts/

## STEP 5: 루트 PDF → marketing/enterprise/ 이동
git mv로 이동:
- POTAL_Capability_Deck.pdf → marketing/enterprise/
- POTAL_Capability_Deck_KR.pdf → marketing/enterprise/
- POTAL_Requirements_Questionnaire.pdf → marketing/enterprise/
- POTAL_Requirements_Questionnaire_KR.pdf → marketing/enterprise/
- W-8BEN_Form.pdf → archive/old-docs/

## STEP 6: 루트 GIF → marketing/gifs/ 이동 (중복 확인 후)
루트에 있는 GIF 3개가 marketing/ 안에도 이미 있으면 루트 것만 삭제.
없으면 git mv로 marketing/gifs/로 이동:
- potal_demo_calculate.gif
- potal_demo_classify.gif
- potal_demo_compare.gif

## STEP 7: 루트 ZIP → archive/plugins-dist/ 이동
git mv로 이동:
- potal-landed-cost.zip → archive/plugins-dist/
- potal-landed-cost-v2.zip → archive/plugins-dist/
- potal-landed-cost-v3.zip → archive/plugins-dist/
- potal-magento-1.0.0.zip → archive/plugins-dist/

## STEP 8: 루트 로그/진행 파일 → archive/logs/ 이동
git mv로 이동:
- agr_import_progress.json → archive/logs/
- min_import_progress.json → archive/logs/
- wdc_phase4_progress.json → archive/logs/

## STEP 9: 루트 Python 스크립트 → archive/scripts/ 이동
git mv로 이동:
- import_agr_all.py → archive/scripts/
- import_min_remaining.py → archive/scripts/

## STEP 10: 루트 CSV → data/ 이동
git mv로 이동:
- country-duty-reference-v2.csv → data/

## STEP 11: POTAL_Google_Drive/ → archive/google-drive-sync/ 이동
git mv로 이동:
- POTAL_Google_Drive/ 전체를 archive/google-drive-sync/으로 이동
  (대부분 다른 곳에 있는 파일의 복사본)

## STEP 12: analysis/ → archive/ 이동
git mv로 이동:
- analysis/ 전체를 archive/analysis/로 이동
  (과거 분석 엑셀/문서 — 더 이상 활발히 안 씀)

## STEP 13: checklists/ → archive/ 이동
git mv로 이동:
- checklists/ 전체를 archive/checklists/로 이동

## STEP 14: accuracy-benchmark/ → archive/ 이동
git mv로 이동:
- accuracy-benchmark/ 전체를 archive/accuracy-benchmark/로 이동

## STEP 15: test-results/ → archive/ 이동
test-results/ 폴더가 있으면 archive/test-results/로 이동

## STEP 16: .skill 파일 정리
enterprise-proposal.skill, morning-briefing.skill 파일이 루트에 있으면
.claude/skills/ 아래에 이미 같은 내용이 있는지 확인.
중복이면 루트 것 삭제. 아니면 그대로 두기.

## STEP 17: .gitignore 업데이트
.gitignore에 아래 추가:
.DS_Store
.~lock.*
*.~lock.*

## STEP 18: 빌드 확인
npm run build 실행해서 빌드 깨지지 않는지 확인.
코드 파일은 안 건드렸으니 깨질 리 없지만, 혹시 모르니 확인.

## STEP 19: 문서 업데이트
CLAUDE.md 헤더 날짜 업데이트:
"CW22-O: 폴더 구조 대청소 — 루트 48+ 파일 정리, archive 구조화"

CHANGELOG.md 최상단에 추가:
"2026-04-03 (시간) — 폴더 구조 대청소:
루트 엑셀 48개 → archive/spreadsheets/,
오래된 MD 9개 → archive/old-docs/,
PDF → marketing/enterprise/,
ZIP → archive/plugins-dist/,
portal/ 삭제, analysis/ checklists/ 등 → archive/"

## STEP 20: git commit
git add -A && git commit -m "refactor: 폴더 구조 대청소 — 루트 60+ 파일 정리 및 archive 구조화"

완료 후 `ls` 로 루트에 남은 파일 목록을 보여줘.
루트에는 코드 설정 파일 + CLAUDE.md + CHANGELOG.md + session-context.md + README.md만 있어야 해.
```
