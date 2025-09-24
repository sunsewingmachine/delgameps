'use client';

import React, { useState, useEffect } from 'react';

// Purpose: QR code generator page that displays a QR code for the DPS check URL with current epoch timestamp
export default function ShowQrPage() {
  const [input, setInput] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate the DPS check URL with current epoch timestamp
  const generateDpsUrl = () => {
    const currentEpoch = Math.floor(Date.now() / 1000);
    return `https://dps-gamma.vercel.app/check/?arg=far99-task2&ep=${currentEpoch}`;
  };

  // --- Helpers ---
  const isValidUrl = (value: string) => {
    try {
      const u = new URL(value);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const normalizeUrl = (value: string) => {
    const v = value.trim();
    if (!v) return v;
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[\w-]+(\.[\w-]+)+/.test(v)) return `https://${v}`;
    return v;
  };

  const buildQrSrc = (value: string) => {
    if (!value) return '';
    
    // Try multiple QR code services as fallbacks
    const services = [
      // QR-Server.com - free and reliable
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(value)}`,
      
      // Google Charts API (backup)
      `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(value)}&chld=L|1`,
      
      // QRCode.show (backup)
      `https://qrcode.show/${encodeURIComponent(value)}`
    ];
    
    return services[0]; // Start with the most reliable one
  };

  // Set the DPS URL on component mount
  useEffect(() => {
    const dpsUrl = generateDpsUrl();
    setInput(dpsUrl);
    // Auto-generate QR code for the DPS URL
    setTimeout(() => {
      setQrUrl(buildQrSrc(dpsUrl));
    }, 100);
  }, []);

  // Skip localStorage persistence for Claude artifacts
  useEffect(() => {
    // In a real app, this would save to localStorage
    // For Claude artifacts, we skip this to avoid errors
  }, [input]);

  const handleGenerate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = input.trim();
    if (!v) {
      setQrUrl(null);
      setImageError(false);
      return;
    }
    
    setIsLoading(true);
    setImageError(false);
    
    // Add a small delay to show loading state
    setTimeout(() => {
      setQrUrl(buildQrSrc(v));
      setIsLoading(false);
    }, 300);
  };

  const handleClear = () => {
    setInput('');
    setQrUrl(null);
    setImageError(false);
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    
    // Try fallback service
    if (qrUrl && qrUrl.includes('qrserver.com')) {
      const value = input.trim();
      if (value) {
        setQrUrl(`https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(value)}&chld=L|1`);
      }
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
    setIsLoading(false);
  };

  const normalized = normalizeUrl(input);
  const canOpen = isValidUrl(normalized);

  return (
    <main style={{ maxWidth: 800, margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Show QR</h1>

      <form
        onSubmit={handleGenerate}
        style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}
      >
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
          disabled={isLoading}
          style={{
            padding: '0.55rem 0.9rem',
            borderRadius: 6,
            border: 'none',
            background: isLoading ? '#6b7280' : '#111827',
            color: 'white',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: 15
          }}
        >
          {isLoading ? 'Loading...' : 'Generate'}
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          style={{
            padding: '0.45rem 0.7rem',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: 14,
            opacity: isLoading ? 0.6 : 1
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
            {isLoading ? (
              <div style={{ 
                width: 300, 
                height: 300, 
                border: '1px solid #e5e7eb', 
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb',
                color: '#6b7280'
              }}>
                Loading QR code...
              </div>
            ) : imageError ? (
              <div style={{ 
                width: 300, 
                height: 300, 
                border: '1px solid #e5e7eb', 
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                textAlign: 'center',
                padding: '1rem'
              }}>
                <div>
                  <div style={{ marginBottom: 8 }}>❌</div>
                  <div style={{ fontSize: 14 }}>Failed to load QR code</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try a different URL or check your connection</div>
                </div>
              </div>
            ) : (
              <img
                src={qrUrl}
                alt="Generated QR code"
                width={300}
                height={300}
                onError={handleImageError}
                onLoad={handleImageLoad}
                style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
            )}
            
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

              {canOpen && (
                <a
                  href={normalized}
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
              )}
            </div>
          </div>
        ) : (
          <div style={{ color: '#9ca3af' }}>No QR code generated yet.</div>
        )}
      </section>
    </main>
  );
}
