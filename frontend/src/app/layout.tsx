import type { Metadata, Viewport } from 'next';
import { fonts } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const title = 'GrowEasy AI CSV Importer';
const description =
  'Seamlessly map and import CRM contacts from arbitrary CSV structures using AI.';

export const metadata: Metadata = {
  title,
  description,
  applicationName: title,
  authors: [{ name: 'GrowEasy' }],
  keywords: ['CSV', 'Importer', 'AI', 'CRM', 'Contact', 'Data Mapping'],
  openGraph: {
    title,
    description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f12' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          fonts.sans.variable,
          fonts.mono.variable,
          'min-h-screen flex flex-col bg-background text-foreground font-sans antialiased',
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
