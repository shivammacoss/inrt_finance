import '../landing.css';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lp-root">
      <div className="lp-mesh" aria-hidden />
      <LandingNav />
      <main className="lp-main">{children}</main>
      <LandingFooter />
    </div>
  );
}
