import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/hooks/use-app";

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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/verify-id" component={IdVerification} />
      <Route path="/select-topics" component={TopicSelection} />
      <Route path="/verified" component={Verified} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/wall" component={WisdomWall} />
      <Route path="/profile" component={Profile} />
      <Route path="/matching" component={AIMatching} />
      <Route path="/pre-call" component={PreCallConsent} />
      <Route path="/video-call" component={VideoCall} />
      <Route path="/story-capture" component={StoryCapture} />
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
