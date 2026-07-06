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
import SignIn from "@/pages/SignIn";
import WisdomWall from "@/pages/WisdomWall";
import Profile from "@/pages/Profile";
import AIMatching from "@/pages/AIMatching";
import PreCallConsent from "@/pages/PreCallConsent";
import VideoCall from "@/pages/VideoCall";
import StoryCapture from "@/pages/StoryCapture";
import Help from "@/pages/Help";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// There's no more auto-seeded default user, so pages that assume a real
// signed-in person (calls, profile, matching) must bounce anonymous
// visitors back to sign-in instead of rendering with a null user.
function RequireAuth({ component: Component }: { component: ComponentType }) {
  const { user } = useApp();
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
            <Router />
          </WouterRouter>
          <Toaster />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
