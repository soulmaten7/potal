# CW26 Sprint 4 — 내 조합 저장 + 공유 구현 명령어

> 용도: Claude Code Opus 터미널1에 이 문서 경로를 알려주고 "이거대로 진행해줘"라고 하면 됨
> 작성: 2026-04-10 KST (CW25 세션)
> 선행 조건: Sprint 1~3 완료 (CustomBuilder 141 features + LiveCodeAssembler 프로덕션 배포됨)
> 스펙 원본: `docs/HOMEPAGE_REDESIGN_SPEC.md` 335~428행 (결정 5-2 + Supabase 스키마)

---

## 📋 복사해서 Claude Code에 바로 붙여넣기

```
CW26 Sprint 4를 진행해줘. 먼저 docs/HOMEPAGE_REDESIGN_SPEC.md의 335~428행(결정 5-2: 내 조합 리스트 + Supabase 스키마)을 읽고, 그 다음 docs/CW26_SPRINT4_COMMAND.md의 작업 지시를 순서대로 실행해. 절대 규칙 #1 (B2C 코드 수정 금지), #2 (build 확인 후 push), #4 (console.log 금지) 반드시 준수. 완료되면 4개 문서(CLAUDE.md, CHANGELOG.md, session-context.md, NEXT_SESSION_START.md) 날짜 동기화하고 git push까지 해줘.
```

---

## 🎯 Sprint 4 목표

CustomBuilder 하단의 "Save this combo (Sprint 4 · CW26)" placeholder 버튼을 실제 동작하게 만들고, 저장된 조합을 리스트로 보여주고, 공유 URL로 바이럴 루프를 만드는 것.

---

## 📐 작업 순서 (반드시 이 순서대로)

### Step 1: Supabase 마이그레이션

파일: `supabase/migrations/058_user_combos.sql` (신규)

```sql
-- Sprint 4: user_combos table for CUSTOM builder saved combinations
CREATE TABLE IF NOT EXISTS user_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  selected_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  share_slug TEXT UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_combos_user_id ON user_combos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_combos_share_slug ON user_combos(share_slug) WHERE share_slug IS NOT NULL;

-- RLS
ALTER TABLE user_combos ENABLE ROW LEVEL SECURITY;

-- 자기 조합 CRUD
CREATE POLICY "Users manage own combos" ON user_combos
  FOR ALL USING (user_id = auth.uid());

-- 공개 조합 읽기 (공유 URL 접근용)
CREATE POLICY "Public combos readable" ON user_combos
  FOR SELECT USING (is_public = TRUE);
```

⚠️ **이 SQL은 파일만 생성**. 실제 Supabase에 적용하는 것은 은태님이 수동으로 할 수 있도록 `supabase/migrations/` 폴더에만 넣어두기. 자동 실행 금지.

---

### Step 2: Supabase 클라이언트 유틸리티

파일: `lib/custom/combo-storage.ts` (신규)

**역할**: user_combos 테이블 CRUD를 프론트엔드/서버에서 호출하는 함수 모음

**기존 Supabase 클라이언트 참조**: `utils/supabase/server.ts`의 `createServerSupabaseClient`

**타입 정의**:
```ts
export interface UserCombo {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  selected_features: string[];  // slug 배열
  is_favorite: boolean;
  use_count: number;
  share_slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
```

**함수 목록**:
- `listCombos(userId: string)` → `UserCombo[]` (최근순, 즐겨찾기 우선)
- `getComboById(id: string)` → `UserCombo | null`
- `getComboBySlug(slug: string)` → `UserCombo | null` (공유 URL용, is_public=true만)
- `createCombo(userId: string, name: string, features: string[], description?: string)` → `UserCombo`
- `updateCombo(id: string, updates: Partial<Pick<UserCombo, 'name' | 'description' | 'selected_features' | 'is_favorite'>>)` → `UserCombo`
- `deleteCombo(id: string)` → `void`
- `duplicateCombo(id: string, userId: string)` → `UserCombo` (이름에 " (copy)" 붙임)
- `generateShareSlug(id: string, comboName: string)` → `string` (slug = slugify(name) + 짧은 random suffix)
- `incrementUseCount(id: string)` → `void`

**Supabase 클라이언트 생성**:
- API Route에서는 `createServerSupabaseClient`(utils/supabase/server.ts) 사용
- combo-storage.ts 자체는 순수 함수만 export — Supabase client는 인자로 받음
- 시그니처 예시: `listCombos(supabase: SupabaseClient, userId: string)`

---

### Step 3: API Routes

#### 3-1. `app/api/combos/route.ts` (신규) — CRUD

