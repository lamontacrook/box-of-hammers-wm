"use client";

import { useState } from "react";

export default function UrlFormPage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [meta, setMeta] = useState(null);

  const validateUrl = (value) => {
    try {
      const u = new URL(value);
      return /^https?:$/i.test(u.protocol);
    } catch {
      return false;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setImages([]);
    setMeta(null);

    if (!validateUrl(url)) {
      setError("Please enter a valid http(s) URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/scan?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) {
        const res2 = await fetch(`/api/scan/headless?url=${encodeURIComponent(url)}`);
        data = await res2.json();
        if (!res2.ok) throw new Error(data?.error || "Scan failed");
      }
      setImages(data.images || []);
      setMeta({ pageUrl: data.pageUrl, count: data.count });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "46rem",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          padding: "1.25rem",
        }}
      >
        <h1 style={{ marginBottom: "1rem", fontSize: "1.5rem", fontWeight: 700 }}>
          Scan a Page for Images
        </h1>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <label htmlFor="url" style={{ fontWeight: 500 }}>
            URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            required
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            pattern="https?://.+"
            style={{
              padding: "0.625rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "1rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              padding: "0.6rem 0.9rem",
              borderRadius: "8px",
              border: "1px solid #111827",
              background: "#111827",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Scanning…" : "Scan"}
          </button>
        </form>

        {error && (
          <p style={{ color: "#b91c1c", marginTop: "0.75rem" }}>
            {error}
          </p>
        )}

        {meta && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ marginBottom: "0.25rem" }}>
              <strong>Page:</strong>{" "}
              <a href={meta.pageUrl} target="_blank" rel="noreferrer">
                {meta.pageUrl}
              </a>
            </p>
            <p>
              <strong>Images found:</strong> {meta.count}
            </p>
          </div>
        )}

        {images.length > 0 && (
          <div style={{ marginTop: "1.25rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {images.map((src, i) => (
                <figure
                  key={src + i}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    background: "#fafafa",
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                  <figcaption
                    style={{
                      marginTop: "0.4rem",
                      fontSize: "0.75rem",
                      wordBreak: "break-all",
                    }}
                  >
                    <a href={src} target="_blank" rel="noreferrer">
                      {src}
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
