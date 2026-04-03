import { redirect } from 'next/navigation';

/** Legacy standalone wallet UI removed; use /dashboard */
export default function LegacyWalletRedirect() {
  redirect('/dashboard');
}