**GET** `/api/combos`
- 인증 필수 (Authorization header 또는 Supabase session)
- 쿼리 파라미터: `?sort=recent|popular|name|favorite` (기본: recent)
- 쿼리 파라미터: `?q=검색어` (이름 또는 기능명 필터)
- 응답: `{ success: true, data: UserCombo[] }`
- 비인증 시: `{ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } }` (401)

**POST** `/api/combos`
- 인증 필수
- body: `{ name: string, selected_features: string[], description?: string }`
- 검증: name 비어있으면 400, selected_features 비어있으면 400
- 응답: `{ success: true, data: UserCombo }` (201)

**PATCH** `/api/combos`
- body: `{ id: string, ...updates }`
- 응답: `{ success: true, data: UserCombo }`

**DELETE** `/api/combos`
- body: `{ id: string }`
- ⚠️ 소프트 삭제 아님, 실제 삭제
- 응답: `{ success: true }`

#### 3-2. `app/api/combos/[id]/share/route.ts` (신규) — 공유 URL 생성

**POST** `/api/combos/{id}/share`
- 인증 필수
- 동작: share_slug 생성 + is_public=true 설정
- 응답: `{ success: true, data: { share_url: 'https://potal.app/combos/{slug}', slug: '...' } }`

**DELETE** `/api/combos/{id}/share`
- 동작: is_public=false + share_slug=null
- 응답: `{ success: true }`

#### 3-3. `app/api/combos/[id]/duplicate/route.ts` (신규) — 복제

**POST** `/api/combos/{id}/duplicate`
- 인증 필수
- 응답: `{ success: true, data: UserCombo }` (새 조합, 이름에 " (copy)" 붙음)

---

### Step 4: 공유 URL 페이지

파일: `app/combos/[slug]/page.tsx` (신규)

**역할**: `potal.app/combos/etsy-korea-export` 같은 공유 URL 접근 시 해당 조합을 CUSTOM 빌더에 자동 로드

**동작**:
1. slug로 `getComboBySlug()` 조회 (is_public=true인 것만)
2. 조합이 존재하면 → CUSTOM 빌더 + 해당 features 미리 선택된 상태로 렌더
3. 조합이 없으면 → 404 페이지 ("이 조합을 찾을 수 없습니다. CUSTOM 빌더에서 직접 만들어보세요" + CUSTOM 링크)
4. 로그인 상태라면 "이 조합 저장하기" 버튼 활성화
5. 비로그인이라면 버튼 클릭 시 "로그인하면 저장할 수 있어요" 안내

**SEO**: `generateMetadata()` 로 조합 이름 + 포함 기능 목록을 `<title>` + `<meta description>`에 포함

---

### Step 5: UI 컴포넌트 3개

#### 5-1. `components/custom/MySavedCombos.tsx` (신규)

**역할**: CUSTOM 빌더 하단에 위치하는 "내 조합" 리스트 섹션

**레이아웃** (스펙 339~356행):
```
┌────── 📚 My Saved Combinations ──────┐
│                                      │
│  🔍 [검색...]   [최근순 ▾]  [+ 새 조합] │
│                                      │
│  ⭐ Etsy 수출 세팅   3일 전  12번 사용   │
│     HS + Cost + Doc  [공유][복제][삭제]  │
│                                      │
│  ⭐ 독일 B2B 검토    1주 전   3번 사용   │
│     ...                              │
│                                      │
│  [+ 더 보기 (32개)]                    │
└──────────────────────────────────────┘
```

**상태에 따른 분기**:
- **비로그인**: 이 섹션 전체 숨김 (또는 "로그인하면 조합을 저장할 수 있어요" 1줄 안내)
- **로그인 + 조합 0개 (Empty State)**: "📚 내 조합" 대신 **"💡 추천 템플릿"** 크게 표시
- **로그인 + 조합 1개 이상 (Active State)**: "내 조합" 리스트 + 상단에 추천 템플릿 작은 배너 (1줄 가로 스크롤)

**props**: `{ onLoadCombo: (features: string[]) => void }` — 조합 클릭 시 위쪽 CUSTOM 빌더에 해당 features 로드

**검색/정렬**:
- 검색: 조합 이름 + 포함된 기능 이름 필터링 (프론트 필터링)
- 정렬: 드롭다운 — 최근순 / 사용 많은 순 / 이름순 / 즐겨찾기 우선
- 기본 정렬: 즐겨찾기 우선 → 최근순

**데이터 로딩**: `useEffect`에서 `/api/combos` GET 호출. SWR/react-query 도입 금지 — 순수 `useState` + `fetch`

**기본 표시 개수**: 5개. [+ 더 보기 (N개)] 버튼으로 전체 확장

#### 5-2. `components/custom/ComboListItem.tsx` (신규)

