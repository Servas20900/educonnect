import { Outlet } from "react-router-dom";
import { useState } from "react";
import Header from "../components/Header";
import Aside from "../components/Aside";

export default function InternalLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={() => setOpen((prev) => !prev)} />

      <div className="flex flex-1">
        {/* Aside */}
        <Aside open={open} onClose={() => setOpen(false)} />

        {/* Main content */}
        <main className="flex-1 bg-gray-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
