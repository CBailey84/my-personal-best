import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AppLayout from "./components/AppLayout";
import Profile from "./pages/Profile";
import Goals from "./pages/Goals";
import Challenges from "./pages/Challenges";
import PersonalBests from "./pages/PersonalBests";
import EmptyPage from "./pages/EmptyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppLayout />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/workout" element={<EmptyPage title="WORKOUT" description="Log and plan your workouts." />} />
            <Route path="/pb" element={<PersonalBests />} />
            <Route path="/assistant" element={<EmptyPage title="ASSISTANT" description="Your AI training companion." />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
