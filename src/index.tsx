import { render } from "react-dom";
import { HashRouter, Route, Routes } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";

import { App } from "./todo/app";
import "todomvc-app-css/index.css";

const convex = new ConvexReactClient(process.env.CONVEX_URL);

render(
  <ConvexProvider client={convex}>
    <HashRouter>
      <Routes>
        <Route path="*" element={<App />} />
      </Routes>
    </HashRouter>
  </ConvexProvider>,
  document.getElementById("root"),
);
