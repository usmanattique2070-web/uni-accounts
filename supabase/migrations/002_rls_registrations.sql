-- Allow anonymous inserts (public registration form)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on registrations"
  ON registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert (staff registration)
CREATE POLICY "Allow authenticated insert on registrations"
  ON registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read all registrations
CREATE POLICY "Allow authenticated read on registrations"
  ON registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update registrations
CREATE POLICY "Allow authenticated update on registrations"
  ON registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix students table RLS for submission_type and staff_id
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on students"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
