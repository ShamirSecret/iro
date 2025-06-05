import cron from "node-cron";
import { sql, processDailySnapshotAndCommissions } from "@/lib/database";

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
  
  // 每天 UTC 0 点执行积分增加
  cron.schedule("0 0 * * *", async () => {
    console.log("Daily snapshot started at", new Date().toISOString());
    const result = await processDailySnapshotAndCommissions();
    console.log("Daily snapshot processed:", result);
  }, { timezone: "UTC" });

  cronInitialized = true;
  console.log("Cron jobs initialized");
} else {
  console.error("cron 模块加载失败");
} 