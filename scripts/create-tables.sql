-- 创建经销商表
CREATE TABLE IF NOT EXISTS distributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'distributor' CHECK (role IN ('distributor', 'admin')),
    role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('captain', 'crew', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    registration_timestamp BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    upline_distributor_id UUID REFERENCES distributors(id),
    total_points INTEGER NOT NULL DEFAULT 0,
    personal_points INTEGER NOT NULL DEFAULT 0,
    commission_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建推荐用户表
CREATE TABLE IF NOT EXISTS referred_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
    address VARCHAR(42) NOT NULL,
    wusd_balance INTEGER NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_distributors_wallet_address ON distributors(wallet_address);
CREATE INDEX IF NOT EXISTS idx_distributors_referral_code ON distributors(referral_code);
CREATE INDEX IF NOT EXISTS idx_distributors_upline ON distributors(upline_distributor_id);
CREATE INDEX IF NOT EXISTS idx_distributors_status ON distributors(status);
CREATE INDEX IF NOT EXISTS idx_distributors_role_type ON distributors(role_type);
CREATE INDEX IF NOT EXISTS idx_referred_users_distributor ON referred_users(distributor_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_distributors_updated_at BEFORE UPDATE ON distributors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
