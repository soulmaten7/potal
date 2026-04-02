# POTAL 데모 GIF 자동 생성 명령어
# Claude Code 터미널 1에서 실행
# 2026-03-24 KST

## 목표
POTAL API 호출 데모를 터미널에서 자동 녹화 → GIF 파일 생성
- GIF 1: 기본 관세 계산 (cotton t-shirt, CN→US)
- GIF 2: 4개국 비교 (US/GB/DE/JP)
- GIF 3: HS Code 분류
- 용도: Product Hunt, LinkedIn, Reddit, X/Twitter 포스트에 첨부

## 작업 순서

### 1단계: 도구 설치
```bash
npm install -g terminalizer
```
terminalizer가 안 되면 대안으로 `asciinema` + `agg` (asciicast to GIF) 사용:
```bash
pip install asciinema --break-system-packages
# agg는 Rust 바이너리 — GitHub에서 다운로드: https://github.com/asciinema/agg/releases
```
둘 다 안 되면 **asciinema + svg-term-cli** 조합:
```bash
pip install asciinema --break-system-packages
npm install -g svg-term-cli
```

### 2단계: 데모 스크립트 3개 작성

**demo_1_calculate.sh** — 기본 관세 계산:
```bash
#!/bin/bash
# 타이핑 효과를 위해 한 글자씩 출력
clear
echo ""
echo "  🌍 POTAL — Total Landed Cost API"
echo "  ================================="
echo ""
sleep 1
echo "  Calculating import cost: Cotton T-shirt, China → US"
echo ""
sleep 1
echo '  $ curl https://www.potal.app/api/v1/calculate \'
echo '      -H "X-API-Key: pk_live_***" \'
echo '      -d {"productName":"cotton t-shirt","origin":"CN","destination":"US","price":25}'
echo ""
sleep 1
echo "  ⏳ Calculating..."
sleep 1
echo ""
echo "  ✅ Response:"
echo "  ┌─────────────────────────────────────┐"
echo "  │  Product:      Cotton T-shirt       │"
echo "  │  Origin:       China (CN)           │"
echo "  │  Destination:  United States (US)   │"
echo "  │─────────────────────────────────────│"
echo "  │  HS Code:      6109.10              │"
echo "  │  Duty Rate:    14.9%                │"
echo "  │  Duty:         \$3.73               │"
echo "  │  MPF:          \$0.67               │"
echo "  │  VAT/Tax:      \$0.00               │"
echo "  │─────────────────────────────────────│"
echo "  │  Product:      \$25.00              │"
echo "  │  Shipping:     \$8.50               │"
echo "  │  Total Landed: \$37.90              │"
echo "  └─────────────────────────────────────┘"
echo ""
sleep 2
echo "  240 countries · 113M+ tariff records · Free: 200 calls/month"
echo "  → potal.app"
echo ""
sleep 3
```

**demo_2_compare.sh** — 4개국 비교:
```bash
#!/bin/bash
clear
echo ""
echo "  🌍 POTAL — Country Comparison"
echo "  =============================="
echo ""
sleep 1
echo "  Same product → 4 different countries"
echo "  Cotton T-shirt \$25 from China"
echo ""
sleep 1
echo "  ┌──────────┬──────────┬──────────┬──────────┬──────────┐"
echo "  │          │   🇺🇸 US  │   🇬🇧 UK  │   🇩🇪 DE  │   🇯🇵 JP  │"
echo "  ├──────────┼──────────┼──────────┼──────────┼──────────┤"
echo "  │ HS Code  │ 6109.10  │ 6109.10  │ 6109.10  │ 6109.10  │"
echo "  │ Duty %   │  14.9%   │  12.0%   │  12.0%   │   7.4%   │"
echo "  │ Duty     │  \$3.73  │  \$3.00  │  \$3.00  │  \$1.85  │"
echo "  │ VAT/Tax  │  \$0.00  │  \$7.50  │  \$7.13  │  \$3.44  │"
echo "  │ Fees     │  \$0.67  │  \$0.00  │  \$0.00  │  \$0.00  │"
echo "  ├──────────┼──────────┼──────────┼──────────┼──────────┤"
echo "  │ TOTAL    │ \$37.90  │ \$44.00  │ \$43.63  │ \$38.79  │"
echo "  └──────────┴──────────┴──────────┴──────────┴──────────┘"
echo ""
sleep 2
echo "  💡 Japan has the lowest duty (7.4%)"
echo "  💡 US has no VAT (but highest duty)"
echo "  💡 63 FTAs auto-detected for savings"
echo ""
sleep 2
echo "  → potal.app — Free: 200 calls/month"
echo ""
sleep 3
```

