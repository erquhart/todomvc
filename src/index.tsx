import { render } from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { App } from "./app";
import "todomvc-app-css/index.css";
import { CLERK_PUBLISHABLE_KEY, CONVEX_URL } from "./env";

const convex = new ConvexReactClient(CONVEX_URL);

render(
  <ClerkProvider
    publishableKey={CLERK_PUBLISHABLE_KEY}
    appearance={{ variables: { colorPrimary: "#b83f45" } }}
  >
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ConvexProviderWithClerk>
  </ClerkProvider>,
  document.getElementById("root"),
);
