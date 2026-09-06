import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/AppLayout';

export const metadata = {
  title: 'Nexo Medico AI — Hospital Management & Clinical Decision Platform',
  description: 'Complete multi-tenant hospital management and explainable AI healthcare ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 min-h-screen text-slate-100">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
