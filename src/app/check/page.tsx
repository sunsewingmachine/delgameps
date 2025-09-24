import React from 'react';

export const dynamic = 'force-dynamic';

function getParamValue(searchParams: any, key: string) {
  const v = searchParams?.[key];
  if (Array.isArray(v)) return v[0] ?? '';
  return (v ?? '') as string;
}

export default function CheckPage({ searchParams }: any) {
  const params = searchParams ?? {};
  const arg = getParamValue(params, 'arg') ?? '';
  const expected = 'far99-task2';
  const matches = arg === expected;

  const ep = getParamValue(params, 'ep') ?? '';
  let epValid = false;
  let epMillis: number | null = null;
  let epDate: Date | null = null;
  let isCurrentHour = false;

  if (ep) {
    const cleaned = ep.trim();
    if (/^\d+$/.test(cleaned)) {
      const num = Number(cleaned);
      // If epoch looks like milliseconds (13+ digits or >1e12), use as ms, otherwise seconds
      epMillis = cleaned.length >= 13 || num > 1e12 ? num : num * 1000;
      epDate = new Date(epMillis);
      epValid = !isNaN(epDate.getTime());

      if (epValid) {
        const now = new Date();
        const startHour = new Date(now);
        startHour.setMinutes(0, 0, 0);
        const endHour = new Date(startHour.getTime() + 60 * 60 * 1000 - 1);
        isCurrentHour = epMillis >= startHour.getTime() && epMillis <= endHour.getTime();
      }
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      <h1>Check Query Argument</h1>

      {arg ? (
        <div>
          {matches ? (
            <p style={{ color: 'green', fontWeight: 600 }}>
              Argument detected: <code>{arg}</code> — it matches the expected value.
            </p>
          ) : (
            <p style={{ color: '#b34747', fontWeight: 600 }}>
              Argument provided: <code>{arg}</code> — does not match expected value <code>{expected}</code>.
            </p>
          )}

          <div style={{ marginTop: '1rem' }}>
            <strong>Raw query:</strong>
            <pre style={{ background: '#f4f4f4', padding: '0.5rem', borderRadius: 4 }}>{`?arg=${arg}${ep ? `&ep=${ep}` : ''}`}</pre>
          </div>
        </div>
      ) : (
        <p>
          No <code>arg</code> query parameter provided. Try visiting <code>/check/?arg=far99-task2</code>
        </p>
      )}

      <hr style={{ margin: '1.5rem 0' }} />

      <h2>Epoch ("ep") check</h2>
      {ep ? (
        <div>
          {!epValid ? (
            <p style={{ color: '#b34747' }}>
              Provided <code>ep</code> is invalid. Please pass a numeric epoch (seconds or milliseconds).
            </p>
          ) : (
            <div>
              <p>
                <strong>Epoch value:</strong> <code>{ep}</code>
              </p>

              <p>
                <strong>Interpreted time:</strong>{' '}
                <code>{epDate ? epDate.toLocaleString() : 'Invalid date'}</code>
              </p>

              {isCurrentHour ? (
                <p style={{ color: 'green', fontWeight: 600 }}>
                  The epoch is within the current hour.
                </p>
              ) : (
                <p style={{ color: '#b34747', fontWeight: 600 }}>
                  The epoch is NOT within the current hour.
                </p>
              )}

              <div style={{ marginTop: '0.75rem', background: '#f6f8fa', padding: '0.6rem', borderRadius: 4 }}>
                <small>
                  Current local time: <code>{new Date().toLocaleString()}</code>
                </small>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>
          No <code>ep</code> query parameter provided. Example: <code>/check/?ep=1700000000</code> (seconds) or{' '}
          <code>/check/?ep=1700000000000</code> (milliseconds).
        </p>
      )}
    </main>
  );
}
