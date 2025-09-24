'use client';

import React, { useState, useEffect } from 'react';

export default function ShowQrPage() {
  const [input, setInput] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // Persist input to localStorage so it survives reloads
  useEffect(() => {
    try {
      const saved = localStorage.getItem('show-qr-input');
      if (saved) setInput(saved);
    } catch (e) {
      // ignore (e.g. running in an environment without localStorage)
    }
  }, []);

  useEffect(() => {
    try {
      if (input) {
        localStorage.setItem('show-qr-input', input);
      } else {
        localStorage.removeItem('show-qr-input');
      }
    } catch (e) {
      // ignore
    }
  }, [input]);

  // Build QR image src using Google Charts API (no extra dependency required)
  const buildQrSrc = (value: string) => {
    if (!value) return '';
    // size 300x300, can be changed
    const size = '300x300';
    return `https://chart.googleapis.com/chart?cht=qr&chs=${size}&chl=${encodeURIComponent(
      value
    )}&chld=L|1`;
  };

  const handleGenerate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input) {
      setQrUrl(null);
      return;
    }
    setQrUrl(buildQrSrc(input.trim()));
  };

  const handleClear = () => {
    setInput('');
    setQrUrl(null);
    try {
      localStorage.removeItem('show-qr-input');
    } catch (e) {
      // ignore
    }
  };

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Show QR</h1>

      <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          aria-label="URL or text to encode"
          placeholder="Enter URL (e.g. https://example.com) or any text..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: '0.6rem 0.75rem',
            borderRadius: 6,
            border: '1px solid #ccc',
            fontSize: 16
          }}
        />

        <button
          type="submit"
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: 6,
            border: 'none',
            background: '#111827',
            color: 'white',
            cursor: 'pointer',
            fontSize: 15
          }}
        >
          Generate
        </button>

        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: '0.45rem 0.7rem',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Clear
        </button>
      </form>

      <div style={{ marginTop: 8 }}>
        <small style={{ color: '#6b7280' }}>
          Tip: paste a URL or any text and click "Generate". The QR will appear below as an image.
        </small>
      </div>

      <section style={{ marginTop: 20 }}>
        {qrUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            <img
              src={qrUrl}
              alt="Generated QR code"
              width={300}
              height={300}
              style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <a
                href={qrUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.45rem 0.8rem',
                  background: '#efefef',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: '#111'
                }}
              >
                Open QR image
              </a>
              <a
                href={input.startsWith('http') ? input : `https://${input}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '0.45rem 0.8rem',
                  background: '#111827',
                  color: 'white',
                  borderRadius: 6,
                  textDecoration: 'none'
                }}
              >
                Open URL
              </a>
            </div>
          </div>
        ) : (
          <div style={{ color: '#9ca3af' }}>No QR code generated yet.</div>
        )}
      </section>
    </main>
  );
}
