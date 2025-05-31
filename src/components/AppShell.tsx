
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

const brandForgeAppLogoDataUri = "data:image/svg+xml,%3Csvg%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%224%22%20fill%3D%22hsl(180%2C%2050%25%2C%2040%25)%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22system-ui%2C%20sans-serif%22%20font-size%3D%2215%22%20font-weight%3D%22300%22%20fill%3D%22hsl(45%2C%2080%25%2C%2060%25)%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3EBF%3C%2Ftext%3E%3C%2Fsvg%3E";

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
            src={brandForgeAppLogoDataUri}
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
