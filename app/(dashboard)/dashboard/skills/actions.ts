'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Skill } from '@/lib/types'

export async function createSkill(data: Omit<Skill, 'id' | 'user_id' | 'order'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('skills').insert({ ...data, user_id: user.id })
  if (error) throw error
  revalidatePath('/dashboard/skills')
}

export async function updateSkill(id: string, data: Partial<Omit<Skill, 'id' | 'user_id'>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('skills').update(data).eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/skills')
}

export async function deleteSkill(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('skills').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/skills')
}
