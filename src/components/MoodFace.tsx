import { motion, useReducedMotion, type TargetAndTransition, type Transition } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'
import type { MoodId } from '../lib/moods'

/**
 * Hand-drawn little faces, so each mood has a shape as well as a color.
 * With `animated`, each face acts out its feeling: joyful bounces, calm breathes, energized buzzes,
 * tired yawns with Zs floating up, stressed shakes with a wobbly mouth, sad cries.
 * Motion is skipped when the person has reduced motion turned on.
 */

const loop = (duration: number, extra: Transition = {}): Transition => ({ duration, repeat: Infinity, ease: 'easeInOut', ...extra })

// Mouth shapes for the wobble animations. Each pair uses the same commands so they can morph.
const STRESSED_MOUTH = [
  'M17.5 31 Q18.3 29.2 19.1 31 T20.7 31 T22.35 31 T24 31 T25.65 31 T27.3 31 T28.95 31 T30.5 31',
  'M17.5 31 Q18.3 32.8 19.1 31 T20.7 31 T22.35 31 T24 31 T25.65 31 T27.3 31 T28.95 31 T30.5 31',
]
const SAD_MOUTH = ['M19 32 Q24 28 29 32', 'M19 32.4 Q24 29.4 29 32.4']

type Face = {
  features: (live: boolean) => ReactNode
  body?: TargetAndTransition
  bodyTransition?: Transition
  extras?: (live: boolean) => ReactNode
}

