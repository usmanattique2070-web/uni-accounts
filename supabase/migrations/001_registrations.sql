-- Create registrations table
CREATE TABLE registrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data        JSONB NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submission_type TEXT NOT NULL DEFAULT 'online' CHECK (submission_type IN ('online', 'staff')),
  staff_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_registrations_staff_id ON registrations(staff_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_created_at ON registrations(created_at DESC);

-- Add submission tracking to existing students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'online';
ALTER TABLE students ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES users(id) ON DELETE SET NULL;
