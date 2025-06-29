// @ts-nocheck
import { neon, type NeonTransaction } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Interfaces (DbDistributor, DbReferredUser, Distributor, ReferredUser, mappers) remain the same as previous version...
// Interfaces for data as it comes from the database (snake_case)
interface DbDistributor {
  id: string
  wallet_address: string
  name: string
  email: string
  role: "distributor" | "admin"
  role_type: "captain" | "crew" | "admin"
  status: "pending" | "approved" | "rejected"
  registration_timestamp: number
  registration_date: string // This is already a string from TO_CHAR
  referral_code: string
  upline_distributor_id?: string
  total_points: number
  personal_points: number
  commission_points: number
  team_size: number
}

interface DbReferredUser {
  id: string
  distributor_id: string
  address: string
  wusd_balance: number
  points_earned: number // Points this customer generated for their direct referrer
}

// Frontend-facing interfaces (camelCase)
export interface Distributor {
  id: string
  walletAddress: string
  name: string
  email: string
  role: "distributor" | "admin"
  roleType: "captain" | "crew" | "admin"
  status: "pending" | "approved" | "rejected"
  registrationTimestamp: number
  registrationDate: string
  referralCode: string
  uplineDistributorId?: string
  totalPoints: number
  personalPoints: number
  commissionPoints: number
  teamSize: number
  rank?: number // Calculated dynamically
  title?: string // 基于团队规模的头衔（中文）
  titleEn?: string // 基于团队规模的头衔（英文）
  referredUsers: ReferredUser[]
  downlineDistributors?: Distributor[] // Populated in AuthContext or specific queries
  downline_distributor_ids?: string[] // For downlines page
}

export interface ReferredUser {
  id: string
  address: string
  wusdBalance: number
  pointsEarned: number
}

// Mapper function for Distributor
function mapDbDistributorToFrontend(
  dbDistributor: DbDistributor,
): Omit<Distributor, "rank" | "referredUsers" | "downlineDistributors"> {
  return {
    id: dbDistributor.id,
    walletAddress: dbDistributor.wallet_address,
    name: dbDistributor.name,
    email: dbDistributor.email,
    role: dbDistributor.role,
    roleType: dbDistributor.role_type,
    status: dbDistributor.status,
    registrationTimestamp: dbDistributor.registration_timestamp,
    registrationDate: dbDistributor.registration_date,
    referralCode: dbDistributor.referral_code,
    uplineDistributorId: dbDistributor.upline_distributor_id,
    totalPoints: Number(dbDistributor.total_points),
    personalPoints: Number(dbDistributor.personal_points),
    commissionPoints: Number(dbDistributor.commission_points),
    teamSize: Number(dbDistributor.team_size),
  }
}

// Mapper function for ReferredUser
function mapDbReferredUserToFrontend(dbReferredUser: DbReferredUser): ReferredUser {
  return {
    id: dbReferredUser.id,
    address: dbReferredUser.address,
    wusdBalance: Number(dbReferredUser.wusd_balance),
    pointsEarned: Number(dbReferredUser.points_earned),
  }
}

// getAllDistributors, getDistributorByWallet, getDistributorByReferralCode,
// createCrew, createCaptain, updateDistributorStatus, getDownlineDistributors, checkExistingUser
// remain largely the same as the previous version, ensuring they use the mappers.
// For brevity, I'll only show new/modified functions related to points.

export async function getAllDistributors(): Promise<Distributor[]> {
  try {
    const dbDistributors: DbDistributor[] = await sql`
  SELECT 
    id, wallet_address, name, email, role, role_type, status,
    registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
    referral_code, upline_distributor_id, total_points, personal_points, commission_points,
    team_size
  FROM distributors
  ORDER BY registration_timestamp DESC
`
    return Promise.all(
      dbDistributors.map(async (dbDistributor) => {
        const base = mapDbDistributorToFrontend(dbDistributor)
        const dbReferredUsers: DbReferredUser[] = await sql`
      SELECT id, distributor_id, address, wusd_balance, points_earned
      FROM referred_users WHERE distributor_id = ${dbDistributor.id}
    `
        
        // 根据团队规模计算头衔
        let title = ""
        let titleEn = ""
        if (dbDistributor.role === "distributor") {
          title = getTitleByTeamSize(dbDistributor.team_size, "zh")
          titleEn = getTitleByTeamSize(dbDistributor.team_size, "en")
        }
        
        return {
          ...base,
          title,
          titleEn,
          referredUsers: dbReferredUsers.map(mapDbReferredUserToFrontend),
        } as Distributor
      }),
    )
  } catch (error) {
    console.error("Error fetching distributors:", error)
    throw new Error("Failed to fetch distributors")
  }
}

