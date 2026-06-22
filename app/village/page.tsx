'use client'

import dynamic from 'next/dynamic'

const VillageWorld = dynamic(
  () => import('@/components/village/VillageWorld'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#9ecce8', fontFamily: 'sans-serif',
        color: '#fff', fontSize: '13px', letterSpacing: '0.12em', fontWeight: 700,
      }}>
        마을 불러오는 중...
      </div>
    ),
  }
)

export default function VillagePage() {
  return <VillageWorld />
}
