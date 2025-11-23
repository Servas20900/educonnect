import { Outlet } from "react-router-dom";

export default function ExternalLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-6">
          <Outlet />
        </div>
      </main>

      <footer className="text-center text-sm text-gray-500 py-4">
        © {new Date().getFullYear()} EduConnect
      </footer>
    </div>
  );
}
