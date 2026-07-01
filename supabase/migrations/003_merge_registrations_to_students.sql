-- Allow anonymous inserts on students table (for public registration form)
-- This lets the online form write directly to the students table

-- First, check if RLS is enabled and add policy
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'students' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE students ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Allow anonymous (public form) to insert into students
CREATE POLICY "Allow anonymous insert on students for public registration"
  ON students
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure authenticated users can still insert (existing staff functionality)
-- This should already exist but create if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND policyname = 'Allow authenticated insert on students'
  ) THEN
    CREATE POLICY "Allow authenticated insert on students"
      ON students
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;
