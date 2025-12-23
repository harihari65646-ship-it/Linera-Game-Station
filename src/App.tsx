import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { LineraProvider } from "@/contexts/LineraProvider";
import { BlockchainActivityIndicator } from "@/components/blockchain/BlockchainActivityIndicator";
import LandingPage from "./pages/LandingPage";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import TournamentsPage from "./pages/TournamentsPage";
import SocialPage from "./pages/SocialPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LineraProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/games/:gameType" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/social" element={<SocialPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Blockchain Activity Indicator - Shows proof of local Linera connection */}
          <BlockchainActivityIndicator />
        </BrowserRouter>
      </TooltipProvider>
    </LineraProvider>
  </QueryClientProvider>
);

export default App;

