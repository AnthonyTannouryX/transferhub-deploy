import { useEffect, useState } from "react";

type PingResponse = {
  status: string;
  message: string;
  time: string;
};

export default function TestAPI() {
  const [data, setData] = useState<PingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

    fetch(`${API_URL}/ping`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as PingResponse;
        setData(json);
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <h1>Loading...</h1>;
  if (error) return <h1>Error: {error}</h1>;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>API Test</h1>
      {data && (
        <>
          <p><strong>Status:</strong> {data.status}</p>
          <p><strong>Message:</strong> {data.message}</p>
          <p><strong>Time:</strong> {data.time}</p>
        </>
      )}
    </div>
  );
}