const FACES: Record<MoodId, Face> = {
  joyful: {
    body: { y: [0, -1.6, 0], rotate: [-5, 5, -5] },
    bodyTransition: loop(1.4),
    features: () => (
      <>
        <path d="M17 21.5q2-2.6 4 0M27 21.5q2-2.6 4 0" />
        <path d="M16.5 28q7.5 8 15 0" fill="currentColor" fillOpacity=".9" />
      </>
    ),
    extras: (live) =>
      live &&
      [
        [8, 10, 0],
        [40, 8, 0.6],
      ].map(([x, y, d]) => (
        <motion.path
          key={x}
          d={`M${x} ${y - 2.5}q.5 2 2.5 2.5q-2 .5-2.5 2.5q-.5-2-2.5-2.5q2-.5 2.5-2.5Z`}
          fill="var(--mood-joyful)"
          stroke="none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
          transition={loop(1.6, { delay: d })}
        />
      )),
  },
  calm: {
    body: { scale: [1, 1.05, 1] },
    bodyTransition: loop(4),
    features: () => (
      <>
        <path d="M16.5 22q2.5 2 5 0M26.5 22q2.5 2 5 0" />
        <path d="M19 29.5q5 3 10 0" />
      </>
    ),
  },
  energized: {
    body: { y: [0, -2.5, 0, -1, 0] },
    bodyTransition: loop(0.8),
    features: (live) => (
      <>
        <motion.g animate={live ? { x: [-0.6, 0.6, -0.6] } : undefined} transition={live ? loop(0.6) : undefined}>
          <circle cx="19" cy="21" r="1.9" fill="currentColor" stroke="none" />
          <circle cx="29" cy="21" r="1.9" fill="currentColor" stroke="none" />
        </motion.g>
        <path d="M18 28h12q-1 5.5-6 5.5T18 28Z" fill="currentColor" fillOpacity=".9" />
        <motion.path d="M13 15.5l2-2M35 15.5l-2-2" animate={live ? { opacity: [0.2, 1, 0.2] } : undefined} transition={live ? loop(0.5) : undefined} />
      </>
    ),
  },
  tired: {
    body: { rotate: [0, 6, 6, 0] },
    bodyTransition: loop(4.5, { times: [0, 0.35, 0.75, 1] }),
    features: (live) => (
      <>
        <path d="M16.5 22.5h5M26.5 22.5h5" />
        <motion.ellipse
          cx="24"
          cy="30.5"
          rx="2.4"
          initial={{ ry: 2 }}
          animate={live ? { ry: [2, 2, 3.6, 3.6, 2] } : undefined}
          transition={live ? loop(4.5, { times: [0, 0.3, 0.45, 0.7, 0.85] }) : undefined}
        />
      </>
    ),
    // Zs drift up and fade, one after another. Still faces show a single z.
    extras: (live) =>
      (live ? [0, 1, 2] : [0]).map((i) => (
        <motion.path
          key={i}
          d="M33 12.5h3.5l-3.5 3.5h3.5"
          strokeWidth="1.6"
          initial={live ? { opacity: 0 } : undefined}
          animate={live ? { y: [4, -10], x: [0, 4], opacity: [0, 1, 0], scale: [0.7, 1.1] } : undefined}
          transition={live ? loop(2.4, { delay: i * 0.8, ease: 'easeOut' }) : undefined}
        />
      )),
  },
  stressed: {
    body: { x: [-0.5, 0.5, -0.5] },
    bodyTransition: loop(0.16),
    features: (live) => (
      <>
        <path d="M16.5 19.8l4.5-1M31.5 19.8l-4.5-1" />
        <circle cx="19.5" cy="23" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="28.5" cy="23" r="1.6" fill="currentColor" stroke="none" />
        <motion.path d={STRESSED_MOUTH[0]} animate={live ? { d: STRESSED_MOUTH } : undefined} transition={live ? loop(0.3, { repeatType: 'mirror' }) : undefined} />
      </>
    ),
    // A sweat drop that slides down.
    extras: (live) => (
      <motion.path
        d="M35 14.5q-1.6 2.4 0 3.3t1.6-1q0-1-1.6-2.3Z"
        fill="currentColor"
        fillOpacity=".45"
        strokeWidth="1"
        animate={live ? { y: [0, 6], opacity: [1, 0] } : undefined}
        transition={live ? loop(1.3, { ease: 'easeIn' }) : undefined}
      />
    ),
  },
  sad: {
    body: { y: [0, 1, 0] },
    bodyTransition: loop(3),
    features: (live) => (
      <>
        <path d="M17 20.5l3.5-1.5M31 20.5l-3.5-1.5" />
        <circle cx="19.5" cy="23.5" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="28.5" cy="23.5" r="1.6" fill="currentColor" stroke="none" />
        <motion.path d={SAD_MOUTH[0]} animate={live ? { d: SAD_MOUTH } : undefined} transition={live ? loop(0.8, { repeatType: 'mirror' }) : undefined} />
      </>
    ),
    // A tear that wells up and falls.
    extras: (live) => (
      <motion.path
        d="M30.5 26.5q-1.4 2.2 0 3t1.4-.9q0-.9-1.4-2.1Z"
        fill="currentColor"
        fillOpacity=".5"
        strokeWidth="1"
        animate={live ? { y: [0, 0, 9], opacity: [0, 1, 0], scale: [0.5, 1, 1] } : undefined}
        transition={live ? loop(2.2, { times: [0, 0.35, 1], ease: 'easeIn' }) : undefined}
      />
    ),
  },
}

type Props = { mood: MoodId; className?: string; style?: CSSProperties; animated?: boolean }

export function MoodFace({ mood, className = '', style, animated = false }: Props) {
  const reduce = useReducedMotion()
  const live = animated && !reduce
  const face = FACES[mood]
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      style={{ overflow: 'visible', ...style }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <motion.g animate={live ? face.body : undefined} transition={live ? face.bodyTransition : undefined} style={{ transformOrigin: '24px 24px' }}>
        <circle cx="24" cy="24" r="17" fill={`var(--mood-${mood})`} stroke="none" />
        <circle cx="18" cy="17" r="7" fill="white" fillOpacity=".28" stroke="none" />
        <g className="text-[#3b2c3f]">{face.features(live)}</g>
      </motion.g>
      <g className="text-[#3b2c3f]">{face.extras?.(live)}</g>
    </svg>
  )
}