export async function getDistributorByWallet(walletAddress: string): Promise<Distributor | null> {
  try {
    const result: DbDistributor[] = await sql`
      SELECT id, wallet_address, name, email, role, role_type, status,
             registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
             referral_code, upline_distributor_id, total_points, personal_points, commission_points,
             team_size
      FROM distributors WHERE LOWER(wallet_address) = LOWER(${walletAddress})
    `
    if (result.length === 0) return null
    const dbDistributor = result[0]
    const base = mapDbDistributorToFrontend(dbDistributor)
    const dbReferredUsers: DbReferredUser[] = await sql`
      SELECT id, distributor_id, address, wusd_balance, points_earned
      FROM referred_users WHERE distributor_id = ${dbDistributor.id}
    `
    
    // 根据团队规模计算头衔
    let title = ""
    let titleEn = ""
    if (dbDistributor.role === "distributor") {
      title = getTitleByTeamSize(dbDistributor.team_size, "zh")
      titleEn = getTitleByTeamSize(dbDistributor.team_size, "en")
    }
    
    return {
      ...base,
      title,
      titleEn,
      referredUsers: dbReferredUsers.map(mapDbReferredUserToFrontend),
    } as Distributor
  } catch (error) {
    console.error("Error fetching distributor by wallet:", error)
    throw new Error("Failed to fetch distributor")
  }
}

export async function getDistributorByReferralCode(referralCode: string): Promise<Distributor | null> {
  try {
    const result: DbDistributor[] = await sql`
  SELECT 
    id, wallet_address, name, email, role, role_type, status,
    registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
    referral_code, upline_distributor_id, total_points, personal_points, commission_points,
    team_size
  FROM distributors WHERE referral_code = ${referralCode}
`
    if (result.length === 0) return null
    const dbDistributor = result[0]
    const base = mapDbDistributorToFrontend(dbDistributor)
    const dbReferredUsers: DbReferredUser[] = await sql`
  SELECT id, distributor_id, address, wusd_balance, points_earned
  FROM referred_users WHERE distributor_id = ${dbDistributor.id}
`
    
    // 根据团队规模计算头衔
    let title = ""
    let titleEn = ""
    if (dbDistributor.role === "distributor") {
      title = getTitleByTeamSize(dbDistributor.team_size, "zh")
      titleEn = getTitleByTeamSize(dbDistributor.team_size, "en")
    }
    
    return {
      ...base,
      title,
      titleEn,
      referredUsers: dbReferredUsers.map(mapDbReferredUserToFrontend),
    } as Distributor
  } catch (error) {
    console.error("Error fetching distributor by referral code:", error)
    throw new Error("Failed to fetch distributor")
  }
}

export async function createCrew(name: string, email: string, walletAddress: string, uplineDistributorId: string): Promise<Distributor> {
  try {
    const timestamp = Date.now()
    const referralCode = generateReferralCode(name)
    // 将钱包地址转换为小写，确保数据库中地址格式一致
    const normalizedWalletAddress = walletAddress.toLowerCase()
    // 插入新船员
    const result: DbDistributor[] = await sql`
      INSERT INTO distributors (
        wallet_address, name, email, role, role_type, status,
        registration_timestamp, referral_code, upline_distributor_id
      ) VALUES (
        ${normalizedWalletAddress}, ${name}, ${email}, 'distributor', 'crew', 'approved',
        ${timestamp}, ${referralCode}, ${uplineDistributorId}
      )
      RETURNING 
        id, wallet_address, name, email, role, role_type, status,
        registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
        referral_code, upline_distributor_id, total_points, personal_points, commission_points,
        team_size
    `
    // 将船员作为下线插入 referred_users
    try {
      await sql`
        INSERT INTO referred_users (distributor_id, address, wusd_balance, points_earned)
        VALUES (${uplineDistributorId}, ${normalizedWalletAddress}, 0, 0)
      `
    } catch (err) {
      console.error("Error inserting referred_users for crew:", err)
    }
    
    // 计算头衔（新注册的船员团队大小为0，所以是船员）
    const dbDistributor = result[0]
    const title = getTitleByTeamSize(dbDistributor.team_size, "zh")
    const titleEn = getTitleByTeamSize(dbDistributor.team_size, "en")
    
    return {
      ...mapDbDistributorToFrontend(dbDistributor),
      title,
      titleEn,
      referredUsers: [],
    } as Distributor
  } catch (error) {
    console.error("Error creating crew:", error)
    throw new Error("Failed to create crew member")
  }
}

