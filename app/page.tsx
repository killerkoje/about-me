export default function Home() {
  return (
    <div className="flex h-screen font-sans">
      {/* 왼쪽 패널 - 소셜 링크 */}
      <aside className="w-44 flex flex-col gap-8 py-10 px-8 bg-white border-r border-gray-100 shrink-0">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Portfolio</span>
        <nav className="flex flex-col gap-4">
          <a
            href="https://github.com/LEEHEEWON123"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-900 hover:text-black transition-colors duration-200"
          >
            Github.
          </a>
          <a
            href="https://www.linkedin.com/in/%ED%9D%AC%EC%9B%90-%EC%9D%B4-a22402360/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-900 hover:text-black transition-colors duration-200"
          >
            LinkedIn.
          </a>
          <a
            href="/projects"
            className="text-sm text-gray-900 hover:text-black transition-colors duration-200"
          >
            Projects.
          </a>
        </nav>
        <span className="text-[11px] text-gray-500">leeheewon © 2026</span>
      </aside>

      {/* 오른쪽 패널 - 메인 소개 */}
      <main className="flex-1 bg-gray-100 flex items-center px-16 py-12">
        <div className="max-w-lg">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-6">Developer</p>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-8">
            이희원<br />입니다.
          </h1>
          <p className="text-sm text-gray-500 leading-8">
            제가 만든 서비스에 접속하는 누구나<br />
            설명없이 간편하고 쉽게 이용할 수 있습니다.<br />
            끊임없이 아이디어를 내고 설명이 필요없고<br />
            간편하며 임팩트 있는 서비스를 구성하는<br />
            개발자를 꿈꾸고 있습니다.
          </p>
        </div>
      </main>
    </div>
  )
}
