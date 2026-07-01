import { supabase } from './supabase'

export async function getCustomFields() {
  const { data, error } = await supabase
    .from('custom_fields')
    .select('*')
    .order('sort_order', { ascending: true })
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

export async function getActiveCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*, degree_programs(name)')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function submitPublicRegistration(data: Record<string, unknown>) {
  const { error } = await supabase.from('registrations').insert({
    data,
    submission_type: 'online',
    student_name: (data['Full Name'] as string) || 'Unknown',
    student_phone: (data['Phone Number'] as string) || null,
  })
  if (error) throw error
}
