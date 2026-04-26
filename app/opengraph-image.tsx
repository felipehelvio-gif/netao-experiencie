import { ImageResponse } from 'next/og';

export const alt = 'Santa Fé Experience — Segunda Sem Folga · 27 de abril, 20h, Vila Leopoldina';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1B2B3F 0%, #0E1825 100%)',
          color: '#FFF8EE',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Stripe top */}
        <div
          style={{
            height: 18,
            background:
              'repeating-linear-gradient(135deg, #F39C3C 0, #F39C3C 14px, #FF8A1A 14px, #FF8A1A 28px)',
          }}
        />

        {/* Halftone overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 90% 50%, rgba(243,156,60,0.18) 0%, transparent 50%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '60px 80px',
            position: 'relative',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* LEFT — texto */}
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 720 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 18,
                color: '#F39C3C',
                fontWeight: 900,
                letterSpacing: 6,
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              · Encontro Nacional · Donos de Restaurantes ·
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: 130,
                fontWeight: 900,
                lineHeight: 0.85,
                letterSpacing: -3,
                textTransform: 'uppercase',
                color: '#FFF8EE',
              }}
            >
              SEGUNDA
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 130,
                fontWeight: 900,
                lineHeight: 0.85,
                letterSpacing: -3,
                textTransform: 'uppercase',
                color: '#F39C3C',
                marginTop: 6,
              }}
            >
              SEM FOLGA
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: '#FFF8EE',
                marginTop: 24,
                fontStyle: 'italic',
              }}
            >
              Santa Fé Experience
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: 36,
                gap: 24,
                alignItems: 'center',
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  border: '3px solid #F39C3C',
                  padding: '12px 22px',
                  borderRadius: 8,
                  color: '#F39C3C',
                  background: 'rgba(243,156,60,0.08)',
                }}
              >
                27 · 04 · 26
              </div>
              <div style={{ display: 'flex' }}>20h às 23h59</div>
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: 18,
                fontSize: 22,
                color: '#FFF8EE',
                opacity: 0.85,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              Rua Carlos Weber, 64 · Vila Leopoldina · São Paulo
            </div>
          </div>

          {/* RIGHT — accent panel */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 240,
              height: 320,
              background: '#F39C3C',
              border: '6px solid #FFF8EE',
              borderRadius: 14,
              transform: 'rotate(4deg)',
              boxShadow: '14px 14px 0 0 rgba(243,156,60,0.25)',
            }}
          >
            <div
              style={{
                fontSize: 22,
                color: '#1B2B3F',
                fontWeight: 800,
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}
            >
              Open Food
            </div>
            <div
              style={{
                fontSize: 70,
                color: '#1B2B3F',
                fontWeight: 900,
                lineHeight: 1,
                marginTop: 8,
              }}
            >
              R$ 200
            </div>
            <div
              style={{
                fontSize: 18,
                color: '#1B2B3F',
                marginTop: 8,
                opacity: 0.7,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Lote 1 · agora
            </div>
            <div
              style={{
                marginTop: 16,
                padding: '8px 16px',
                background: '#1B2B3F',
                color: '#F39C3C',
                fontSize: 16,
                fontWeight: 800,
                borderRadius: 6,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Garanta sua vaga
            </div>
          </div>
        </div>

        {/* Stripe bottom */}
        <div
          style={{
            height: 18,
            background:
              'repeating-linear-gradient(135deg, #F39C3C 0, #F39C3C 14px, #FF8A1A 14px, #FF8A1A 28px)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
