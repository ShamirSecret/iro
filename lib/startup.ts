import { sql } from "@/lib/database";

export async function checkNoncesTable() {
  const tableInfo = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'nonces'
  `;
  
  console.log("nonces 表结构:", tableInfo);
} 