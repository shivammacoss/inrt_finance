import './admin-profitvision.css';
import { AdminProviders } from './admin-providers';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProviders>{children}</AdminProviders>;
}
