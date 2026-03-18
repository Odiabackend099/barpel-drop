import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
          background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: '108px',
            fontWeight: '800',
            lineHeight: 1,
          }}
        >
          B
        </span>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
