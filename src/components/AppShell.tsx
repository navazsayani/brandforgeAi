
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UserCircle, ImageIcon, MessageSquare, BarChart2, Send, Settings, Briefcase, Images } from 'lucide-react'; // Added Images
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/brand-profile', label: 'Brand Profile', icon: UserCircle },
  { href: '/content-studio', label: 'Content Studio', icon: ImageIcon },
  { href: '/image-library', label: 'Image Library', icon: Images }, // Added Image Library
  { href: '/campaign-manager', label: 'Campaign Manager', icon: Briefcase },
  { href: '/deployment-hub', label: 'Deployment Hub', icon: Send },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary-foreground">
          <BarChart2 className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold">BrandForge AI</h1>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href}>
            <Button
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                pathname === item.href 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 mt-auto border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex md:flex-col md:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <SidebarContent />
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 bg-card border-b md:justify-end">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Home className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-r-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Main Navigation Menu</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function UserMenu() {
  return (
    <div className="flex items-center gap-2 p-2 rounded-full cursor-pointer hover:bg-accent">
      <UserCircle className="w-8 h-8 text-primary" />
      <span className="hidden font-medium md:inline">User Name</span>
    </div>
  );
}
