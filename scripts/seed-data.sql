-- 插入管理员
INSERT INTO distributors (
    id,
    wallet_address,
    name,
    email,
    role,
    role_type,
    status,
    registration_timestamp,
    registration_date,
    referral_code,
    upline_distributor_id,
    total_points,
    personal_points,
    commission_points
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '0x2574Ef9402f30C9cACE4E0b29FB4160d622Efd',
    '平台管理员',
    'admin@example.com',
    'admin',
    'admin',
    'approved',
    EXTRACT(EPOCH FROM '2023-01-01 10:00:00'::timestamp) * 1000,
    '2023-01-01',
    'ADMINXYZ',
    NULL,
    0,
    0,
    0
) ON CONFLICT (wallet_address) DO NOTHING;

-- 插入船长Alice
INSERT INTO distributors (
    id,
    wallet_address,
    name,
    email,
    role,
    role_type,
    status,
    registration_timestamp,
    registration_date,
    referral_code,
    upline_distributor_id,
    total_points,
    personal_points,
    commission_points
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '0xCaptainAliceWallet00000000000000000000',
    '船长Alice',
    'alice@captain.com',
    'distributor',
    'captain',
    'approved',
    EXTRACT(EPOCH FROM '2023-02-01 10:00:00'::timestamp) * 1000,
    '2023-02-01',
    'ALICE001',
    NULL,
    50000,
    30000,
    20000
) ON CONFLICT (wallet_address) DO NOTHING;

-- 插入船长Dave
INSERT INTO distributors (
    id,
    wallet_address,
    name,
    email,
    role,
    role_type,
    status,
    registration_timestamp,
    registration_date,
    referral_code,
    upline_distributor_id,
    total_points,
    personal_points,
    commission_points
) VALUES (
    '00000000-0000-0000-0000-000000000003',
    '0xCaptainDaveWallet00000000000000000000',
    '船长Dave',
    'dave@captain.com',
    'distributor',
    'captain',
    'approved',
    EXTRACT(EPOCH FROM '2023-02-15 10:00:00'::timestamp) * 1000,
    '2023-02-15',
    'DAVE002',
    NULL,
    15000,
    10000,
    5000
) ON CONFLICT (wallet_address) DO NOTHING;

-- 插入船员Bob (Alice下级)
INSERT INTO distributors (
    id,
    wallet_address,
    name,
    email,
    role,
    role_type,
    status,
    registration_timestamp,
    registration_date,
    referral_code,
    upline_distributor_id,
    total_points,
    personal_points,
    commission_points
) VALUES (
    '00000000-0000-0000-0000-000000000004',
    '0xCrewBobWalletAlice00000000000000000000',
    '船员Bob (Alice下级)',
    'bob@crew.com',
    'distributor',
    'crew',
    'approved',
    EXTRACT(EPOCH FROM '2023-03-01 10:00:00'::timestamp) * 1000,
    '2023-03-01',
    'BOB123',
    '00000000-0000-0000-0000-000000000002',
    11000,
    10000,
    1000
) ON CONFLICT (wallet_address) DO NOTHING;

-- 插入船员Charlie (Alice下级)
INSERT INTO distributors (
    id,
    wallet_address,
    name,
    email,
    role,
    role_type,
    status,
    registration_timestamp,
    registration_date,
    referral_code,
    upline_distributor_id,
    total_points,
    personal_points,
    commission_points
) VALUES (
    '00000000-0000-0000-0000-000000000005',
    '0xCrewCharlieWalletAlice000000000000000',
    '船员Charlie (Alice下级)',
    'charlie@crew.com',
    'distributor',
    'crew',
    'approved',
    EXTRACT(EPOCH FROM '2023-03-05 10:00:00'::timestamp) * 1000,
    '2023-03-05',
    'CHARLIE456',
    '00000000-0000-0000-0000-000000000002',
    5000,
    5000,
    0
) ON CONFLICT (wallet_address) DO NOTHING;

-- 插入船员Frank (Bob下级)
INSERT INTO distributors (
    id,
    wallet_address,
    name,
    email,
    role,
    role_type,
    status,
    registration_timestamp,
    registration_date,
    referral_code,
    upline_distributor_id,
    total_points,
    personal_points,
    commission_points
) VALUES (
    '00000000-0000-0000-0000-000000000006',
    '0xCrewFrankWalletBob0000000000000000000',
    '船员Frank (Bob下级)',
    'frank@crew.com',
    'distributor',
    'crew',
    'approved',
    EXTRACT(EPOCH FROM '2023-04-01 10:00:00'::timestamp) * 1000,
    '2023-04-01',
    'FRANK789',
    '00000000-0000-0000-0000-000000000004',
    1000,
    1000,
    0
) ON CONFLICT (wallet_address) DO NOTHING;

-- 插入船员Eve (Dave下级)
INSERT INTO distributors (
    id,
    wallet_address,
    name,
    email,
    role,
    role_type,
    status,
    registration_timestamp,
    registration_date,
    referral_code,
    upline_distributor_id,
    total_points,
    personal_points,
    commission_points
) VALUES (
    '00000000-0000-0000-0000-000000000007',
    '0xCrewEveWalletDave00000000000000000000',
    '船员Eve (Dave下级)',
    'eve@crew.com',
    'distributor',
    'crew',
    'approved',
    EXTRACT(EPOCH FROM '2023-03-10 10:00:00'::timestamp) * 1000,
    '2023-03-10',
    'EVE000',
    '00000000-0000-0000-0000-000000000003',
    5000,
    5000,
    0
) ON CONFLICT (wallet_address) DO NOTHING;

-- 插入待审核船长
INSERT INTO distributors (
    id,
    wallet_address,
    name,
    email,
    role,
    role_type,
    status,
    registration_timestamp,
    registration_date,
    referral_code,
    upline_distributor_id,
    total_points,
    personal_points,
    commission_points
) VALUES (
    '00000000-0000-0000-0000-000000000008',
    '0xCaptainPendingWallet000000000000000000',
    '待审核船长Grace',
    'grace@pending.com',
    'distributor',
    'captain',
    'pending',
    EXTRACT(EPOCH FROM '2023-05-01 10:00:00'::timestamp) * 1000,
    '2023-05-01',
    'GRACEPEND',
    NULL,
    0,
    0,
    0
) ON CONFLICT (wallet_address) DO NOTHING;

-- 插入被拒绝船长
INSERT INTO distributors (
    id,
    wallet_address,
    name,
    email,
    role,
    role_type,
    status,
    registration_timestamp,
    registration_date,
    referral_code,
    upline_distributor_id,
    total_points,
    personal_points,
    commission_points
) VALUES (
    '00000000-0000-0000-0000-000000000009',
    '0xCaptainRejectedWallet00000000000000000',
    '已拒绝船长Hank',
    'hank@rejected.com',
    'distributor',
    'captain',
    'rejected',
    EXTRACT(EPOCH FROM '2023-05-02 10:00:00'::timestamp) * 1000,
    '2023-05-02',
    'HANKREJ',
    NULL,
    0,
    0,
    0
) ON CONFLICT (wallet_address) DO NOTHING;
