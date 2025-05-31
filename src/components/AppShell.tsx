
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NextImage from 'next/image'; // Added NextImage
import { Home, UserCircle, ImageIcon, MessageSquare, Send, Settings, Briefcase, Images, Menu, LogOut, LogIn as LogInIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/brand-profile', label: 'Brand Profile', icon: UserCircle },
  { href: '/content-studio', label: 'Content Studio', icon: ImageIcon },
  { href: '/image-library', label: 'Image Library', icon: Images },
  { href: '/campaign-manager', label: 'Campaign Manager', icon: Briefcase },
  { href: '/deployment-hub', label: 'Deployment Hub', icon: Send },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const SidebarNav = () => (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {navItems.map((item) => (
        <Link key={item.label} href={item.href} legacyBehavior passHref>
          <Button
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start",
              pathname === item.href 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            as="a" 
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary-foreground">
          <NextImage 
            src="https://placehold.co/32x32.png" 
            alt="BrandForge AI Logo" 
            width={32} 
            height={32} 
            className="rounded-sm"
            data-ai-hint="AI forge" 
          />
          <h1 className="text-xl font-bold">BrandForge AI</h1>
        </Link>
      </div>
      {user && <SidebarNav />}
      <div className={cn("p-4 mt-auto border-t border-sidebar-border", !user && "mt-auto")}>
        {user ? (
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Button>
        ) : (
          <div className="space-y-2">
             <Button variant="default" className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="/login">
                    <LogInIcon className="mr-2"/> Log In
                </Link>
             </Button>
             <Button variant="outline" className="w-full justify-center text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
                 <Link href="/signup">Sign Up</Link>
             </Button>
          </div>
        )}
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
                  <Menu className="w-6 h-6" />
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
          <AuthUserMenu />
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function AuthUserMenu() {
  const { user, logOut, isLoading } = useAuth();

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/login">
            <LogInIcon className="mr-2 h-4 w-4" /> Log In
          </Link>
        </Button>
        <Button variant="default" asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : <UserCircle className="w-5 h-5"/>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-9 w-9">
            {user.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName || user.email || "User"} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || user.email?.split('@')[0] || "User"}
            </p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
