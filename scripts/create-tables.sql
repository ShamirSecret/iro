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
    hierarchy_level INTEGER NOT NULL DEFAULT 1,
    team_size INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 0,
    personal_points INTEGER NOT NULL DEFAULT 0,
    commission_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referred_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
    address VARCHAR(42) NOT NULL,
    wusd_balance INTEGER NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id UUID NOT NULL REFERENCES distributors(id),
    amount INTEGER NOT NULL,
    point_type VARCHAR(20) NOT NULL CHECK (point_type IN ('personal', 'commission', 'activity')),
    source VARCHAR(50) NOT NULL,
    reference_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_rates (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL,
    rate DECIMAL(5,4) NOT NULL CHECK (rate BETWEEN 0 AND 1),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS nonces (
    id SERIAL PRIMARY KEY,
    nonce TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    used BOOLEAN NOT NULL DEFAULT FALSE
  );

-- CREATE TABLE IF NOT EXISTS distributor_balances (
--     distributor_id UUID PRIMARY KEY REFERENCES distributors(id) ON DELETE CASCADE,
--     wusd_balance INTEGER NOT NULL DEFAULT 0,
--     updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
-- );

CREATE INDEX IF NOT EXISTS idx_distributors_wallet_address ON distributors(wallet_address);
CREATE INDEX IF NOT EXISTS idx_distributors_referral_code ON distributors(referral_code);
CREATE INDEX IF NOT EXISTS idx_distributors_upline ON distributors(upline_distributor_id);
CREATE INDEX IF NOT EXISTS idx_distributors_status ON distributors(status);
CREATE INDEX IF NOT EXISTS idx_distributors_role_type ON distributors(role_type);
CREATE INDEX IF NOT EXISTS idx_referred_users_distributor ON referred_users(distributor_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_distributor ON point_transactions(distributor_id);
CREATE INDEX IF NOT EXISTS idx_commission_rates_level ON commission_rates(level);
CREATE INDEX IF NOT EXISTS idx_nonces_nonce ON nonces(nonce);
CREATE INDEX IF NOT EXISTS idx_nonces_used ON nonces(used);
CREATE INDEX IF NOT EXISTS idx_distributor_balances_balance ON distributor_balances(wusd_balance);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_distributors_updated_at BEFORE UPDATE ON distributors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_team_size()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.upline_distributor_id IS NOT NULL THEN
        UPDATE distributors
        SET team_size = team_size + 1
        WHERE id = NEW.upline_distributor_id;
    ELSIF TG_OP = 'DELETE' AND OLD.upline_distributor_id IS NOT NULL THEN
        UPDATE distributors
        SET team_size = team_size - 1
        WHERE id = OLD.upline_distributor_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_size_trigger
AFTER INSERT OR DELETE ON distributors
FOR EACH ROW EXECUTE FUNCTION update_team_size();

-- 自动更新role_type基于team_size的函数
CREATE OR REPLACE FUNCTION update_role_type_by_team_size()
RETURNS TRIGGER AS $$
BEGIN
    -- 只处理team_size字段的更新，且role为distributor的记录
    IF TG_OP = 'UPDATE' AND OLD.team_size != NEW.team_size AND NEW.role = 'distributor' THEN
        -- 如果team_size > 0，设置为captain，否则设置为crew
        NEW.role_type = CASE 
            WHEN NEW.team_size > 0 THEN 'captain'
            ELSE 'crew'
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER update_role_type_trigger
BEFORE UPDATE ON distributors
FOR EACH ROW EXECUTE FUNCTION update_role_type_by_team_size();
