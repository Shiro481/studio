
import type {Metadata} from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'SwiftAttend',
  description: 'QR Code Attendance System',
  manifest: '/manifest.json',
  themeColor: '#29ABE2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SwiftAttend',
  },
  icons: {
    apple: '/icon-192x192.png',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
          {children}
        <Toaster />
      </body>
    </html>
  );
}
