import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import LayoutClient from './LayoutClient';

export const metadata: Metadata = {
  title: 'Airbnb Clone',
  description: 'Find your perfect stay',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" 
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AuthProvider>
          <ChatProvider>
            <LayoutClient>
              {children}
            </LayoutClient>
          </ChatProvider>
        </AuthProvider>
        
        <Script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}