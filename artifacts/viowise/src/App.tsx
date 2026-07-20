import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/hooks/use-app";
import type { ComponentType } from "react";

import Landing from "@/pages/Landing";
import SignUp from "@/pages/SignUp";
import IdVerification from "@/pages/IdVerification";
import TopicSelection from "@/pages/TopicSelection";
import Verified from "@/pages/Verified";
import CheckEmail from "@/pages/CheckEmail";
import AuthCallback from "@/pages/AuthCallback";
import SignIn from "@/pages/SignIn";
import WisdomWall from "@/pages/WisdomWall";
import Profile from "@/pages/Profile";
import AIMatching from "@/pages/AIMatching";
import ScheduleCall from "@/pages/ScheduleCall";
import PreCallConsent from "@/pages/PreCallConsent";
import VideoCall from "@/pages/VideoCall";
import StoryCapture from "@/pages/StoryCapture";
import Help from "@/pages/Help";
import NotFound from "@/pages/not-found";
import VoiceNav from "@/components/VoiceNav";
import ScrollToTop from "@/components/ScrollToTop";
import SplashScreen from "@/components/SplashScreen";

const queryClient = new QueryClient();

// Guard auth-required routes. While the initial Supabase session is being
// restored (authLoading), render nothing so we don't flash-redirect a user
// who has a valid session to the sign-in page. Once resolved: redirect if
// there's no session, render the page if there is one.
function RequireAuth({ component: Component }: { component: ComponentType }) {
  const { user, authLoading } = useApp();
  if (authLoading) return null;
  if (!user) return <Redirect to="/sign-in" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/verify-id" component={IdVerification} />
      <Route path="/select-topics" component={TopicSelection} />
      <Route path="/verified" component={Verified} />
      <Route path="/check-email" component={CheckEmail} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/wall">
        <RequireAuth component={WisdomWall} />
      </Route>
      <Route path="/profile">
        <RequireAuth component={Profile} />
      </Route>
      <Route path="/matching">
        <RequireAuth component={AIMatching} />
      </Route>
      <Route path="/schedule">
        <RequireAuth component={ScheduleCall} />
      </Route>
      <Route path="/pre-call">
        <RequireAuth component={PreCallConsent} />
      </Route>
      <Route path="/video-call">
        <RequireAuth component={VideoCall} />
      </Route>
      <Route path="/story-capture">
        <RequireAuth component={StoryCapture} />
      </Route>
      <Route path="/help" component={Help} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <SplashScreen />
            <ScrollToTop />
            <Router />
            <VoiceNav />
          </WouterRouter>
          <Toaster />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
