"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UserCircle, ImageIcon, MessageSquare, Send, Settings, Briefcase, Images, Menu, LogOut, LogIn as LogInIcon, Sparkles } from 'lucide-react';
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

// brandForgeAppLogoDataUri constant removed

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
              "sidebar-nav-item",
              pathname === item.href 
                ? "active shadow-md" 
                : ""
            )}
            asChild
          >
            <a>
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="text-break">{item.label}</span>
            </a>
          </Button>
        </Link>
      ))}
    </nav>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="p-4 border-b border-sidebar-border">
        <Link 
          href={user ? "/dashboard" : "/"} 
          className="flex items-center gap-3 text-sidebar-foreground hover:text-sidebar-primary transition-colors duration-200"
        >
          <div className="p-2 bg-sidebar-primary/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-break">BrandForge AI</h1>
            <p className="text-xs text-sidebar-foreground/70">AI-Powered Branding</p>
          </div>
        </Link>
      </div>
      {user && <SidebarNav />}
      <div className={cn("p-4 mt-auto border-t border-sidebar-border", !user && "mt-auto")}>
        {user ? (
          <Button 
            variant="ghost" 
            className="sidebar-nav-item"
          >
            <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-break">Settings</span>
          </Button>
        ) : (
          <div className="space-y-3">
             <Button 
               variant="default" 
               className="w-full justify-center btn-gradient-primary touch-target" 
               asChild
             >
                <Link href="/login">
                    <LogInIcon className="mr-2 w-4 h-4"/> 
                    <span>Log In</span>
                </Link>
             </Button>
             <Button 
               variant="outline" 
               className="w-full justify-center text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground touch-target" 
               asChild
             >
                 <Link href="/signup">
                   <span>Sign Up</span>
                 </Link>
             </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex md:flex-col md:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg">
        <SidebarContent />
      </aside>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-card border-b md:justify-end card-enhanced">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="touch-target focus-enhanced"
                >
                  <Menu className="w-6 h-6" />
                  <span className="sr-only">Open navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="p-0 w-64 bg-sidebar text-sidebar-foreground border-r-0"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Main Navigation Menu</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
          <AuthUserMenu />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto container-responsive">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function AuthUserMenu() {
  const { user, logOut, isLoading } = useAuth();

  if (isLoading) {
    return <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="hidden sm:flex touch-target focus-enhanced" 
          asChild
        >
          <Link href="/login">
            <LogInIcon className="mr-2 h-4 w-4" /> 
            <span>Log In</span>
          </Link>
        </Button>
        <Button 
          variant="default" 
          size="sm"
          className="btn-gradient-primary touch-target focus-enhanced" 
          asChild
        >
          <Link href="/signup">
            <span className="hidden sm:inline">Sign Up</span>
            <span className="sm:hidden">Join</span>
          </Link>
        </Button>
      </div>
    );
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : <UserCircle className="w-5 h-5"/>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full p-0 touch-target focus-enhanced"
        >
          <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
            {user.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName || user.email || "User"} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 card-enhanced" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-break">
              {user.displayName || user.email?.split('@')[0] || "User"}
            </p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground text-break">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => logOut()}
          className="focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
