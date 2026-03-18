import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Barpel AI — AI Voice Support for E-Commerce';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Teal glow circle — top right */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(20,184,166,0.25) 0%, transparent 70%)',
          }}
        />
        {/* Teal glow circle — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '200px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Logo mark — "B" badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            marginBottom: '32px',
          }}
        >
          <span
            style={{
              color: '#ffffff',
              fontSize: '40px',
              fontWeight: '800',
              lineHeight: 1,
            }}
          >
            B
          </span>
        </div>

        {/* Brand name */}
        <div
          style={{
            color: '#ffffff',
            fontSize: '72px',
            fontWeight: '800',
            lineHeight: 1.1,
            letterSpacing: '-1px',
            marginBottom: '20px',
          }}
        >
          Barpel AI
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#94a3b8',
            fontSize: '36px',
            fontWeight: '400',
            lineHeight: 1.3,
            maxWidth: '700px',
          }}
        >
          AI Voice Support for E-Commerce
        </div>

        {/* Teal accent line */}
        <div
          style={{
            marginTop: '48px',
            width: '80px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: '#14b8a6',
          }}
        />

        {/* Sub-tagline */}
        <div
          style={{
            marginTop: '24px',
            color: '#64748b',
            fontSize: '24px',
            fontWeight: '400',
          }}
        >
          Answer every call. Recover every cart. 24/7.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
