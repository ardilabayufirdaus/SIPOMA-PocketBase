-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser VARCHAR(100),
    location VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Actions Table
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN (
        'login', 'logout', 'view', 'create', 'update', 'delete', 'export', 'import'
    )),
    module VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_timestamp ON user_actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_module ON user_actions(module);
CREATE INDEX IF NOT EXISTS idx_user_actions_success ON user_actions(success);

-- RLS Disabled for user activity tables
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions DISABLE ROW LEVEL SECURITY;

-- Trigger to update session duration
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start)) / 60;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_session_duration
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_duration();

-- Function to automatically end inactive sessions
CREATE OR REPLACE FUNCTION end_inactive_sessions()
RETURNS INTEGER AS $$
DECLARE
    inactive_count INTEGER := 0;
BEGIN
    UPDATE user_sessions 
    SET 
        session_end = NOW(),
        is_active = false,
        duration_minutes = EXTRACT(EPOCH FROM (NOW() - session_start)) / 60
    WHERE 
        is_active = true 
        AND last_activity < NOW() - INTERVAL '2 hours'
        AND session_end IS NULL;
    
    GET DIAGNOSTICS inactive_count = ROW_COUNT;
    RETURN inactive_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up inactive sessions (run every hour)
-- This would typically be set up as a cron job or scheduled task
-- SELECT cron.schedule('end-inactive-sessions', '0 * * * *', 'SELECT end_inactive_sessions();');

-- Function to get user activity statistics
CREATE OR REPLACE FUNCTION get_user_activity_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users WHERE is_active = true),
        'active_sessions', (SELECT COUNT(*) FROM user_sessions WHERE is_active = true),
        'total_sessions', (
            SELECT COUNT(*) FROM user_sessions 
            WHERE session_start::date BETWEEN start_date AND end_date
        ),
        'total_actions', (
            SELECT COUNT(*) FROM user_actions 
            WHERE timestamp::date BETWEEN start_date AND end_date
        ),
        'successful_actions', (
            SELECT COUNT(*) FROM user_actions 
            WHERE timestamp::date BETWEEN start_date AND end_date AND success = true
        ),
        'failed_actions', (
            SELECT COUNT(*) FROM user_actions 
            WHERE timestamp::date BETWEEN start_date AND end_date AND success = false
        ),
        'average_session_duration', (
            SELECT COALESCE(AVG(duration_minutes), 0) FROM user_sessions 
            WHERE session_start::date BETWEEN start_date AND end_date AND session_end IS NOT NULL
        ),
        'top_users', (
            SELECT json_agg(
                json_build_object(
                    'user_id', ua.user_id,
                    'username', u.username,
                    'full_name', u.full_name,
                    'action_count', ua.action_count,
                    'last_active', ua.last_active
                )
            ) FROM (
                SELECT 
                    user_id,
                    COUNT(*) as action_count,
                    MAX(timestamp) as last_active
                FROM user_actions 
                WHERE timestamp::date BETWEEN start_date AND end_date
                GROUP BY user_id
                ORDER BY action_count DESC
                LIMIT 10
            ) ua
            JOIN users u ON ua.user_id = u.id
        ),
        'top_modules', (
            SELECT json_agg(
                json_build_object(
                    'module', module,
                    'action_count', action_count
                )
            ) FROM (
                SELECT 
                    module,
                    COUNT(*) as action_count
                FROM user_actions 
                WHERE timestamp::date BETWEEN start_date AND end_date
                GROUP BY module
                ORDER BY action_count DESC
                LIMIT 10
            ) modules
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON user_actions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_stats TO authenticated;
GRANT EXECUTE ON FUNCTION end_inactive_sessions TO authenticated;