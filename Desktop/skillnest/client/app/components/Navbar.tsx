'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('sn_token');
    router.push('/login');
  };

const navItems = [
    { label: '🏠 Dashboard', path: '/dashboard' },
    { label: '📰 Feed', path: '/feed' },
    { label: '👥 Discover', path: '/users' },
    { label: '💬 Chat', path: '/chat' },
    { label: '⚙️ Profile', path: '/profile' },
  ];

  return (
    <nav style={navStyle}>
      {/* Logo */}
      <div
        onClick={() => router.push('/dashboard')}
        style={logoStyle}
      >
        SkillNest
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={pathname === item.path ? activeLinkStyle : linkStyle}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={logoutStyle}>
        🚪 Logout
      </button>
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 32px',
  background: '#1e293b',
  borderBottom: '1px solid #334155',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const logoStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '800',
  color: '#38bdf8',
  cursor: 'pointer',
  letterSpacing: '-0.5px',
};

const linkStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
};

const activeLinkStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#0f172a',
  border: '1px solid #38bdf8',
  borderRadius: '8px',
  color: '#38bdf8',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
};

const logoutStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#ef4444',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
};