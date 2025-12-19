import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Gamepad2, 
  Trophy, 
  User, 
  Wallet, 
  Menu, 
  X,
  Zap 
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Home", icon: Gamepad2 },
  { href: "/lobby", label: "Lobby", icon: Zap },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
            >
              <Gamepad2 className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="font-pixel text-xs text-foreground group-hover:text-primary transition-colors">
                LINERA
              </h1>
              <p className="text-[10px] text-muted-foreground">GAME STATION</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const Icon = link.icon;
              
              return (
                <Link key={link.href} to={link.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 relative ${
                      isActive 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Wallet Connect */}
          <div className="flex items-center gap-2">
            <Button variant="neon" size="sm" className="hidden sm:flex gap-2">
              <Wallet className="w-4 h-4" />
              Connect
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          initial={false}
          animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const Icon = link.icon;
              
              return (
                <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              );
            })}
            <div className="pt-2">
              <Button variant="neon" className="w-full gap-2">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </nav>
  );
}
