import '../admin/admin-profitvision.css';
import './wallet-dashboard.css';
import { DashboardAppShell } from '@/components/dashboard/DashboardAppShell';
import { DashboardProviders } from './dashboard-providers';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProviders>
      <DashboardAppShell>{children}</DashboardAppShell>
    </DashboardProviders>
  );
}
