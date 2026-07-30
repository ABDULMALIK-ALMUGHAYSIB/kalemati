import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Field, TextInput } from "../components/FormFields";
import { SegmentedControl } from "../components/SegmentedControl";
import { supabase } from "../supabaseClient";

export function AuthPage() {
  const [mode, setMode] = useState("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (!email.trim() || password.length < 6) {
      setAuthError("Enter your email and a password with at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        email: email.trim(),
        password
      };
      const { error } =
        mode === "Sign in"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp(credentials);

      if (error) throw error;

      if (mode === "Create account") {
        setAuthMessage("Account created. Check your email if Supabase asks for confirmation.");
      }
    } catch (error) {
      setAuthError(error.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-header">
        <div className="auth-mark" aria-hidden="true">K</div>
        <div>
          <span className="auth-eyebrow">Kalemati account</span>
          <h1>{mode === "Sign in" ? "Welcome back" : "Create your account"}</h1>
          <p>{mode === "Sign in" ? "Continue to your vocabulary." : "Start saving your words."}</p>
        </div>
      </div>

      <div className="auth-tabs">
        <SegmentedControl
          label="Authentication mode"
          options={["Sign in", "Create account"]}
          value={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            setAuthError("");
            setAuthMessage("");
          }}
        />
      </div>

      <form className="word-form" onSubmit={handleSubmit}>
        <Field label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            autoComplete={mode === "Sign in" ? "current-password" : "new-password"}
          />
        </Field>

        {authError ? <p className="error-note" role="alert">{authError}</p> : null}
        {authMessage ? <p className="success-note" role="status">{authMessage}</p> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}
          {loading ? "Please wait..." : mode}
        </button>
      </form>
    </section>
  );
}
