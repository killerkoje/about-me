'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Career } from '@/lib/types'

export async function createCareer(data: Omit<Career, 'id' | 'user_id' | 'order'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('careers').insert({ ...data, user_id: user.id })
  if (error) throw error
  revalidatePath('/dashboard/career')
}

export async function updateCareer(id: string, data: Partial<Omit<Career, 'id' | 'user_id'>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('careers').update(data).eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/career')
}

export async function deleteCareer(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('careers').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/career')
}
