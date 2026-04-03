import Link from 'next/link';

export function DashboardBackLink({ href = '/dashboard', label = '← Back to portfolio' }: { href?: string; label?: string }) {
  return (
    <p style={{ marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--pv-muted)' }}>
      <Link href={href} className="underline" style={{ color: 'var(--pv-text)' }}>
        {label}
      </Link>
    </p>
  );
}
