import { supabase } from './supabase'

// ===================== AUTH =====================

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

// ===================== USERS =====================

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getUser(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateUserRole(id: string, role: 'admin' | 'staff') {
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)
  if (error) throw error
}

export async function updateUserActive(id: string, isActive: boolean) {
  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw error
}

export async function deleteUser(id: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ===================== STUDENTS =====================

export async function getStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getStudent(id: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createStudent(data: Record<string, unknown>, status: string = 'new') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('students')
    .insert({
      created_by_id: user.id,
      status: status as 'new' | 'contacted' | 'follow_up' | 'enrolled' | 'rejected',
      data,
    })
  if (error) throw error
}

export async function updateStudent(id: string, updates: { status?: string; data?: Record<string, unknown> }) {
  const { error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteStudent(id: string) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getStudentStats() {
  const { data: students, error } = await supabase
    .from('students')
    .select('status, created_by_id, created_at')
  if (error) throw error

  const total = students.length
  const statusCounts = {
    new: 0,
    contacted: 0,
    follow_up: 0,
    enrolled: 0,
    rejected: 0,
  }
  const monthlyCounts: Record<string, number> = {}

  students.forEach(s => {
    if (s.status in statusCounts) {
      statusCounts[s.status as keyof typeof statusCounts]++
    }
    const month = new Date(s.created_at).toISOString().slice(0, 7)
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1
  })

  return { total, statusCounts, monthlyCounts }
}

// ===================== CUSTOM FIELDS =====================

export async function getCustomFields() {
  const { data, error } = await supabase
    .from('custom_fields')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function createCustomField(field: {
  label: string
  type: string
  options?: string[]
  is_required?: boolean
  sort_order?: number
}) {
  const { error } = await supabase
    .from('custom_fields')
    .insert(field)
  if (error) throw error
}

export async function updateCustomField(id: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('custom_fields')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteCustomField(id: string) {
  const { error } = await supabase
    .from('custom_fields')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ===================== DEGREE PROGRAMS =====================

export async function getDegreePrograms() {
  const { data, error } = await supabase
    .from('degree_programs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getActiveDegreePrograms() {
  const { data, error } = await supabase
    .from('degree_programs')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createDegreeProgram(program: { name: string; duration: string; description?: string }) {
  const { error } = await supabase
    .from('degree_programs')
    .insert(program)
  if (error) throw error
}

export async function updateDegreeProgram(id: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('degree_programs')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteDegreeProgram(id: string) {
  const { error } = await supabase
    .from('degree_programs')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ===================== COURSES =====================

export async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*, degree_programs(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getActiveCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*, degree_programs(name)')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function getCoursesByProgram(programId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('degree_program_id', programId)
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function createCourse(course: {
  name: string
  code: string
  degree_program_id?: string
  description?: string
}) {
  const { error } = await supabase
    .from('courses')
    .insert(course)
  if (error) throw error
}

export async function updateCourse(id: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteCourse(id: string) {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ===================== STAFF PERFORMANCE =====================

export async function getStaffPerformance() {
  const users = await getUsers()
  const { data: students, error } = await supabase
    .from('students')
    .select('created_by_id, status')
  if (error) throw error

  const performance = users
    .filter(u => u.role === 'staff')
    .map(u => {
      const myStudents = students.filter(s => s.created_by_id === u.id)
      return {
        ...u,
        totalStudents: myStudents.length,
        new: myStudents.filter(s => s.status === 'new').length,
        contacted: myStudents.filter(s => s.status === 'contacted').length,
        followUp: myStudents.filter(s => s.status === 'follow_up').length,
        enrolled: myStudents.filter(s => s.status === 'enrolled').length,
        rejected: myStudents.filter(s => s.status === 'rejected').length,
        enrollmentRate: myStudents.length > 0
          ? Math.round((myStudents.filter(s => s.status === 'enrolled').length / myStudents.length) * 100)
          : 0,
      }
    })
    .sort((a, b) => b.totalStudents - a.totalStudents)

  return performance
}

// ===================== ACTIVITY LOGS =====================

export async function logActivity(action: string, entity: string, entityId?: string, details?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: user.id,
      action,
      entity,
      entity_id: entityId,
      details,
    })
  if (error) console.error('Failed to log activity:', error)
}

// ===================== DELETION REQUESTS =====================

export async function requestDeletion(studentId: string, studentName: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('deletion_requests')
    .insert({
      student_id: studentId,
      student_name: studentName,
      requested_by: user.id,
    })
  if (error) throw error
}

export async function getDeletionRequests() {
  const { data, error } = await supabase
    .from('deletion_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function approveDeletionRequest(requestId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: request, error: fetchError } = await supabase
    .from('deletion_requests')
    .select('student_id')
    .eq('id', requestId)
    .single()
  if (fetchError) throw fetchError

  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .eq('id', request.student_id)
  if (deleteError) throw deleteError

  const { error: updateError } = await supabase
    .from('deletion_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
  if (updateError) throw updateError
}

export async function rejectDeletionRequest(requestId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('deletion_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
  if (error) throw error
}

export async function getDeletionRequestsForStudent(studentId: string) {
  const { data, error } = await supabase
    .from('deletion_requests')
    .select('id, status')
    .eq('student_id', studentId)
    .in('status', ['pending'])
  if (error) throw error
  return data
}

// ===================== REGISTRATIONS =====================

export async function submitPublicRegistration(data: Record<string, unknown>) {
  const { error } = await supabase.from('registrations').insert({
    data,
    submission_type: 'online',
    student_name: (data['Full Name'] as string) || 'Unknown',
    student_phone: (data['Phone Number'] as string) || null,
  })
  if (error) throw error
}

export async function submitStaffRegistration(data: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('registrations').insert({
    data,
    submission_type: 'staff',
    staff_id: user.id,
    student_name: (data['Full Name'] as string) || 'Unknown',
    student_phone: (data['Phone Number'] as string) || null,
  })
  if (error) throw error
}

export async function getRegistrations() {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getStaffNames(staffIds: string[]) {
  if (staffIds.length === 0) return {}
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .in('id', staffIds)
  if (error) return {}
  const map: Record<string, string> = {}
  data?.forEach((u: { id: string; name: string }) => { map[u.id] = u.name })
  return map
}

export async function updateRegistrationStatus(id: string, status: 'approved' | 'rejected') {
  const { error } = await supabase
    .from('registrations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function getRegistrationStats() {
  const { data, error } = await supabase
    .from('registrations')
    .select('submission_type, status, created_at')
  if (error) throw error

  const total = data.length
  const online = data.filter(r => r.submission_type === 'online').length
  const byStaff = data.filter(r => r.submission_type === 'staff').length
  const statusCounts = {
    pending: data.filter(r => r.status === 'pending').length,
    approved: data.filter(r => r.status === 'approved').length,
    rejected: data.filter(r => r.status === 'rejected').length,
  }

  return { total, online, byStaff, statusCounts }
}
