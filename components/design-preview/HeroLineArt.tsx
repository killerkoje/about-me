'use client'

function DeskScene() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.35]"
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 책상 */}
      <rect x="80" y="380" width="640" height="12" stroke="#555" strokeWidth="1.5" />
      <line x1="120" y1="392" x2="100" y2="480" stroke="#555" strokeWidth="1.5" />
      <line x1="680" y1="392" x2="700" y2="480" stroke="#555" strokeWidth="1.5" />

      {/* 선반 */}
      <rect x="520" y="180" width="180" height="8" stroke="#555" strokeWidth="1.5" />
      <line x1="530" y1="188" x2="530" y2="380" stroke="#555" strokeWidth="1.5" />
      <line x1="690" y1="188" x2="690" y2="380" stroke="#555" strokeWidth="1.5" />

      {/* 지구본 */}
      <circle cx="570" cy="155" r="22" stroke="#555" strokeWidth="1.5" />
      <ellipse cx="570" cy="155" rx="22" ry="8" stroke="#555" strokeWidth="1" />
      <line x1="548" y1="155" x2="592" y2="155" stroke="#555" strokeWidth="1" />

      {/* 책들 */}
      <rect x="610" y="158" width="14" height="24" stroke="#555" strokeWidth="1.5" />
      <rect x="628" y="162" width="10" height="20" stroke="#555" strokeWidth="1.5" />
      <rect x="642" y="160" width="12" height="22" stroke="#555" strokeWidth="1.5" />

      {/* 어항 */}
      <ellipse cx="660" cy="320" rx="28" ry="32" stroke="#555" strokeWidth="1.5" />
      <path d="M640 340 Q660 360 680 340" stroke="#555" strokeWidth="1" />
      <circle cx="652" cy="325" r="3" stroke="#555" strokeWidth="1" />

      {/* 작은 공룡 */}
      <path d="M545 168 L555 178 L550 188 L540 178 Z" stroke="#555" strokeWidth="1.5" />
      <circle cx="548" cy="172" r="2" fill="#555" />

      {/* 사람 실루엣 */}
      <circle cx="280" cy="310" r="18" stroke="#555" strokeWidth="1.5" />
      <path d="M262 340 Q280 360 298 340 L298 380 L262 380 Z" stroke="#555" strokeWidth="1.5" />
      <line x1="298" y1="355" x2="330" y2="340" stroke="#555" strokeWidth="1.5" />
      <line x1="262" y1="355" x2="240" y2="375" stroke="#555" strokeWidth="1.5" />

      {/* 램프 */}
      <line x1="180" y1="200" x2="180" y2="320" stroke="#555" strokeWidth="1.5" />
      <path d="M160 200 Q180 180 200 200 L195 220 Q180 210 165 220 Z" stroke="#555" strokeWidth="1.5" />

      {/* 창문 프레임 */}
      <rect x="60" y="120" width="100" height="140" stroke="#555" strokeWidth="1.5" />
      <line x1="110" y1="120" x2="110" y2="260" stroke="#555" strokeWidth="1" />
      <line x1="60" y1="190" x2="160" y2="190" stroke="#555" strokeWidth="1" />
    </svg>
  )
}

export default function HeroLineArt() {
  return <DeskScene />
}
