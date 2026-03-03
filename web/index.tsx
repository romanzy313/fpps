import {
  LocationProvider,
  Router,
  Route,
  hydrate,
  prerender as ssr,
  lazy,
} from "preact-iso";

import "./style.css";
import "./displayUnhandledErrors";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { PrerenderResult } from "preact-iso/prerender";
import { ToastContainer } from "react-toastify";
import { TransferLockProvider } from "./context/TransferLock";
import { useTestWebRTC } from "./hooks/useTestWebRTC";

const Home = lazy(() => import("./pages/home/index"));
const Room = lazy(() => import("./pages/room/index"));
const About = lazy(() => import("./pages/about/index"));

export function App() {
  useTestWebRTC();

  return (
    <LocationProvider>
      <TransferLockProvider>
        <Header />
        <main>
          <Router>
            <Route path="/" component={Home} />
            <Route path="/room" component={Room} />
            <Route path="/about" component={About} />
            <Route default component={() => <div>Page not found</div>} />
          </Router>
        </main>
        <Footer />
        <ToastContainer
          position="top-center"
          pauseOnHover
          pauseOnFocusLoss
          theme="dark"
        />
      </TransferLockProvider>
    </LocationProvider>
  );
}

if (typeof window !== "undefined") {
  hydrate(<App />, document.getElementById("app")!);
}

export async function prerender(): Promise<PrerenderResult> {
  const res = await ssr(<App />);

  return res;
}
