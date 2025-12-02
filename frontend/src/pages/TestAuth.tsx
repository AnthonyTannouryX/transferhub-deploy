import { useState } from "react";
import { isAxiosError } from "axios";
import { initCsrf, login, me, logout, type User } from "@/lib/api"; // 👈 now exists

export default function TestAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await initCsrf();                    // 1) gets XSRF cookie
      await login({ email, password });    // 2) creates session
      const res = await me();              // 3) fetch current user
      setUser(res.data);
    } catch (e: unknown) {
      console.error(e);
      if (isAxiosError(e)) {
        // if your backend returns { message: string }
        const msg =
          (e.response?.data as { message?: string } | undefined)?.message ??
          e.response?.statusText ??
          "Login failed";
        setError(msg);
      } else {
        setError("Unexpected error");
      }
    } finally {
      setLoading(false);
    }
  };

  const doLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <div style={{ padding: 20, display: "grid", gap: 12, maxWidth: 420 }}>
      <h1>Auth Test</h1>

      {!user ? (
        <>
          <input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 8 }}
          />
          <button onClick={doLogin} disabled={loading} style={{ padding: 8 }}>
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && <div style={{ color: "red" }}>{error}</div>}
        </>
      ) : (
        <>
          <pre>{JSON.stringify(user, null, 2)}</pre>
          <button onClick={doLogout} style={{ padding: 8 }}>Logout</button>
        </>
      )}
    </div>
  );
}
