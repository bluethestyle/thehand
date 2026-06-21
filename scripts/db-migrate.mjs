/**
 * supabase/migrations/*.sql 를 SUPABASE_DB_URL 로 직접 실행.
 * 실행: node --env-file=.env.local scripts/db-migrate.mjs [파일...]
 * 인자 없으면 migrations 폴더 전체를 이름순 실행.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const DB = process.env.SUPABASE_DB_URL;
if (!DB) {
  console.error("❌ SUPABASE_DB_URL 필요(.env.local)");
  process.exit(1);
}

const args = process.argv.slice(2);
const dir = "supabase/migrations";
const files = args.length
  ? args
  : readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => resolve(dir, f));

const client = new pg.Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("connected");
for (const f of files) {
  const sql = readFileSync(f, "utf8");
  process.stdout.write(`→ ${f} ... `);
  try {
    await client.query(sql);
    console.log("ok");
  } catch (e) {
    console.log("ERROR");
    console.error(e.message);
  }
}
await client.end();
console.log("✅ done");
