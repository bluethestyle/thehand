/**
 * Supabase 스키마/시드 푸시 러너 (MCP 없이 npm/pg로 직접 적용).
 * 실행: npm run db:push   (= node --env-file=.env.local scripts/db-push.mjs)
 * 필요 env: SUPABASE_DB_URL  (Project Settings → Database → Connection string, URI; 비번 포함)
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const conn = process.env.SUPABASE_DB_URL;
if (!conn) {
  console.error(
    "❌ SUPABASE_DB_URL 미설정.\n" +
      "   Supabase 대시보드 → Project Settings → Database → Connection string(URI)을\n" +
      "   .env.local 의 SUPABASE_DB_URL 에 넣으세요. (Session pooler 또는 Direct, 포트 5432 권장)"
  );
  process.exit(1);
}

const files = ["supabase/migrations/0001_init.sql", "supabase/seed.sql"];
const client = new pg.Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  // DO/함수 블록이 있는 멀티스테이트먼트 파일은 simple query protocol로 실행됨
});

try {
  await client.connect();
  console.log("🔌 연결 성공");
  for (const f of files) {
    const sql = readFileSync(f, "utf8");
    process.stdout.write(`▶ ${f} 실행... `);
    await client.query(sql);
    console.log("OK");
  }
  // 적용 결과 간단 확인
  const { rows } = await client.query(
    "select (select count(*) from public.thehand_items) as items, " +
      "(select count(*) from public.thehand_pages) as pages, " +
      "(select count(*) from public.thehand_stickers) as stickers"
  );
  console.log("✅ 완료:", rows[0]);
} catch (e) {
  console.error("\n❌ 실패:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
