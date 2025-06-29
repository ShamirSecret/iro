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

-- 立即更新现有分销商的role_type基于他们的团队规模
UPDATE distributors 
SET role_type = CASE 
    WHEN team_size > 0 THEN 'captain'
    ELSE 'crew'
END
WHERE role = 'distributor'; 