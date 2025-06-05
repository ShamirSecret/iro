import cron from "node-cron";
import { sql } from "@/lib/database";

let cronInitialized = false;

if (!cronInitialized) {
  // 每小时清理一次过期 nonce
  cron.schedule("0 * * * *", async () => {
    console.log("Cron job started at", new Date().toISOString());
    await sql`
      DELETE FROM nonces 
      WHERE created_at < NOW() - INTERVAL '1 hour'
        OR used = true
    `;
    console.log("Cleaned expired nonces");
  });
  
  cronInitialized = true;
  console.log("Cron jobs initialized");
} else {
  console.error("cron 模块加载失败");
} 