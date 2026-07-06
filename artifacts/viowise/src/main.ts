import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./style.css";

import Landing from "./pages/Landing.vue";
import SignUp from "./pages/SignUp.vue";
import OnboardingTopics from "./pages/OnboardingTopics.vue";
import IdVerification from "./pages/IdVerification.vue";
import Verified from "./pages/Verified.vue";
import SignIn from "./pages/SignIn.vue";
import WisdomWall from "./pages/WisdomWall.vue";
import Profile from "./pages/Profile.vue";
import AIMatching from "./pages/AIMatching.vue";
import PreCallConsent from "./pages/PreCallConsent.vue";
import VideoCall from "./pages/VideoCall.vue";
import StoryCapture from "./pages/StoryCapture.vue";
import Help from "./pages/Help.vue";
import NotFound from "./pages/NotFound.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: Landing },
    { path: "/sign-up", component: SignUp },
    { path: "/topics", component: OnboardingTopics },
    { path: "/verify-id", component: IdVerification },
    { path: "/verified", component: Verified },
    { path: "/sign-in", component: SignIn },
    { path: "/wall", component: WisdomWall },
    { path: "/profile", component: Profile },
    { path: "/matching", component: AIMatching },
    { path: "/pre-call", component: PreCallConsent },
    { path: "/video-call", component: VideoCall },
    { path: "/story-capture", component: StoryCapture },
    { path: "/help", component: Help },
    { path: "/:pathMatch(.*)*", component: NotFound },
  ],
});

const app = createApp(App);
app.use(router);
app.mount("#app");