**역할**: MySavedCombos 안의 개별 조합 1줄 아이템

**필드** (스펙 359~368행):
- ⭐ 즐겨찾기 토글 (클릭 시 PATCH /api/combos → is_favorite 토글)
- 조합 이름 (클릭 시 `onLoadCombo` 호출 → 위쪽 CUSTOM에 즉시 로드)
- 포함 기능 요약 (slug 배열에서 상위 3개만 짧게 "HS + Cost + Doc" 형태)
- 상대 시간 (date-fns 또는 수동 구현 — 외부 라이브러리 추가 금지. 수동 구현)
- 사용 횟수 ("12번 사용")
- 액션 버튼:
  - **[공유]**: POST /api/combos/{id}/share → 클립보드에 공유 URL 복사 + toast "Copied!"
  - **[복제]**: POST /api/combos/{id}/duplicate → 리스트에 새 항목 추가
  - **[삭제]**: 확인 모달("정말 삭제하시겠습니까?") → DELETE /api/combos
  - **[···]** 더보기 메뉴: "이름 바꾸기" / "내보내기(JSON)" (Sprint 4 범위. Make 연결 / 팀 공유는 후속)

**스타일**: 카드가 아닌 1줄 리스트 (스펙: "왜 '카드'가 아니라 '리스트'인가" 739~745행 참조)

#### 5-3. `components/custom/RecommendedTemplates.tsx` (신규)

**역할**: POTAL 큐레이션 템플릿 표시

**템플릿 데이터** (하드코딩, DB 아님):
```ts
const TEMPLATES = [
  {
    name: 'Etsy Seller Starter',
    description: 'HS classification + landed cost + restriction check',
    features: ['hs_classifier', 'landed_cost_calculator', 'import_restriction_check'],
  },
  {
    name: 'EU Export Kit',
    description: 'FTA lookup + landed cost + commercial invoice',
    features: ['fta_lookup', 'landed_cost_calculator', 'commercial_invoice_generator'],
  },
  {
    name: 'US B2B Import',
    description: 'HS + denied party screening + landed cost + US nexus',
    features: ['hs_classifier', 'denied_party_screening', 'landed_cost_calculator', 'us_nexus_check'],
  },
  {
    name: 'Dangerous Goods Export',
    description: 'HS + restriction + ECCN + export declaration',
    features: ['hs_classifier', 'import_restriction_check', 'eccn_classifier', 'export_declaration_generator'],
  },
  {
    name: 'Quick Country Compare',
    description: 'Compare landed costs across multiple destinations',
    features: ['landed_cost_calculator', 'country_comparison', 'fta_lookup'],
  },
];
```

**Empty State**: 5개 템플릿을 카드 형태로 크게 표시. 클릭 시 `onLoadCombo(template.features)` 호출
**Active State**: 1줄 가로 스크롤 (pill/chip 스타일). 클릭 시 동일

---

### Step 6: CustomBuilder 통합

**수정 파일**: `components/custom/CustomBuilder.tsx`

**변경 사항**:
1. "Save this combo" placeholder 버튼을 실제 동작하는 저장 버튼으로 교체
   - 비로그인: 클릭 시 "로그인하면 저장할 수 있어요" 모달 (간단한 alert 또는 인라인 메시지)
   - 로그인: 클릭 시 이름 입력 모달 → POST /api/combos → 성공 시 MySavedCombos 리프레시
2. CustomBuilder 하단에 `<MySavedCombos onLoadCombo={handleLoadCombo} />` 추가
3. `handleLoadCombo(features: string[])` 함수 추가 — `setSelected(new Set(features))` 로 체크박스 상태 업데이트
4. 로그인 상태 확인: Supabase `auth.getSession()` 또는 기존 인증 hook 사용

**인증 상태 확인 방법**:
- 기존 프로젝트에 auth hook이 있으면 그거 사용
- 없으면 `utils/supabase/` 기반으로 간단한 `useAuth()` hook 생성
  ```ts
  // lib/auth/use-auth.ts
  export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => { /* supabase.auth.getSession() */ }, []);
    return { user, isLoggedIn: !!user };
  }
  ```

---

### Step 7: 이름 입력 모달

파일: `components/custom/SaveComboModal.tsx` (신규)

**트리거**: "Save this combo" 버튼 클릭 (로그인 상태)
**레이아웃**:
```
┌─── Save your combination ───┐
│                             │
│  Name: [________________]   │
│  (선택) Description:         │
│  [________________________] │
│                             │
│  [Cancel]    [Save combo]   │
└─────────────────────────────┘
```
- `role="dialog"` `aria-modal="true"`
- ESC + 바깥 클릭 + X 버튼으로 닫기
- Save 클릭 → POST /api/combos → 성공 시 모달 닫기 + MySavedCombos 리프레시 + toast "Saved!"
- Name 빈칸이면 Save 버튼 비활성화

