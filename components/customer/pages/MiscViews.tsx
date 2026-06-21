import type { MenuItem, MenuPage } from "@/lib/types";
import { styleMeta } from "@/lib/format";
import s from "../customer.module.css";

export function CoverView({ page }: { page: MenuPage }) {
  return (
    <div className={s.cover}>
      <div className={s.coverMark}>手</div>
      <div className={s.coverBrand}>THE HAND</div>
      <div className={s.coverRule} />
      <div className={s.coverSub}>{page.subtitle ?? "사케 바 · 디지털 메뉴판"}</div>
      <div className={s.coverHint}>화면을 넘기거나 탭해서 메뉴 보기 →</div>
    </div>
  );
}

export function NoticeView() {
  return (
    <div className={s.content}>
      <div className={s.notice}>
        <h3>원산지 표기</h3>
        <ul>
          <li>니혼슈 · 쇼츄 — 원산지: 일본 (현별 표기는 각 메뉴 참조)</li>
          <li>모든 주류는 정식 수입 통관 제품입니다.</li>
          <li>쌀 · 누룩 등 원재료 원산지는 양조장 표기를 따릅니다.</li>
          <li>주류는 19세 미만 판매하지 않습니다.</li>
          <li>∗ 주류 필수 주문 ∗</li>
        </ul>
      </div>
    </div>
  );
}

// 스타일라이즈드 일본 지도상의 현(縣) 위치 (viewBox 0 0 280 300)
const REGION_POS: Record<string, { x: number; y: number }> = {
  치바: { x: 214, y: 124 },
  후쿠이: { x: 160, y: 150 },
  효고: { x: 130, y: 161 },
  미에: { x: 152, y: 171 },
  돗토리: { x: 104, y: 168 },
  에히메: { x: 96, y: 214 },
  고치: { x: 114, y: 221 },
  // 후쿠시마 등 비노출 현은 좌표를 두지 않아 지도/범례에서 제외됨
};

const ISLANDS = [
  // 홋카이도
  "M210,38 C228,30 246,42 244,60 C242,76 224,82 210,76 C198,71 196,46 210,38 Z",
  // 혼슈 (북동→남서 아치)
  "M222,78 C236,88 232,110 216,122 C200,134 184,138 168,144 C146,152 124,156 108,164 C96,170 86,178 84,188 C82,198 92,202 102,196 C118,189 138,180 158,172 C182,163 206,152 220,134 C234,118 238,96 230,80 C228,76 224,74 222,78 Z",
  // 시코쿠
  "M92,206 C104,201 120,206 118,218 C116,229 100,232 90,226 C82,221 83,210 92,206 Z",
  // 규슈
  "M54,198 C68,192 82,204 78,220 C74,234 56,238 46,228 C37,219 41,204 54,198 Z",
];

export function RegionMapView({ items }: { items: MenuItem[] }) {
  const mapped = items
    .filter((it) => it.status !== "closed" && it.region && REGION_POS[it.region])
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className={s.content}>
      <div className={s.mapWrap}>
        <div className={s.japanCard}>
          <svg viewBox="0 0 280 300" className={s.japanSvg} aria-label="일본 산지 지도">
            <text
              x="248"
              y="280"
              textAnchor="end"
              fontSize="22"
              fontWeight="700"
              fill="#cfd9dd"
              fontFamily="'Noto Serif KR', serif"
            >
              日本
            </text>
            <g fill="#e6dfd2" stroke="#d8d0c4" strokeWidth="1.2" strokeLinejoin="round">
              {ISLANDS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            {mapped.map((it, i) => {
              const pos = REGION_POS[it.region as string];
              const color = styleMeta(it.style)?.color ?? "#8b6f47";
              const soldout = it.status === "soldout";
              return (
                <g key={it.id}>
                  <line
                    x1={pos.x}
                    y1={pos.y}
                    x2={pos.x}
                    y2={pos.y}
                    stroke={color}
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="11"
                    fill={soldout ? "#fff" : color}
                    stroke={color}
                    strokeWidth={soldout ? 2 : 0}
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    dy="3.6"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill={soldout ? color : "#fff"}
                    fontFamily="Pretendard, sans-serif"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className={s.legend}>
          <p className={s.legendTitle}>지역으로 찾기</p>
          {mapped.map((it, i) => {
            const color = styleMeta(it.style)?.color ?? "#8b6f47";
            const soldout = it.status === "soldout";
            return (
              <div key={it.id} className={s.legendRow}>
                <span
                  className={`${s.legendNum} ${soldout ? s.nodeOut : ""}`}
                  style={{
                    background: color,
                    borderColor: color,
                    color: soldout ? color : "#fff",
                  }}
                >
                  {i + 1}
                </span>
                <span className={s.legendName}>{it.name}</span>
                <span className={s.legendRegion}>({it.region})</span>
                {soldout && <span className={s.legendTag}>품절</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
