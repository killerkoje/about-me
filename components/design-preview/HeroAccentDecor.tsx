'use client'

type Props = {
  name: string
  tagline: string
  showLabels?: boolean
}

export default function HeroAccentDecor({ name, tagline, showLabels = true }: Props) {
  return (
    <>
      <div
        className="absolute -top-8 -left-16 w-72 h-44 bg-[#c8e64a] -rotate-12 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute -bottom-12 -right-20 w-80 h-52 bg-[#c8e64a] rotate-6 pointer-events-none"
        aria-hidden
      />

      {showLabels && (
        <>
          <div className="absolute top-20 left-6 sm:left-10 z-20 pointer-events-none">
            <span className="inline-block bg-[#c8e64a] px-4 py-2 text-sm sm:text-base font-black tracking-tight text-gray-900 uppercase">
              {name.split(' ')[0]}
            </span>
          </div>
          <div className="absolute top-20 right-6 sm:right-10 z-20 pointer-events-none text-right">
            <span className="inline-block bg-[#c8e64a] px-4 py-2 text-sm sm:text-base font-black tracking-tight text-gray-900">
              {tagline}
            </span>
          </div>
        </>
      )}
    </>
  )
}