export async function createCaptain(name: string, email: string, walletAddress: string): Promise<Distributor> {
  try {
    const timestamp = Date.now()
    const referralCode = generateReferralCode(name)
    // 将钱包地址转换为小写，确保数据库中地址格式一致
    const normalizedWalletAddress = walletAddress.toLowerCase()
    // 插入新船长，新注册的用户都从crew开始
    const result: DbDistributor[] = await sql`
      INSERT INTO distributors (
        wallet_address, name, email, role, role_type, status,
        registration_timestamp, referral_code
      ) VALUES (
        ${normalizedWalletAddress}, ${name}, ${email}, 'distributor', 'crew', 'pending',
        ${timestamp}, ${referralCode}
      )
      RETURNING 
        id, wallet_address, name, email, role, role_type, status,
        registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
        referral_code, upline_distributor_id, total_points, personal_points, commission_points,
        team_size
    `
    // 将船长作为初始管理员的下线插入 referred_users（如果有管理员）
    try {
      await sql`
        INSERT INTO referred_users (distributor_id, address, wusd_balance, points_earned)
        SELECT id, ${normalizedWalletAddress}, 0, 0
        FROM distributors
        WHERE role_type = 'admin'
        LIMIT 1
      `
    } catch (err) {
      console.error("Error inserting referred_users for captain:", err)
    }
    
    // 计算头衔（新注册的用户团队大小为0，所以是船员）
    const dbDistributor = result[0]
    const title = getTitleByTeamSize(dbDistributor.team_size, "zh")
    const titleEn = getTitleByTeamSize(dbDistributor.team_size, "en")
    
    return {
      ...mapDbDistributorToFrontend(dbDistributor),
      title,
      titleEn,
      referredUsers: [],
    } as Distributor
  } catch (error) {
    console.error("Error creating captain:", error)
    throw new Error("Failed to create captain")
  }
}

export async function updateDistributorStatus(id: string, status: "approved" | "rejected"): Promise<void> {
  try {
    await sql`UPDATE distributors SET status = ${status} WHERE id = ${id}`
  } catch (error) {
    console.error("Error updating distributor status:", error)
    throw new Error("Failed to update distributor status")
  }
}

export async function getDownlineDistributors(distributorId: string): Promise<Distributor[]> {
  try {
    const dbResult: DbDistributor[] = await sql`
  SELECT 
    id, wallet_address, name, email, role, role_type, status,
    registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
    referral_code, upline_distributor_id, total_points, personal_points, commission_points,
    team_size
  FROM distributors WHERE upline_distributor_id = ${distributorId}
  ORDER BY registration_timestamp DESC
`
    return dbResult.map(
      (dbDist) =>
        ({
          ...mapDbDistributorToFrontend(dbDist),
          referredUsers: [],
        }) as Distributor,
    )
  } catch (error) {
    console.error("Error fetching downline distributors:", error)
    throw new Error("Failed to fetch downline distributors")
  }
}

