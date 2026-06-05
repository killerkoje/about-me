'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Project } from '@/lib/types'

export async function createProject(data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'order'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('projects').insert({ ...data, user_id: user.id })
  if (error) throw error
  revalidatePath('/dashboard/projects')
}

export async function updateProject(id: string, data: Partial<Project>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('projects').update(data).eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/projects')
}

export async function deleteProject(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/projects')
}

export async function updateProjectOrder(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await Promise.all(
    ids.map((id, index) =>
      supabase.from('projects').update({ order: index }).eq('id', id).eq('user_id', user.id)
    )
  )
  revalidatePath('/dashboard/projects')
}
