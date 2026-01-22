'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define which pages should NOT have the global Navbar and Footer
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  // Also hide navbar/footer in full-screen chat
  const isChatPage = pathname?.startsWith('/messages/') && pathname.split('/').length > 2;

  return (
    <>
      {!isAuthPage && !isChatPage && <Navbar />}
      {children}
      {!isAuthPage && !isChatPage && <Footer />}
    </>
  );
}