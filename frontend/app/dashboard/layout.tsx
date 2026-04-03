import '../admin/admin-profitvision.css';
import './wallet-dashboard.css';
import { DashboardProviders } from './dashboard-providers';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardProviders>{children}</DashboardProviders>;
}
