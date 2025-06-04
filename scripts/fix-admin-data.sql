-- 首先删除可能存在的旧管理员数据
DELETE FROM distributors WHERE wallet_address IN (
    '0x2574Ef949402f30C9cACE4E0b29FB4160d622Efd',
    '0x442368f7b5192f9164a11a5387194cb5718673b9'
);

-- 插入新的管理员数据，确保所有字段正确
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
    '0x442368f7b5192f9164a11a5387194cb5718673b9',
    '平台管理员',
    'admin@picwe.com',
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
);

-- 验证插入的数据
SELECT 
    wallet_address,
    name,
    role,
    role_type,
    status
FROM distributors 
WHERE wallet_address = '0x442368f7b5192f9164a11a5387194cb5718673b9';
