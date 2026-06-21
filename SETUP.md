# 셋업 가이드 — Supabase + Vercel

이 앱은 **Supabase 없이도** 내장 시드 데이터로 손님 화면을 미리볼 수 있고(관리자는 데모·읽기전용),
**Supabase를 연결하면** 사장님이 품절·가격·페이지를 직접 바꾸고 모든 태블릿에 실시간 반영됩니다.

---

## 1. Supabase 스키마 적용 (기존 프로젝트에 추가)

`thehand_` 접두사 테이블만 추가하므로 기존 앱과 충돌하지 않습니다. 두 방법 중 택1:

**방법 A — SQL Editor 붙여넣기 (비번 불필요, 가장 쉬움)**
1. Supabase 대시보드 → **SQL Editor** → New query
2. [`supabase/apply.sql`](supabase/apply.sql)(스키마+시드 합본) 전체 복사 → 붙여넣기 → **Run**
   - (분리 실행하려면 `migrations/0001_init.sql` → `seed.sql` 순서로)

**방법 B — npm 러너 (DB 연결 문자열 필요)**
1. 대시보드 상단 **Connect** → Session pooler URI 복사(포트 5432, 비번 포함)
2. `.env.local` 의 `SUPABASE_DB_URL=` 에 그 URI 입력
3. `npm run db:push`

> 손님은 RLS로 **읽기 전용**, 쓰기는 서버 라우트(service_role)만 가능. 비밀번호는 손님이 못 읽는 `thehand_admin`에 해시로 저장됩니다.

## 2. API 키 확보

대시보드 → **Project Settings → API Keys**:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / publishable** 키(`sb_publishable_…` 또는 legacy `anon`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role / secret** 키(`sb_secret_…` 또는 legacy `service_role`) → `SUPABASE_SERVICE_ROLE_KEY` (**비밀**, 절대 클라이언트/깃에 노출 금지)

> 새 키 형식(`sb_publishable_`/`sb_secret_`)·구 형식(JWT) 모두 동작합니다.

## 3. 로컬 실행

```bash
cp .env.local.example .env.local   # 3개 값 채우기
npm install
npm run dev                        # http://localhost:3000
```

손님 화면 우하단 **⚙** → 최초 1회 **비밀번호 설정** → 관리자 모드 진입.
이후 ⋯ 메뉴에서 **비밀번호 변경** 가능.

## 4. Vercel 배포

1. [vercel.com](https://vercel.com) → **Add New → Project** → `bluethestyle/thehand` import
2. **Environment Variables** 에 위 3개 추가
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production/Preview/Development 모두)
   - `SUPABASE_SERVICE_ROLE_KEY` (Production/Preview — 비밀)
   - (선택) `ADMIN_SESSION_SECRET` — 세션 쿠키 서명용 임의 문자열. 없으면 service_role 키로 대체.
3. **Deploy**. 빌드 후 매장 태블릿에서 배포 URL 접속.

## 5. 실시간(Realtime) 확인

마이그레이션이 `thehand_*` 테이블을 `supabase_realtime` publication에 추가합니다.
대시보드 → **Database → Replication** 에서 활성 상태인지 확인하세요.
관리자가 품절 토글 → 손님 태블릿이 새로고침 없이 갱신됩니다.

---

## 운영 규칙 요약

- **일시품절**: 손님 화면에 "일시 품절"로 **표시만** (재입고 기대 유도)
- **닫힘**: 손님 화면에서 **숨김** + **보관함**에 보존 → "다시 판매하기"로 즉시 복원
- **페이지 보드**: 순서 변경(▲▼) / 숨김(👁) / 이미지·이벤트 페이지 삽입
- **표시 밀도**: 페이지당 항목 수 ↔ 글자 크기 자동 비례 (자동 분할)
- **스티커 편집기**: 이미지/이벤트 페이지에 뱃지·가격 스티커를 끌어 배치

## 다음 단계 (선택)

- 이미지 업로드: Supabase Storage 버킷 + `image_url` 연결 (현재는 placeholder)
- 쇼츄·요리·음료 등 나머지 섹션 실데이터 입력 (관리자 항목 추가 UI 확장)
- 지역 캐릭터 오리지널 일러스트 제작 (라이선스 이슈로 마스코트 사용 불가)
