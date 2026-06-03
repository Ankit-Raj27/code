"use client";

import { FormEvent, useState } from "react";
import { useApp } from "@/hooks/use-app";

export function AuthPanel() {
  const { signInWithEmail, session, signOut } = useApp();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const result = await signInWithEmail(email);
    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage("Signed in locally. Your entries can now sync with this email.");
    setEmail("");
  }

  if (session) {
    return (
      <section className="card">
        <h2>Signed in</h2>
        <p>{session.email}</p>
        <button className="button secondary" onClick={() => signOut()}>
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Email login</h2>
      <p>Enter your real email and the app will open immediately on this device, with no confirmation step.</p>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="friend@example.com"
            required
          />
        </label>
        <button className="button" type="submit">
          Continue
        </button>
      </form>
      {message ? <p className="success-copy">{message}</p> : null}
      {error ? <p className="error-copy">{error}</p> : null}
    </section>
  );
}
