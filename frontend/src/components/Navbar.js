import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`hover:text-blue-200 transition text-sm font-medium px-3 py-1 rounded-lg ${
        location.pathname === to
          ? 'bg-blue-800 text-white'
          : 'text-blue-100'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">
          ⚙️ BiztelAI Workflow
        </h1>
        <div className="flex gap-2">
          {navLink('/', '📁 Upload')}
          {navLink('/dashboard', '📊 Dashboard')}
          {navLink('/search', '🔍 Search')}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;