import type { Metadata } from 'next';
import ClientLayout from './ClientLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillNest',
  description: 'Skill exchange platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0f172a' }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
