import {
  LocationProvider,
  Router,
  Route,
  hydrate,
  prerender as ssr,
  lazy,
} from "preact-iso";

import "./style.css";
import { Header } from "./components/Header.jsx";
import { Home } from "./pages/Home/index.jsx";
import { NotFound } from "./pages/_404.jsx";
import { Room } from "./pages/Room/index.jsx";
const About = lazy(() => import("./pages/About/index"));

export function App() {
  return (
    <LocationProvider>
      <Header />
      <main>
        <div className="container">
          <Router>
            <Route path="/" component={Home} />
            <Route path="/room" component={Room} />
            <Route path="/about" component={About} />
            <Route default component={NotFound} />
          </Router>
        </div>
      </main>
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
