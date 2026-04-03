'use client';

import { useAdminData } from '@/lib/admin-data-context';
import { AdminChrome } from '@/components/admin/AdminChrome';
import { AdminBackLink } from '@/components/admin/AdminBackLink';

export default function AdminUsersPage() {
  const { users } = useAdminData();

  return (
    <AdminChrome title="Users" subtitle="Accounts & balances" loginNext="/admin/users">
      <section className="adminPvSection">
        <div className="adminPvCard">
          <h3>Users</h3>
          <div className="adminPvTableWrap">
            <table className="adminPvTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Balance</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={String(u.id || u.email)}>
                    <td
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                        maxWidth: '14rem',
                      }}
                    >
                      {u.id || '—'}
                    </td>
                    <td>{u.email}</td>
                    <td style={{ fontFamily: 'ui-monospace, monospace' }}>{u.balance}</td>
                    <td>{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <AdminBackLink />
      </section>
    </AdminChrome>
  );
}
