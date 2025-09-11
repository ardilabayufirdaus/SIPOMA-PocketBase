
CREATE TABLE registration_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to registration requests" 
    ON registration_requests 
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

GRANT ALL ON registration_requests TO authenticated;