---

## 🎨 스타일 가이드 (Sprint 1~3과 일관성)

- 색상: `#02122c` (네이비), `#F59E0B` (앰버), `slate-200` (보더)
- MySavedCombos 섹션: `mt-12` (CustomBuilder 하단과 간격)
- ComboListItem: `py-3 border-b border-slate-100` (1줄 리스트)
- 즐겨찾기 별: 기본 `text-slate-300`, 활성 `text-[#F59E0B]`
- 액션 버튼: `text-[12px] text-slate-500 hover:text-[#02122c]`
- 추천 템플릿 카드 (Empty): `rounded-xl border-2 border-dashed border-slate-300 p-6 hover:border-[#F59E0B]`
- 추천 템플릿 pill (Active): `px-3 py-1.5 rounded-full bg-slate-100 text-[12px] hover:bg-amber-100`
- toast: 화면 하단 중앙, 3초 후 자동 사라짐, `bg-[#02122c] text-white rounded-lg px-4 py-2`

---

## ✅ 완료 검증 체크리스트

- [ ] `npm run build` 성공
- [ ] TypeScript 타입 에러 없음
- [ ] 프로덕션 코드에 `console.log` 없음
- [ ] `supabase/migrations/058_user_combos.sql` 파일 생성됨 (자동 실행 아님)
- [ ] `/api/combos` GET/POST/PATCH/DELETE 전부 구현됨
- [ ] `/api/combos/[id]/share` POST/DELETE 구현됨
- [ ] `/api/combos/[id]/duplicate` POST 구현됨
- [ ] `app/combos/[slug]/page.tsx` 공유 URL 페이지 구현됨
- [ ] CustomBuilder "Save this combo" 버튼이 실제 동작함 (비로그인 시 안내 메시지, 로그인 시 저장 모달)
- [ ] MySavedCombos에서 조합 클릭 → CUSTOM 빌더에 features 로드됨
- [ ] ComboListItem의 [공유][복제][삭제] 모두 동작함
- [ ] RecommendedTemplates 5개 표시됨 (Empty/Active 분기)
- [ ] 상대 시간 표시 ("3일 전", "1주 전") 외부 라이브러리 없이 수동 구현
- [ ] B2C 코드 (`lib/search/`, `lib/agent/`, `components/search/`) 수정 안 됨
- [ ] 4개 문서 헤더 날짜 일치
- [ ] `docs/CHANGELOG.md` 최상단에 CW26-S4 블록 추가됨
- [ ] git commit 메시지: `feat(CW26-S4): saved combos + share URL + recommended templates`
- [ ] git push 완료

---

## 🚨 절대 하지 말 것

1. ❌ Supabase 마이그레이션 자동 실행 (SQL 파일만 생성, 실행은 은태님)
2. ❌ SWR, react-query, date-fns 등 외부 라이브러리 추가
3. ❌ 로그인 게이트 전체 구현 (Sprint 5 범위) — 이번에는 "Save" + "내 조합 접근"에만 인증 체크
4. ❌ B2C 검색 코드 수정
5. ❌ 기존 Header/Footer/ChromeGate 수정
6. ❌ Phase 2 광고 슬롯 건드리기
7. ❌ Make 자동화 연결 / 팀 공유 기능 (후속 Sprint)

---

## 📊 예상 작업량

| 작업 | 예상 시간 |
|------|----------|
| Supabase migration SQL + combo-storage.ts | 20분 |
| API Routes 3개 (CRUD + share + duplicate) | 30분 |
| 공유 URL 페이지 (combos/[slug]) | 15분 |
| MySavedCombos + ComboListItem + RecommendedTemplates | 40분 |
| SaveComboModal + CustomBuilder 통합 | 20분 |
| useAuth hook + 인증 분기 | 15분 |
| 빌드 + 문서 업데이트 + git push | 15분 |
| **합계** | **약 2시간 35분** |

---

## 🔗 참고

- 스펙 원본: `docs/HOMEPAGE_REDESIGN_SPEC.md` 335~428행 (결정 5-2)
- 기존 Supabase 클라이언트: `utils/supabase/server.ts`
- 기존 마이그레이션 디렉토리: `supabase/migrations/` (마지막: 057)
- CustomBuilder 현재 코드: `components/custom/CustomBuilder.tsx` (Save 버튼 134~142행이 placeholder)
- Sprint 3 커밋: `d0b9670`, `d6cc87c`
- 다음 Sprint (CW27 Sprint 5): 로그인 게이트 — 📋 코드 복사 + 조합 저장 전부 로그인 필요
