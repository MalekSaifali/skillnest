'use client';

import { Amplify } from '@aws-amplify/core';
import awsConfig from '../amplify-config';
import Navbar from './components/Navbar';
import { usePathname } from 'next/navigation';

Amplify.configure(awsConfig as any);

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
