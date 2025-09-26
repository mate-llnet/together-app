import PublicHeader from "./public-header";
import PublicFooter from "./public-footer";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" data-testid="public-layout">
      <PublicHeader />
      <main className="flex-1" data-testid="main-content">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}