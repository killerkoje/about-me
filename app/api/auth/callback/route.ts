import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // provider_token(GitHub OAuth 토큰)을 암호화해서 DB에 저장
    if (data.session?.provider_token && data.user) {
      const encrypted = encrypt(data.session.provider_token)
      await supabase
        .from('users')
        .update({ github_token: encrypted })
        .eq('id', data.user.id)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
