import Link from 'next/link';

export function AdminBackLink({ href = '/admin', label = '← Back to overview' }: { href?: string; label?: string }) {
  return (
    <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--pv-muted)' }}>
      <Link href={href} className="underline" style={{ color: 'var(--pv-text)' }}>
        {label}
      </Link>
    </p>
  );
}