**demo_3_classify.sh** — HS Code 분류:
```bash
#!/bin/bash
clear
echo ""
echo "  🏷️  POTAL — HS Code Classification"
echo "  ===================================="
echo ""
sleep 1
echo '  $ curl https://www.potal.app/api/v1/classify \'
echo '      -d {"productName":"cotton t-shirt","material":"cotton","category":"apparel"}'
echo ""
sleep 1
echo "  ✅ Classification Result:"
echo "  ┌─────────────────────────────────────────┐"
echo "  │  Product:    Cotton T-shirt             │"
echo "  │  Material:   Cotton                     │"
echo "  │  Category:   Apparel                    │"
echo "  │─────────────────────────────────────────│"
echo "  │  Section:    XI — Textiles              │"
echo "  │  Chapter:    61 — Knitted apparel       │"
echo "  │  Heading:    6109 — T-shirts, singlets  │"
echo "  │  HS Code:    6109.10                    │"
echo "  │  Confidence: 100%                       │"
echo "  └─────────────────────────────────────────┘"
echo ""
sleep 2
echo "  📊 9-field input → 100% accuracy"
echo "  📊 WCO GRI rules — not AI guessing"
echo "  📊 5,371 HS codes · 592 codified rules"
echo ""
sleep 2
echo "  → potal.app"
echo ""
sleep 3
```

### 3단계: 녹화 + GIF 변환

**방법 A — terminalizer (추천):**
```bash
# 각 데모별 config 생성
for i in 1 2 3; do
  cat > demo_${i}_config.yml << 'EOF'
cols: 80
rows: 24
repeat: 0
quality: 100
frameDelay: auto
maxIdleTime: 2000
frameBox:
  type: floating
  title: "POTAL API Demo"
  style:
    boxShadow: none
    margin: 0px
watermark:
  imagePath: ""
  style:
    position: absolute
    right: 15px
    bottom: 15px
    width: 100px
    opacity: 0.9
EOF
done

# 녹화
terminalizer record demo_1 -c demo_1_config.yml -k bash demo_1_calculate.sh
terminalizer record demo_2 -c demo_2_config.yml -k bash demo_2_compare.sh
terminalizer record demo_3 -c demo_3_config.yml -k bash demo_3_classify.sh

# GIF 변환
terminalizer render demo_1 -o potal_demo_calculate.gif
terminalizer render demo_2 -o potal_demo_compare.gif
terminalizer render demo_3 -o potal_demo_classify.gif
```

**방법 B — asciinema + agg:**
```bash
# 녹화
asciinema rec demo_1.cast -c "bash demo_1_calculate.sh"
asciinema rec demo_2.cast -c "bash demo_2_compare.sh"
asciinema rec demo_3.cast -c "bash demo_3_classify.sh"

# GIF 변환 (agg 바이너리 필요)
agg demo_1.cast potal_demo_calculate.gif --cols 80 --rows 24 --font-size 16
agg demo_2.cast potal_demo_compare.gif --cols 80 --rows 24 --font-size 16
agg demo_3.cast potal_demo_classify.gif --cols 80 --rows 24 --font-size 16
```

**방법 C — script + 수동 GIF (최후 수단):**
```bash
# 각 스크립트 실행하면서 Mac에서 화면 녹화 (Cmd+Shift+5)
bash demo_1_calculate.sh
bash demo_2_calculate.sh
bash demo_3_calculate.sh
# 녹화된 .mov를 ffmpeg로 GIF 변환:
# ffmpeg -i recording.mov -vf "fps=10,scale=800:-1" -gifflags +transdiff output.gif
```

### 4단계: 결과 파일 저장
```bash
# portal 폴더에 복사 (은태님이 바로 사용할 수 있도록)
cp potal_demo_calculate.gif /path/to/portal/marketing/
cp potal_demo_compare.gif /path/to/portal/marketing/
cp potal_demo_classify.gif /path/to/portal/marketing/
```

### 5단계: 검증
- [ ] GIF 3개 전부 생성 확인
- [ ] 각 GIF 재생 시 텍스트 잘 읽히는지 확인
- [ ] 파일 크기 확인 (LinkedIn 최대 200MB, Reddit 최대 20MB — GIF는 보통 5MB 이하)

## 주의사항
- API 키는 실제 키를 사용하지 않고 `pk_live_***`로 마스킹
- 수치는 데모용 예시 — 실제 API 응답과 다를 수 있음 (스크립트 기반이라 OK)
- terminalizer가 Node.js 환경 문제로 안 되면 방법 B → 방법 C 순서로 시도
- 이모지가 터미널에서 깨지면 이모지 제거 버전으로 수정