export async function checkExistingUser(email: string, walletAddress: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT id FROM distributors WHERE email = ${email} OR LOWER(wallet_address) = LOWER(${walletAddress}) LIMIT 1
    `
    return result.length > 0
  } catch (error) {
    console.error("Error checking existing user:", error)
    throw new Error("Failed to check existing user")
  }
}

/**
 * Adds points to a specific distributor.
 * This function should be called within a transaction if part of a larger operation.
 * @param sqlClient - NeonTransaction or the base sql object.
 */
async function _addPointsToDistributorInternal(
  sqlClient: NeonTransaction<any, any> | typeof sql,
  distributorId: string,
  pointsToAdd: number,
  pointType: "personal" | "commission",
): Promise<void> {
  let personalPointsIncrement = 0
  let commissionPointsIncrement = 0

  if (pointType === "personal") {
    personalPointsIncrement = pointsToAdd
  } else if (pointType === "commission") {
    commissionPointsIncrement = pointsToAdd
  }

  if (pointsToAdd === 0) return // No points to add

  await sqlClient`
UPDATE distributors
SET 
  personal_points = personal_points + ${personalPointsIncrement},
  commission_points = commission_points + ${commissionPointsIncrement},
  total_points = total_points + ${pointsToAdd}
WHERE id = ${distributorId}
`
}

// /**
//  * Processes points generated by a referred customer's WUSD balance,
//  * distributing personal points to the direct referrer and commission to uplines.
//  * This function handles its own transaction.
//  *
//  * @param referredCustomerAddress The blockchain address of the customer.
//  * @param newWusdBalance The new WUSD balance of the customer.
//  * @param wusdToPointsConversionRate Rate to convert WUSD to points (e.g., 1 for 1:1).
//  * @param uplineCommissionRate Commission rate for uplines (e.g., 0.1 for 10%).
//  * @param maxCommissionLevels Maximum levels to pay commission.
//  */
// export async function processPointsFromWusdBalance(
//   referredCustomerAddress: string,
//   newWusdBalance: number,
//   wusdToPointsConversionRate = 1,
//   uplineCommissionRate = 0.1, // 10%
//   maxCommissionLevels = 5, // Example: pay up to 5 levels of upline
// ): Promise<{ success: boolean; message: string }> {
//   const pointsGenerated = Math.floor(newWusdBalance * wusdToPointsConversionRate)

//   if (pointsGenerated <= 0) {
//     // If WUSD balance is 0 or negative, or results in 0 points,
//     // we might still want to update the wusd_balance in referred_users.
//     // For now, we only process if positive points are generated.
//     // Or, we could update wusd_balance and set points_earned to 0.
//     try {
//       await sql`
//     UPDATE referred_users
//     SET wusd_balance = ${newWusdBalance}, points_earned = 0
//     WHERE address = ${referredCustomerAddress};
//   `
//       return { success: true, message: "WUSD balance updated, no new points generated." }
//     } catch (dbError: any) {
//       console.error("Error updating WUSD balance for zero points:", dbError)
//       return { success: false, message: `Failed to update WUSD balance: ${dbError.message}` }
//     }
//   }

//   try {
//     await sql.transaction(async (tx) => {
//       // 1. Find the referred_user record and their direct distributor (referrer)
//       const referredUserResult = await tx`
//     SELECT id, distributor_id
//     FROM referred_users
//     WHERE address = ${referredCustomerAddress}
//     LIMIT 1;
//   `

//       if (referredUserResult.length === 0) {
//         throw new Error(`Referred user with address ${referredCustomerAddress} not found.`)
//       }
//       const { id: referredUserId, distributor_id: directReferrerId } = referredUserResult[0]

//       if (!directReferrerId) {
//         throw new Error(`Referred user ${referredUserId} is not linked to any distributor.`)
//       }

//       // 2. Update the referred_user's wusd_balance and points_earned
//       await tx`
//     UPDATE referred_users
//     SET wusd_balance = ${newWusdBalance}, points_earned = ${pointsGenerated}
//     WHERE id = ${referredUserId};
//   `

//       // 3. Add personal points to the direct referrer
//       await _addPointsToDistributorInternal(tx, directReferrerId, pointsGenerated, "personal")
//       console.log(`Added ${pointsGenerated} personal points to distributor ${directReferrerId}`)

//       // 4. Distribute commission to uplines
//       let currentReferrerId = directReferrerId
//       let commissionLevel = 1

//       while (commissionLevel <= maxCommissionLevels) {
//         const uplineResult = await tx`
//       SELECT upline_distributor_id
//       FROM distributors
//       WHERE id = ${currentReferrerId}
//       LIMIT 1;
//     `

//         if (uplineResult.length === 0 || !uplineResult[0].upline_distributor_id) {
//           console.log(`Distributor ${currentReferrerId} has no upline or not found. Stopping commission.`)
//           break // No more uplines
//         }

//         const uplineDistributorId = uplineResult[0].upline_distributor_id
//         const commissionAmount = Math.floor(pointsGenerated * uplineCommissionRate) // Commission based on original pointsGenerated

//         if (commissionAmount > 0) {
//           await _addPointsToDistributorInternal(tx, uplineDistributorId, commissionAmount, "commission")
//           console.log(
//             `

export function generateReferralCode(name: string): string {
  // 清理名字中的空格，取前3字符
  const prefix = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
  
  // 确保前缀至少3字符（不足用X填充）
  const cleanPrefix = prefix.padEnd(3, 'X');
  
  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4位随机数
  
  // 格式: ABC + 时间戳中间4位 + 4位随机数
  return `${cleanPrefix}${timestamp.toString().slice(-6, -2)}${randomSuffix}`;
}

// 根据ID获取分销商
export async function getDistributorById(id: string): Promise<Distributor | null> {
  try {
    const result: DbDistributor[] = await sql`
      SELECT 
        id, wallet_address, name, email, role, role_type, status,
        registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
        referral_code, upline_distributor_id, total_points, personal_points, commission_points,
        team_size
      FROM distributors WHERE id = ${id}
    `
    if (result.length === 0) return null
    const dbDistributor = result[0]
    const base = mapDbDistributorToFrontend(dbDistributor)
    const dbReferredUsers: DbReferredUser[] = await sql`
      SELECT id, distributor_id, address, wusd_balance, points_earned
      FROM referred_users WHERE distributor_id = ${dbDistributor.id}
    `
    
    // 根据团队规模计算头衔
    let title = ""
    let titleEn = ""
    if (dbDistributor.role === "distributor") {
      title = getTitleByTeamSize(dbDistributor.team_size, "zh")
      titleEn = getTitleByTeamSize(dbDistributor.team_size, "en")
    }
    
    return {
      ...base,
      title,
      titleEn,
      referredUsers: dbReferredUsers.map(mapDbReferredUserToFrontend),
    } as Distributor
  } catch (error) {
    console.error("Error fetching distributor by id:", error)
    throw new Error("Failed to fetch distributor")
  }
}

// 删除分销商
export async function deleteDistributor(id: string): Promise<void> {
  try {
    await sql`DELETE FROM distributors WHERE id = ${id}`
  } catch (error) {
    console.error("Error deleting distributor:", error)
    throw new Error("Failed to delete distributor")
  }
}

// 清除下线关系
export async function clearUplineForDistributors(uplineId: string): Promise<void> {
  try {
    await sql`UPDATE distributors SET upline_distributor_id = NULL WHERE upline_distributor_id = ${uplineId}`
  } catch (error) {
    console.error("Error clearing upline relationships:", error)
    throw new Error("Failed to clear upline relationships")
  }
}

// 更新分销商信息（名称和邮箱）
export async function updateDistributor(id: string, name: string, email: string): Promise<Distributor> {
  try {
    const result: DbDistributor[] = await sql`
      UPDATE distributors 
      SET name = ${name}, email = ${email}
      WHERE id = ${id}
      RETURNING 
        id, wallet_address, name, email, role, role_type, status,
        registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
        referral_code, upline_distributor_id, total_points, personal_points, commission_points,
        team_size
    `
    if (result.length === 0) {
      throw new Error("Distributor not found")
    }
    const dbDistributor = result[0]
    const base = mapDbDistributorToFrontend(dbDistributor)
    const dbReferredUsers: DbReferredUser[] = await sql`
      SELECT id, distributor_id, address, wusd_balance, points_earned
      FROM referred_users WHERE distributor_id = ${dbDistributor.id}
    `
    return {
      ...base,
      referredUsers: dbReferredUsers.map(mapDbReferredUserToFrontend),
    } as Distributor
  } catch (error) {
    console.error("Error updating distributor:", error)
    throw new Error("Failed to update distributor")
  }
}



// 根据下线数量获取头衔（简化版：只有船员和船长）
export function getTitleByTeamSize(teamSize: number, language: "zh" | "en" = "zh"): string {
  if (language === "en") {
    return teamSize > 0 ? "Captain" : "Crew"
  }
  
  // 中文头衔
  return teamSize > 0 ? "船长" : "船员"
}

// 更新所有分销商的role_type基于他们的团队规模
export async function updateAllDistributorTitles(): Promise<void> {
  try {
    // 直接使用SQL更新，有下线的变成船长，没有下线的变成船员
    await sql`
      UPDATE distributors 
      SET role_type = CASE 
        WHEN team_size > 0 THEN 'captain'
        ELSE 'crew'
      END
      WHERE role = 'distributor'
    `
  } catch (error) {
    console.error("Error updating distributor titles:", error)
    throw new Error("Failed to update distributor titles")
  }
}