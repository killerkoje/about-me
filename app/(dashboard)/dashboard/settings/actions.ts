'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { encrypt } from '@/lib/crypto'

export async function saveApiKey(apiKey: string): Promise<void> {
  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error('유효하지 않은 Anthropic API 키입니다. sk-ant-로 시작해야 합니다.')
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const encrypted = encrypt(apiKey)
  const { error } = await supabase
    .from('users')
    .update({ anthropic_api_key: encrypted })
    .eq('id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/settings')
}

export async function deleteApiKey(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('users')
    .update({ anthropic_api_key: null })
    .eq('id', user.id)
  if (error) throw error
  revalidatePath('/dashboard/settings')
}
