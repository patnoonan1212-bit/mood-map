import type { CSSProperties, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { MoodId } from '../lib/moods'

/**
 * A one-second burst that plays where the person tapped, acted out in the mood they chose:
 * joyful confetti and stars, calm ripples, energized lightning, sleepy Zs, stressed scribbles,
 * and sad raindrops. Purely decorative; skipped when reduced motion is on (see CheckIn).
 */

const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const star = 'M0-9q1.6 6.4 9 9q-7.4 2.6-9 9q-1.6-6.4-9-9q7.4-2.6 9-9Z'
const bolt = 'M2-10L-5 1h5l-2 9 7-11h-5l2-9Z'
const drop = 'M0-8q-6 9 0 11.5t0-11.5Z'
const scribble = 'M-8 0l3-4 3 8 3-8 3 8 3-4'

type Frame = { x?: number; y?: number; scale?: number; rotate?: number; opacity?: number }

/** One flying piece. Moves from `from` to `to` with a CSS animation (see .burst-piece in index.css). */
function Piece({ children, from, to, duration = 1, delay = 0 }: { i: number; children: ReactNode; from: Frame; to: Frame; duration?: number; delay?: number }) {
  const style = {
    '--x0': `${from.x ?? 0}px`,
    '--y0': `${from.y ?? 0}px`,
    '--s0': from.scale ?? 1,
    '--r0': `${from.rotate ?? 0}deg`,
    '--o0': from.opacity ?? 1,
    '--x1': `${to.x ?? from.x ?? 0}px`,
    '--y1': `${to.y ?? from.y ?? 0}px`,
    '--s1': to.scale ?? from.scale ?? 1,
    '--r1': `${to.rotate ?? from.rotate ?? 0}deg`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  } as CSSProperties
  return (
    <g className="burst-piece" style={style}>
      {children}
    </g>
  )
}

function pieces(mood: MoodId) {
  const out: ReactNode[] = []
  const N = 16
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + rand(i) * 0.4
    const d = 90 + rand(i + 7) * 90
    const x = Math.cos(a) * d
    const y = Math.sin(a) * d
    const spin = (rand(i + 3) - 0.5) * 540
    switch (mood) {
      case 'joyful': {
        const colors = ['#f5b72c', '#f7844a', '#ff8fa3', '#35ab9b', '#9581d9']
        out.push(
          <Piece key={i} i={i} from={{ x: 0, y: 0, scale: 0.3, opacity: 1, rotate: 0 }} to={{ x, y: y + 50, scale: 1, rotate: spin }} duration={1.3}>
            {i % 3 === 0 ? <path d={star} fill="#ffd34d" /> : <rect x="-4" y="-7" width="8" height="14" rx="2" fill={colors[i % colors.length]} />}
          </Piece>,
        )
        break
      }
      case 'calm':
        if (i < 3)
          out.push(
            <Piece key={i} i={i} from={{ scale: 0.2, opacity: 0.8 }} to={{ scale: 3.2 }} duration={1.6} delay={i * 0.25}>
              <circle r="40" fill="none" stroke="var(--mood-calm)" strokeWidth="4" />
            </Piece>,
          )
        else
          out.push(
            <Piece key={i} i={i} from={{ x: x * 0.4, y: 20, opacity: 0, scale: 0.6 }} to={{ x: x * 0.6, y: -120 - rand(i) * 80, scale: 1 }} duration={1.8} delay={rand(i) * 0.4}>
              <circle r={4 + rand(i + 1) * 5} fill="white" fillOpacity=".7" stroke="var(--mood-calm)" strokeWidth="1.5" />
            </Piece>,
          )
        break
      case 'energized':
        out.push(
          <Piece key={i} i={i} from={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: (a * 180) / Math.PI + 90 }} to={{ x: x * 1.25, y: y * 1.25, scale: 1.3 }} duration={0.75}>
            {i % 2 ? <path d={bolt} fill="#ffd34d" stroke="#f7844a" strokeWidth="1.5" /> : <circle r="4" fill="var(--mood-energized)" />}
          </Piece>,
        )
        break
      case 'tired':
        out.push(
          <Piece key={i} i={i} from={{ x: x * 0.3, y: 0, opacity: 0, scale: 0.5 }} to={{ x: x * 0.7 + 20, y: -140 - rand(i) * 100, scale: 1.2 }} duration={2} delay={rand(i) * 0.6}>
            {i % 2 ? (
              <text fontSize="22" fontWeight="900" fill="#6f5bc2" textAnchor="middle" fontFamily="Nunito Variable, Nunito, sans-serif">
                z
              </text>
            ) : (
              <circle r={5 + rand(i) * 4} fill="var(--mood-tired)" fillOpacity=".55" />
            )}
          </Piece>,
        )
        break
      case 'stressed':
        out.push(
          <Piece key={i} i={i} from={{ x: 0, y: 0, opacity: 1, rotate: (a * 180) / Math.PI }} to={{ x, y, rotate: (a * 180) / Math.PI + 40 }} duration={0.9}>
            <path d={scribble} fill="none" stroke="var(--mood-stressed)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </Piece>,
        )
        break
      case 'sad': {
        const sx = (rand(i) - 0.5) * 260
        out.push(
          <Piece key={i} i={i} from={{ x: sx, y: -160 - rand(i + 2) * 80, opacity: 0 }} to={{ x: sx, y: 60 + rand(i + 5) * 80 }} duration={1.3} delay={rand(i + 9) * 0.6}>
            <path d={drop} fill="#cfe6ff" stroke="var(--mood-sad)" strokeWidth="1.5" />
          </Piece>,
        )
        break
      }
    }
  }
  return out
}

export function EmotionBurst({ mood, x, y }: { mood: MoodId; x: number; y: number }) {
  // Rendered at the top of the page so no scrolling container can clip it.
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      {/* A soft wash of the mood's color across the screen */}
      <div
        className="burst-wash absolute inset-0"
        style={{ background: `radial-gradient(circle at ${x}px ${y}px, color-mix(in srgb, var(--mood-${mood}) 45%, transparent), transparent 60%)` }}
      />
      <svg className="absolute overflow-visible" style={{ left: x, top: y }} width="1" height="1">
        {pieces(mood)}
      </svg>
    </div>,
    document.body,
  )
}
