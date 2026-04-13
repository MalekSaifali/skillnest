'use client';

import Navbar from './components/Navbar';
import { usePathname } from 'next/navigation';

const authPages = ['/login', '/signup'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = !authPages.includes(pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
}
