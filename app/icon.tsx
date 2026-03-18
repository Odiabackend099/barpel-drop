import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '7px',
          background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '800',
            lineHeight: 1,
          }}
        >
          B
        </span>
      </div>
    ),
    { width: 32, height: 32 }
  );
}
