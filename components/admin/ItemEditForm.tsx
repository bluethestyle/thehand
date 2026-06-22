"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ItemBadge, MenuItem } from "@/lib/types";
import { AdminFrame, Toggle, useToast } from "./AdminFrame";
import f from "./admin-v2.module.css";
import s from "./item-edit.module.css";

const CATS = [
  { key: "nihonshu", label: "니혼슈" },
  { key: "yori", label: "요리" },
  { key: "shochu", label: "쇼츄" },
  { key: "drinks", label: "음료" },
];
const BADGES: { key: ItemBadge | ""; label: string }[] = [
  { key: "", label: "없음" },
  { key: "NEW", label: "NEW" },
  { key: "추천", label: "추천" },
  { key: "계절한정", label: "계절한정" },
];

type Form = Partial<MenuItem>;

export function ItemEditForm({ item }: { item: MenuItem }) {
  const router = useRouter();
  const { show, node } = useToast();
  const [form, setForm] = useState<Form>(item);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (patch: Form) => setForm((p) => ({ ...p, ...patch }));
  const cat = form.categoryKey;
  const isNihonshu = cat === "nihonshu";
  const isShochu = cat === "shochu";
  const isAlcohol = isNihonshu || isShochu;
  const isYori = cat === "yori";

  const UNITS: { key: "priceGlass" | "priceTokkuri" | "priceBottle"; name: string; vol: string }[] =
    isShochu
      ? [
          { key: "priceGlass", name: "잔술", vol: "80" },
          { key: "priceBottle", name: "보틀", vol: "720" },
        ]
      : [
          { key: "priceGlass", name: "잔술", vol: "100" },
          { key: "priceTokkuri", name: "도쿠리", vol: "300" },
          { key: "priceBottle", name: "보틀", vol: "720" },
        ];

  function back() {
    if (window.history.length > 1) router.back();
    else router.push("/admin/items");
    router.refresh();
  }

  async function save() {
    setBusy(true);
    // 공통
    const patch: Record<string, unknown> = {
      name: form.name,
      categoryKey: form.categoryKey,
      description: form.description ?? null,
      badge: form.badge ?? null,
      featured: !!form.featured,
      status: form.status,
    };
    if (isAlcohol) {
      patch.region = form.region ?? null;
      patch.brewery = form.brewery ?? null;
      patch.heatable = !!form.heatable;
      patch.flagNote = form.flagNote ?? null;
      patch.priceGlass = form.priceGlass ?? null;
      patch.priceTokkuri = isShochu ? null : form.priceTokkuri ?? null;
      patch.priceBottle = form.priceBottle ?? null;
    }
    if (isNihonshu) {
      patch.grade = form.grade ?? null;
      patch.sommelier = form.sommelier ?? null;
      patch.pairing = form.pairing ?? null;
      patch.polish = form.polish ?? null;
      patch.smv = form.smv ?? null;
      patch.acidity = form.acidity ?? null;
      patch.abv = form.abv ?? null;
    }
    if (isShochu) patch.ingredient = form.ingredient ?? null;
    if (isYori || cat === "drinks") {
      patch.priceGlass = form.priceGlass ?? null;
      patch.originNote = isYori ? form.originNote ?? null : null;
      patch.halfPrice = isYori ? form.halfPrice ?? null : null;
    }
    const res = await fetch("/api/admin/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, patch }),
    });
    setBusy(false);
    if (res.ok) {
      show("저장됨");
      back();
    } else show((await res.json()).error ?? "저장 실패");
  }

  async function remove() {
    if (!window.confirm("이 메뉴를 영구 삭제할까요? 복구할 수 없습니다.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    setBusy(false);
    if (res.ok) back();
    else show("삭제 실패");
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "items");
    const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await up.json();
    setBusy(false);
    if (!up.ok) return show(data.error ?? "업로드 실패");
    set({ imageUrl: data.url });
    await fetch("/api/admin/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, patch: { imageUrl: data.url } }),
    });
    show("사진 적용됨");
  }

  return (
    <AdminFrame breadcrumb={`메뉴 관리 › ${item.name}`}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
      <div className={f.pageHead}>
        <div>
          <div className={f.pageTitle}>메뉴 수정</div>
        </div>
        <div className={f.pageActions}>
          <button
            className={f.btn}
            disabled={busy}
            onClick={() => {
              set({ status: "closed" });
              show("숨김 보관 — 저장을 눌러 적용");
            }}
          >
            숨김 보관
          </button>
          <button className={`${f.btn} ${f.btnPrimary}`} disabled={busy} onClick={save}>
            저장
          </button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className={f.card}>
        <div className={f.cardTitle}>기본 정보</div>
        <div className={`${f.fieldGrid} ${f.cols3}`}>
          <div className={f.field}>
            <label>메뉴명</label>
            <input className={f.input} value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className={f.field}>
            <label>분류</label>
            <select className={f.select} value={cat ?? ""} onChange={(e) => set({ categoryKey: e.target.value })}>
              {CATS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className={f.field}>
            <label>뱃지</label>
            <select className={f.select} value={form.badge ?? ""} onChange={(e) => set({ badge: (e.target.value || null) as ItemBadge | null })}>
              {BADGES.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {isAlcohol && (
            <>
              <div className={f.field}>
                <label>{isShochu ? "산지" : "산지 (현)"}</label>
                <input className={f.input} value={form.region ?? ""} onChange={(e) => set({ region: e.target.value })} />
              </div>
              <div className={f.field}>
                <label>{isShochu ? "양조장 · 도수" : "양조장"}</label>
                <input className={f.input} value={form.brewery ?? ""} onChange={(e) => set({ brewery: e.target.value })} />
              </div>
              <div className={f.field}>
                <label>{isShochu ? "원료" : "등급"}</label>
                {isShochu ? (
                  <input className={f.input} value={form.ingredient ?? ""} placeholder="보리·고구마·흑당…" onChange={(e) => set({ ingredient: e.target.value })} />
                ) : (
                  <input className={f.input} value={form.grade ?? ""} onChange={(e) => set({ grade: e.target.value })} />
                )}
              </div>
            </>
          )}

          {isYori && (
            <div className={f.field} style={{ gridColumn: "1 / -1" }}>
              <label>원산지 표기 (선택)</label>
              <input className={f.input} value={form.originNote ?? ""} placeholder="예: 광어 국내산(양식)" onChange={(e) => set({ originNote: e.target.value })} />
            </div>
          )}
        </div>

        {isAlcohol && (
          <div className={s.tagRow}>
            <label className={s.check}>
              <input type="checkbox" checked={!!form.featured} onChange={(e) => set({ featured: e.target.checked })} /> ★ 추천 강조
            </label>
            <label className={s.check}>
              <input type="checkbox" checked={!!form.heatable} onChange={(e) => set({ heatable: e.target.checked })} /> ♨ 데움 가능
            </label>
            <input className={f.input} style={{ maxWidth: 200 }} value={form.flagNote ?? ""} placeholder="우측 라벨 (예: 여름 한정)" onChange={(e) => set({ flagNote: e.target.value })} />
          </div>
        )}
        {!isAlcohol && (
          <div className={s.tagRow}>
            <label className={s.check}>
              <input type="checkbox" checked={!!form.featured} onChange={(e) => set({ featured: e.target.checked })} /> ★ 추천 강조
            </label>
          </div>
        )}
      </div>

      {/* 설명·코멘트 */}
      <div className={f.card}>
        <div className={f.cardTitle}>설명 · 코멘트</div>
        <div className={f.field} style={{ marginBottom: isNihonshu ? 14 : 0 }}>
          <label>메뉴 설명</label>
          <textarea className={f.textarea} value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
        </div>
        {isNihonshu && (
          <div className={`${f.fieldGrid} ${f.cols2}`}>
            <div className={f.field}>
              <label>소믈리에 코멘트 (선택)</label>
              <input className={f.input} value={form.sommelier ?? ""} placeholder="비워두면 표시되지 않아요" onChange={(e) => set({ sommelier: e.target.value })} />
            </div>
            <div className={f.field}>
              <label>추천 페어링 (선택)</label>
              <input className={f.input} value={form.pairing ?? ""} placeholder="예: 오뎅·전골" onChange={(e) => set({ pairing: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      {/* 가격 */}
      <div className={f.card}>
        <div className={f.cardTitleRow}>
          <span className={f.cardTitle} style={{ margin: 0 }}>
            {isAlcohol ? "판매 단위 · 용량 · 가격" : "가격"}
          </span>
          {isAlcohol && <span className={f.cardHint}>단위별로 켜고 끄세요</span>}
        </div>
        {isAlcohol ? (
          UNITS.map((u) => {
            const on = form[u.key] != null;
            return (
              <div key={u.key} className={f.unitRow}>
                <div className={f.unitName}>
                  <Toggle on={on} onChange={(v) => set({ [u.key]: v ? form[u.key] ?? 0 : null } as Form)} />
                  {u.name}
                </div>
                <span className={f.unitUnit}>{u.vol}㎖</span>
                <input
                  className={`${f.input} ${f.unitInput}`}
                  value={form[u.key] ?? ""}
                  placeholder="—"
                  inputMode="numeric"
                  disabled={!on}
                  onChange={(e) => set({ [u.key]: e.target.value ? Number(e.target.value.replace(/[^\d]/g, "")) : null } as Form)}
                />
                <span className={f.unitUnit}>원</span>
              </div>
            );
          })
        ) : (
          <div className={`${f.fieldGrid} ${f.cols2}`}>
            <div className={f.field}>
              <label>가격</label>
              <input
                className={f.input}
                value={form.priceGlass ?? ""}
                placeholder="—"
                inputMode="numeric"
                onChange={(e) => set({ priceGlass: e.target.value ? Number(e.target.value.replace(/[^\d]/g, "")) : null })}
              />
            </div>
            {isYori && (
              <div className={f.field}>
                <label>½ 하프 가격 (선택)</label>
                <input
                  className={f.input}
                  value={form.halfPrice ?? ""}
                  placeholder="없으면 비워두기"
                  inputMode="numeric"
                  onChange={(e) => set({ halfPrice: e.target.value ? Number(e.target.value.replace(/[^\d]/g, "")) : null })}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 스펙(니혼슈) */}
      {isNihonshu && (
        <div className={f.card}>
          <div className={f.cardTitle}>스펙 (선택)</div>
          <div className={`${f.fieldGrid} ${f.cols2}`}>
            <div className={f.field}>
              <label>정미보합 %</label>
              <input className={f.input} value={form.polish ?? ""} inputMode="numeric" onChange={(e) => set({ polish: e.target.value ? Number(e.target.value.replace(/[^\d.]/g, "")) : null })} />
            </div>
            <div className={f.field}>
              <label>일본주도</label>
              <input className={f.input} value={form.smv ?? ""} placeholder="예: +6 / 비공개" onChange={(e) => set({ smv: e.target.value })} />
            </div>
            <div className={f.field}>
              <label>산도</label>
              <input className={f.input} value={form.acidity ?? ""} placeholder="예: 1.6 / 비공개" onChange={(e) => set({ acidity: e.target.value })} />
            </div>
            <div className={f.field}>
              <label>도수 %</label>
              <input className={f.input} value={form.abv ?? ""} inputMode="numeric" onChange={(e) => set({ abv: e.target.value ? Number(e.target.value.replace(/[^\d.]/g, "")) : null })} />
            </div>
          </div>
        </div>
      )}

      {/* 사진(주류) + 상태 */}
      <div className={s.twoCol}>
        {isAlcohol && (
          <div className={f.card} style={{ flex: 1 }}>
            <div className={f.cardTitle}>보틀 사진</div>
            <button className={s.photoBtn} onClick={() => fileRef.current?.click()} disabled={busy}>
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" />
              ) : (
                <span>＋<br />탭하여 업로드</span>
              )}
            </button>
            <div className={f.footNote}>권장: 세로형, 배경 제거</div>
          </div>
        )}
        <div className={f.card} style={{ flex: 1 }}>
          <div className={f.cardTitle}>상태</div>
          <div className={s.statusRow}>
            <Toggle on={form.status === "soldout"} onChange={(v) => set({ status: v ? "soldout" : "selling" })} />
            <span>일시 품절</span>
          </div>
          <div className={s.statusRow}>
            <Toggle on={form.status !== "closed"} onChange={(v) => set({ status: v ? "selling" : "closed" })} />
            <span>메뉴판에 표시</span>
          </div>
        </div>
      </div>

      <div className={s.deleteRow}>
        삭제는 복구할 수 없어요 —{" "}
        <button className={s.deleteBtn} onClick={remove} disabled={busy}>
          이 메뉴 삭제
        </button>
      </div>
      {node}
    </AdminFrame>
  );
}
