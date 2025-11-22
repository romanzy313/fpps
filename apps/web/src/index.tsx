import {
  LocationProvider,
  Router,
  Route,
  hydrate,
  prerender as ssr,
} from "preact-iso";

import { Header } from "./components/Header.jsx";
import { Home } from "./pages/Home/index.jsx";
import { NotFound } from "./pages/_404.jsx";
import "./style.css";

export function App() {
  return (
    <LocationProvider>
      <Header />
      <main>
        <div className="container">
          <Router>
            <Route path="/" component={Home} />
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
