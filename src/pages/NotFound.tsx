import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gamepad2, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-destructive/20 rounded-full blur-[100px]" />
      
      <div className="relative z-10 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-xl bg-muted/50 flex items-center justify-center border border-border">
          <Gamepad2 className="w-12 h-12 text-muted-foreground" />
        </div>
        
        <h1 className="font-pixel text-4xl md:text-6xl text-neon-pink mb-4">404</h1>
        <p className="font-pixel text-sm text-foreground mb-2">GAME OVER</p>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button variant="arcade" className="gap-2">
              <Home className="w-4 h-4" /> Return Home
            </Button>
          </Link>
          <Link to="/lobby">
            <Button variant="outline" className="gap-2">
              <Gamepad2 className="w-4 h-4" /> Go to Lobby
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
