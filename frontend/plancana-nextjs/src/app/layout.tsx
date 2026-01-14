import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Plancana",
  description: "Blockchain-based agricultural supply chain tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') ||
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <AuthProvider>
            <div className="App">
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: '',
                  style: {
                    background: 'rgb(var(--color-card, 255 255 255) / 1)',
                    color: 'rgb(var(--color-foreground, 0 0 0) / 1)',
                    border: '1px solid rgb(var(--color-border, 229 231 235) / 1)',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: 'white',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: 'white',
                    },
                  },
                }}
              />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
