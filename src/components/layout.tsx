import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, PlusCircle, History, Trophy, Settings } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/history", label: "History", icon: History },
    { href: "/add", label: "Add", icon: PlusCircle },
    { href: "/achievements", label: "Vault", icon: Trophy },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar h-full">
        <div className="p-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Trophy className="w-6 h-6" />
            <span>Vault</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.slice(0, -1).map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Settings pinned at bottom */}
        <div className="px-4 pb-6">
          <Link href="/settings">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                location === "/settings"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
              data-testid="link-settings"
            >
              <Settings className={`w-5 h-5 ${location === "/settings" ? "text-primary" : ""}`} />
              Settings
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="md:hidden p-4 border-b flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Trophy className="w-5 h-5" />
            <span>Vault</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 backdrop-blur-md pb-safe">
        <div className="flex items-end justify-around px-2 pt-2 pb-3">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const isAdd = item.href === "/add";

            if (isAdd) {
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl cursor-pointer transition-transform active:scale-95 ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="link-nav-add"
                  >
                    <item.icon className={`w-8 h-8 mb-1 ${isActive ? "text-primary" : ""}`} />
                    <span className="text-[9px] font-medium">Add</span>
                  </div>
                </Link>
              );
            }

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl cursor-pointer ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className={`w-5 h-5 mb-1 ${isActive ? "text-primary" : ""}`} />
                  <span className="text-[9px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
