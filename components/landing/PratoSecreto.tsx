'use client';

import * as React from 'react';
import { Lock, Unlock, Sparkles } from 'lucide-react';

const REAL = 'Língua no Vinho Malbec';
const CHARS = '!@#$%&*?+~ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function pickRandom() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export function PratoSecreto() {
  const [revelado, setRevelado] = React.useState(false);
  const [decoding, setDecoding] = React.useState(false);
  const [display, setDisplay] = React.useState(() =>
    REAL.split('').map((c) => (c === ' ' ? ' ' : '█')).join(''),
  );

  const reveal = () => {
    if (revelado || decoding) return;
    setDecoding(true);

    const TOTAL_TICKS = 38;
    let tick = 0;

    const id = setInterval(() => {
      tick++;
      const progress = tick / TOTAL_TICKS;
      const decoded = Math.floor(progress * REAL.length);

      let next = '';
      for (let i = 0; i < REAL.length; i++) {
        const ch = REAL[i];
        if (ch === ' ') {
          next += ' ';
        } else if (i < decoded) {
          next += ch;
        } else {
          next += pickRandom();
        }
      }
      setDisplay(next);

      if (tick >= TOTAL_TICKS) {
        clearInterval(id);
        setDisplay(REAL);
        setDecoding(false);
        setRevelado(true);
      }
    }, 55);
  };

  return (
    <li className="flex items-baseline gap-4 border-b border-dashed border-santafe-navy/30 pb-3 text-lg">
      <span className="font-slab text-santafe-orange">07</span>

      <button
        onClick={reveal}
        disabled={revelado || decoding}
        type="button"
        className={`group relative flex w-full items-center gap-2 text-left transition-all ${
          revelado ? 'cursor-default' : 'cursor-pointer'
        }`}
        aria-label="Revelar prato secreto"
      >
        {!revelado ? (
          <Lock
            className={`h-4 w-4 flex-shrink-0 ${
              decoding ? 'animate-pulse text-santafe-ember' : 'text-santafe-orange-deep'
            } transition-transform group-hover:scale-110`}
          />
        ) : (
          <Sparkles className="h-4 w-4 flex-shrink-0 text-santafe-ember animate-pulse" />
        )}

        <span
          className={`font-mono font-medium tracking-wide ${
            revelado
              ? 'text-santafe-navy'
              : decoding
              ? 'text-santafe-ember'
              : 'text-santafe-navy/40 select-none'
          }`}
          style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
        >
          {revelado ? REAL : display}
        </span>

        {!revelado && !decoding && (
          <span className="ml-auto whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-santafe-orange-deep transition-colors group-hover:text-santafe-ember">
            ► toca pra revelar
          </span>
        )}

        {decoding && (
          <span className="ml-auto whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-santafe-ember">
            decifrando…
          </span>
        )}

        {revelado && (
          <span className="ml-auto whitespace-nowrap rounded bg-santafe-ember px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-santafe-cream">
            descoberto
          </span>
        )}
      </button>
    </li>
  );
}
