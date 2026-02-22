import {
  LocationProvider,
  Router,
  Route,
  hydrate,
  prerender as ssr,
  lazy,
} from "preact-iso";

import "./style.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

const NotFound = lazy(() => import("./pages/_404"));
const Home = lazy(() => import("./pages/home/index"));
const Room = lazy(() => import("./pages/room/index"));
const About = lazy(() => import("./pages/about/index"));

export function App() {
  return (
    <LocationProvider>
      <Header />
      <main>
        <Router>
          <Route path="/" component={Home} />
          <Route path="/room" component={Room} />
          <Route path="/about" component={About} />
          <Route default component={NotFound} />
        </Router>
      </main>
      <Footer />
    </LocationProvider>
  );
}

if (typeof window !== "undefined") {
  hydrate(<App />, document.getElementById("app")!);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function prerender(data: any) {
  return await ssr(<App {...data} />);
}
