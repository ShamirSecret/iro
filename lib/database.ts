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
  rank?: number // Calculated dynamically
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
    totalPoints: dbDistributor.total_points,
    personalPoints: dbDistributor.personal_points,
    commissionPoints: dbDistributor.commission_points,
  }
}

// Mapper function for ReferredUser
function mapDbReferredUserToFrontend(dbReferredUser: DbReferredUser): ReferredUser {
  return {
    id: dbReferredUser.id,
    address: dbReferredUser.address,
    wusdBalance: dbReferredUser.wusd_balance,
    pointsEarned: dbReferredUser.points_earned,
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
    referral_code, upline_distributor_id, total_points, personal_points, commission_points
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
        return {
          ...base,
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
  SELECT 
    id, wallet_address, name, email, role, role_type, status,
    registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
    referral_code, upline_distributor_id, total_points, personal_points, commission_points
  FROM distributors WHERE wallet_address = ${walletAddress}
`
    if (result.length === 0) return null
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
    referral_code, upline_distributor_id, total_points, personal_points, commission_points
  FROM distributors WHERE referral_code = ${referralCode}
`
    if (result.length === 0) return null
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
    console.error("Error fetching distributor by referral code:", error)
    throw new Error("Failed to fetch distributor")
  }
}

export async function createCrew(name: string, email: string, walletAddress: string, uplineDistributorId: string): Promise<Distributor> {
  try {
    const timestamp = Date.now()
    const referralCode = generateReferralCode(name)
    // 插入新船员
    const result: DbDistributor[] = await sql`
      INSERT INTO distributors (
        wallet_address, name, email, role, role_type, status,
        registration_timestamp, referral_code, upline_distributor_id
      ) VALUES (
        ${walletAddress}, ${name}, ${email}, 'distributor', 'crew', 'approved',
        ${timestamp}, ${referralCode}, ${uplineDistributorId}
      )
      RETURNING 
        id, wallet_address, name, email, role, role_type, status,
        registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
        referral_code, upline_distributor_id, total_points, personal_points, commission_points
    `
    // 将船员作为下线插入 referred_users
    try {
      await sql`
        INSERT INTO referred_users (distributor_id, address, wusd_balance, points_earned)
        VALUES (${uplineDistributorId}, ${walletAddress}, 0, 0)
      `
    } catch (err) {
      console.error("Error inserting referred_users for crew:", err)
    }
    return {
      ...mapDbDistributorToFrontend(result[0]),
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
    // 插入新船长
    const result: DbDistributor[] = await sql`
      INSERT INTO distributors (
        wallet_address, name, email, role, role_type, status,
        registration_timestamp, referral_code
      ) VALUES (
        ${walletAddress}, ${name}, ${email}, 'distributor', 'captain', 'pending',
        ${timestamp}, ${referralCode}
      )
      RETURNING 
        id, wallet_address, name, email, role, role_type, status,
        registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
        referral_code, upline_distributor_id, total_points, personal_points, commission_points
    `
    // 将船长作为初始管理员的下线插入 referred_users（如果有管理员）
    try {
      await sql`
        INSERT INTO referred_users (distributor_id, address, wusd_balance, points_earned)
        SELECT id, ${walletAddress}, 0, 0
        FROM distributors
        WHERE role_type = 'admin'
        LIMIT 1
      `
    } catch (err) {
      console.error("Error inserting referred_users for captain:", err)
    }
    return {
      ...mapDbDistributorToFrontend(result[0]),
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
    referral_code, upline_distributor_id, total_points, personal_points, commission_points
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
  SELECT id FROM distributors WHERE email = ${email} OR wallet_address = ${walletAddress} LIMIT 1
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
//             `Added ${commissionAmount} commission points to upline ${uplineDistributorId} (Level ${commissionLevel})`,
//           )
//         } else {
//           console.log("Commission amount is zero. Stopping commission for higher uplines.")
//           break // Commission too small to distribute
//         }

//         currentReferrerId = uplineDistributorId
//         commissionLevel++
//       }
//     })
//     return { success: true, message: "Points distributed successfully." }
//   } catch (error: any) {
//     console.error("Error in processPointsFromWusdBalance transaction:", error)
//     return { success: false, message: `Failed to distribute points: ${error.message}` }
//   }
// }

// Admin function to directly add points (can be personal or commission)
// If personal, it will also trigger upline commission distribution.
export async function adminAddPoints(
  targetDistributorId: string,
  points: number,
  pointType: "personal" | "commission", // 'personal' means these are base points that should also generate upline commission
  // 'commission' means these are directly assigned commission points
  uplineCommissionRate = 0.1,
  maxCommissionLevels = 5,
): Promise<{ success: boolean; message: string }> {
  if (points <= 0) {
    return { success: false, message: "Points must be positive." }
  }

  try {
    await sql.transaction(async (tx) => {
      await _addPointsToDistributorInternal(tx, targetDistributorId, points, pointType)
      console.log(`Admin added ${points} ${pointType} points to distributor ${targetDistributorId}`)

      // If personal points were added by admin, these should also generate commission for uplines
      if (pointType === "personal") {
        const currentReferrerId = targetDistributorId
        let commissionLevel = 1

        // Fetch the upline of the targetDistributorId to start commission chain
        const initialUplineResult = await tx`
      SELECT upline_distributor_id FROM distributors WHERE id = ${targetDistributorId} LIMIT 1;
    `

        if (initialUplineResult.length > 0 && initialUplineResult[0].upline_distributor_id) {
          let uplineDistributorIdForCommission = initialUplineResult[0].upline_distributor_id

          while (uplineDistributorIdForCommission && commissionLevel <= maxCommissionLevels) {
            const commissionAmount = Math.floor(points * uplineCommissionRate) // Commission based on admin-added points

            if (commissionAmount > 0) {
              await _addPointsToDistributorInternal(
                tx,
                uplineDistributorIdForCommission,
                commissionAmount,
                "commission",
              )
              console.log(
                `Admin-triggered commission: ${commissionAmount} points to upline ${uplineDistributorIdForCommission} (Level ${commissionLevel})`,
              )
            } else {
              break
            }

            const nextUplineResult = await tx`
                SELECT upline_distributor_id FROM distributors WHERE id = ${uplineDistributorIdForCommission} LIMIT 1;
            `
            if (nextUplineResult.length === 0 || !nextUplineResult[0].upline_distributor_id) break

            uplineDistributorIdForCommission = nextUplineResult[0].upline_distributor_id
            commissionLevel++
          }
        }
      }
    })
    return { success: true, message: "Points added successfully by admin." }
  } catch (error: any) {
    console.error("Error in adminAddPoints transaction:", error)
    return { success: false, message: `Failed to add points by admin: ${error.message}` }
  }
}

// New function to orchestrate daily point awards
export async function processDailySnapshotAndCommissions(): Promise<{
  success: boolean
  count: number
  message: string
}> {
  try {
    const WUSD_TO_POINTS_RATE = 1
    const UPLINE_COMMISSION_RATE = 0.1
    const MAX_COMMISSION_LEVELS = 5

    const referredUsersWithReferrer: Array<{
      referred_user_id: string
      referred_user_address: string
      wusd_balance: number
      direct_referrer_id: string
      referrer_status: string
    }> = await sql`
  SELECT 
    ru.id as referred_user_id,
    ru.address as referred_user_address,
    ru.wusd_balance,
    d.id as direct_referrer_id,
    d.status as referrer_status
  FROM referred_users ru
  JOIN distributors d ON ru.distributor_id = d.id
  WHERE d.status = 'approved' AND ru.wusd_balance > 0; 
`

    if (referredUsersWithReferrer.length === 0) {
      return {
        success: true,
        count: 0,
        message: "No referred users with positive WUSD balance found for approved distributors.",
      }
    }

    let processedCount = 0

    const allDistributorsList: DbDistributor[] = await sql`SELECT id, upline_distributor_id, status FROM distributors`
    const distributorsMap = new Map(allDistributorsList.map((d) => [d.id, d]))

    for (const user of referredUsersWithReferrer) {
      const dailyGeneratedPoints = Math.floor(user.wusd_balance * WUSD_TO_POINTS_RATE)

      if (dailyGeneratedPoints <= 0) {
        continue
      }

      try {
        await sql.transaction(async (tx) => {
          // 1. Award personal points to the direct referrer
          // Ensure _addPointsToDistributorInternal is available in this scope
          await _addPointsToDistributorInternal(tx, user.direct_referrer_id, dailyGeneratedPoints, "personal")
          console.log(
            `Daily Snapshot: Awarded ${dailyGeneratedPoints} personal points to distributor ${user.direct_referrer_id} for customer ${user.referred_user_address}`,
          )

          // Update points_earned for the referred_user
          await tx`
        UPDATE referred_users
        SET points_earned = points_earned + ${dailyGeneratedPoints} 
        WHERE id = ${user.referred_user_id};
      `

          // 2. Distribute commission to uplines of the direct referrer
          let currentReferrerForCommissionChain = user.direct_referrer_id
          let commissionLevel = 1

          while (commissionLevel <= MAX_COMMISSION_LEVELS) {
            const directReferrerDetails = distributorsMap.get(currentReferrerForCommissionChain)
            if (!directReferrerDetails || !directReferrerDetails.upline_distributor_id) {
              console.log(
                `Daily Snapshot: Distributor ${currentReferrerForCommissionChain} has no upline. Stopping commission for this branch.`,
              )
              break
            }

            const uplineId = directReferrerDetails.upline_distributor_id
            const uplineDistributor = distributorsMap.get(uplineId)

            if (!uplineDistributor || uplineDistributor.status !== "approved") {
              console.log(`Daily Snapshot: Upline ${uplineId} is not approved or not found. Stopping commission.`)
              break
            }

            const commissionAmount = Math.floor(dailyGeneratedPoints * UPLINE_COMMISSION_RATE)

            if (commissionAmount > 0) {
              await _addPointsToDistributorInternal(tx, uplineId, commissionAmount, "commission")
              console.log(
                `Daily Snapshot: Awarded ${commissionAmount} commission points to upline ${uplineId} (Level ${commissionLevel}) from points generated by customer ${user.referred_user_address}`,
              )
            } else {
              console.log(
                `Daily Snapshot: Commission amount is zero for upline ${uplineId}. Stopping commission for higher uplines.`,
              )
              break
            }

            currentReferrerForCommissionChain = uplineId // Move to the next upline for the next iteration
            commissionLevel++
          }
        })
        processedCount++
      } catch (error: any) {
        console.error(
          `Error processing daily points for customer ${user.referred_user_address} (referrer ${user.direct_referrer_id}): ${error.message}`,
        )
      }
    }
    return {
      success: true,
      count: processedCount,
      message: `Daily snapshot processed for ${processedCount} referred users.`,
    }
  } catch (error: any) {
    console.error("Error in processDailySnapshotAndCommissions:", error)
    return { success: false, count: 0, message: `Failed to process daily snapshot: ${error.message}` }
  }
}

// Export the internal function for external use
export async function addPointsToDistributor(
  distributorId: string,
  pointsToAdd: number,
  pointType: "personal" | "commission",
): Promise<void> {
  if (pointsToAdd <= 0) return

  try {
    await _addPointsToDistributorInternal(sql, distributorId, pointsToAdd, pointType)
  } catch (error) {
    console.error("Error adding points to distributor:", error)
    throw new Error("Failed to add points to distributor")
  }
}

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

// 为被推荐用户更新 WUSD 余额（不触发积分分发）
export async function updateReferredUserWusdBalance(
  referredCustomerAddress: string,
  newWusdBalance: number
): Promise<{ success: boolean; message: string }> {
  try {
    await sql`
      UPDATE referred_users
      SET wusd_balance = ${newWusdBalance}
      WHERE address = ${referredCustomerAddress};
    `
    return { success: true, message: 'Referred user WUSD 余额已更新' }
  } catch (error: any) {
    console.error('更新被推荐用户 WUSD 余额错误:', error)
    return { success: false, message: `更新失败: ${error.message}` }
  }
}

// 添加获取推荐用户地址函数，用于按创建时间增量拉取
export async function getReferredUserAddresses(options: { since?: string; limit?: number }): Promise<{ address: string; createdAt: string }[]> {
  const { since, limit = 100 } = options
  let rows: Array<{ address: string; created_at: string }>
  if (since) {
    rows = await sql`
      SELECT address, created_at
      FROM referred_users
      WHERE created_at > ${since}
      ORDER BY created_at ASC
      LIMIT ${limit}
    `
  } else {
    rows = await sql`
      SELECT address, created_at
      FROM referred_users
      ORDER BY created_at ASC
      LIMIT ${limit}
    `
  }
  return rows.map(r => ({
    address: r.address,
    createdAt: new Date(r.created_at).toISOString(),
  }))
}

// 新增：根据 ID 获取分销商
export async function getDistributorById(id: string): Promise<Distributor | null> {
  try {
    const result: DbDistributor[] = await sql`
      SELECT id, wallet_address, name, email, role, role_type, status,
             registration_timestamp, TO_CHAR(registration_date, 'YYYY-MM-DD') as registration_date,
             referral_code, upline_distributor_id, total_points, personal_points, commission_points
      FROM distributors WHERE id = ${id}
    `
    if (result.length === 0) return null
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
    console.error("Error fetching distributor by id:", error)
    throw new Error("Failed to fetch distributor")
  }
}

// 新增：清除指定分销商的下线关系
export async function clearUplineForDistributors(uplineId: string): Promise<void> {
  try {
    await sql`
      UPDATE distributors
      SET upline_distributor_id = NULL
      WHERE upline_distributor_id = ${uplineId}
    `
  } catch (error) {
    console.error("Error clearing upline for distributors:", error)
    throw new Error("Failed to clear upline relationships")
  }
}

// 新增：删除分销商
export async function deleteDistributor(id: string): Promise<void> {
  try {
    await sql`
      DELETE FROM distributors WHERE id = ${id}
    `
  } catch (error) {
    console.error("Error deleting distributor:", error)
    throw new Error("Failed to delete distributor")
  }
}
