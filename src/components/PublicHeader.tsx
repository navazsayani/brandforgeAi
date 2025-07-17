
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, UserPlus, Sparkles, CreditCard, Newspaper, Layers, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CompactThemeToggle } from './ThemeToggle';

export default function PublicHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const navLinks = [
    { href: '/features', label: 'Features', icon: Layers },
    { href: '/blog', label: 'Blog', icon: Newspaper },
    { href: '/plans', label: 'Pricing', icon: CreditCard },
  ];

  const MobileNavMenu = () => (
    <Sheet>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open Menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full max-w-xs bg-sidebar text-sidebar-foreground border-r-0 flex flex-col">
            <SheetHeader className="p-4 border-b border-sidebar-border">
                <SheetTitle>
                    <Link href="/" className="flex items-center gap-3">
                        <Sparkles className="h-7 w-7 text-primary" />
                        <span className="text-xl font-bold text-gradient-brand">BrandForge AI</span>
                    </Link>
                </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col space-y-2 p-4 flex-grow">
                {navLinks.map((link) => (
                    <Button key={link.href} variant="ghost" className={cn("justify-start text-base py-3", pathname.startsWith(link.href) && "text-primary bg-primary/10")} asChild>
                        <Link href={link.href}>
                            <link.icon className="mr-3 h-5 w-5" />
                            <span>{link.label}</span>
                        </Link>
                    </Button>
                ))}
            </nav>
            <div className="p-4 border-t border-sidebar-border/50 mt-auto">
              <CompactThemeToggle />
            </div>
        </SheetContent>
    </Sheet>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container-responsive flex items-center justify-between h-18">
            <Link href="/" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors duration-200">
                <Sparkles className="h-7 w-7 text-primary" />
                <span className="hidden sm:inline-block text-xl font-bold text-gradient-brand">BrandForge AI</span>
            </Link>

            <div className="flex items-center gap-2">
                {/* Desktop Navigation */}
                <div className="hidden sm:flex items-center gap-2">
                    {navLinks.map((link) => (
                        <Button key={link.href} variant="ghost" className={cn("focus-enhanced", pathname.startsWith(link.href) && "text-primary bg-primary/10")} asChild>
                            <Link href={link.href}>
                                <span>{link.label}</span>
                            </Link>
                        </Button>
                    ))}
                    <CompactThemeToggle />
                </div>
                
                {/* Auth buttons, always visible if not logged in */}
                {!user && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" className={cn("focus-enhanced", pathname.startsWith('/login') && "text-primary bg-primary/10")} asChild>
                            <Link href="/login" className="flex items-center">
                                <LogIn className="mr-2 h-5 w-5" />
                                <span>Log In</span>
                            </Link>
                        </Button>
                        <Button className="btn-gradient-primary focus-enhanced" asChild>
                            <Link href="/signup" className="flex items-center">
                                <UserPlus className="mr-2 h-5 w-5" />
                                <span>Get Started</span>
                            </Link>
                        </Button>
                    </div>
                )}
                
                {/* Mobile Hamburger Menu */}
                <div className="sm:hidden">
                    <MobileNavMenu />
                </div>
            </div>
        </div>
    </header>
  );
}
