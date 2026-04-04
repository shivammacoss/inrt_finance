import './admin-profitvision.css';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { AdminProviders } from './admin-providers';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProviders>
      <AdminAppShell>{children}</AdminAppShell>
    </AdminProviders>
  );
}
