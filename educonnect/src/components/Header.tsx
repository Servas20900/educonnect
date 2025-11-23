
export default function Header({ onMenuClick }: { onMenuClick: ()=>void }) {
  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={onMenuClick}
            aria-label="abrir menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-xl font-semibold">Panel administrativo</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm text-gray-600">Administrador</div>
          <button className="p-1 rounded-full bg-gray-100">
            <span className="sr-only">Abrir perfil</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2c0-2.757 2.243-5 5-5s5 2.243 5 5h2c0-3.866-3.134-7-7-7z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
