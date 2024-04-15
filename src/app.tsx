import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { Main } from "./main";
import "./app.css";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { SpinnerCircularFixed } from "spinners-react";

export function App() {
  const { pathname } = useLocation();
  return (
    <>
      <AuthLoading>
        <section className="todoapp">
          <header className="header" data-testid="header">
            <h1>todos.ai</h1>
          </header>
        </section>
        <div className="auth-loading-container">
          <SpinnerCircularFixed
            size={50}
            thickness={155}
            speed={146}
            color="rgba(184, 63, 69, 1)"
            secondaryColor="rgba(255, 255, 255, 0.12)"
          />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <section className="todoapp">
          <header className="header" data-testid="header">
            <h1>todos.ai</h1>
          </header>
        </section>
        <div className="login-container">
          {pathname === "/sign-up" && <SignUp signInUrl="/sign-in" />}
          {pathname !== "/sign-up" && <SignIn signUpUrl="/sign-up" />}
        </div>
      </Unauthenticated>
      <Authenticated>
        <Main />
      </Authenticated>
    </>
  );
}
