'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { User } from '@/lib/types'

export async function updateProfile(data: Partial<Pick<User, 'name' | 'bio' | 'location' | 'is_open_to_work'>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('users').update(data).eq('id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/about')
  revalidatePath('/dashboard')
}
