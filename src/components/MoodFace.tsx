import type { CSSProperties, ReactNode } from 'react'
import type { MoodId } from '../lib/moods'

// Hand-drawn little faces, so each mood has a shape as well as a color.
const FEATURES: Record<MoodId, ReactNode> = {
  joyful: (
    <>
      <path d="M17 21.5q2-2.6 4 0M27 21.5q2-2.6 4 0" />
      <path d="M16.5 28q7.5 8 15 0" fill="currentColor" fillOpacity=".9" />
    </>
  ),
  calm: (
    <>
      <path d="M16.5 22q2.5 2 5 0M26.5 22q2.5 2 5 0" />
      <path d="M19 29.5q5 3 10 0" />
    </>
  ),
  energized: (
    <>
      <circle cx="19" cy="21" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="29" cy="21" r="1.9" fill="currentColor" stroke="none" />
      <path d="M18 28h12q-1 5.5-6 5.5T18 28Z" fill="currentColor" fillOpacity=".9" />
      <path d="M13 15.5l2-2M35 15.5l-2-2" />
    </>
  ),
  tired: (
    <>
      <path d="M16.5 22.5h5M26.5 22.5h5" />
      <ellipse cx="24" cy="30.5" rx="2.4" ry="2" />
      <path d="M33 12.5h3.5l-3.5 3.5h3.5" strokeWidth="1.6" />
    </>
  ),
  stressed: (
    <>
      <path d="M16.5 19.8l4.5-1M31.5 19.8l-4.5-1" />
      <path d="M35 14.5q-1.6 2.4 0 3.3t1.6-1q0-1-1.6-2.3Z" fill="currentColor" fillOpacity=".45" strokeWidth="1" />
      <circle cx="19.5" cy="23" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="28.5" cy="23" r="1.6" fill="currentColor" stroke="none" />
      <path d="M17.5 31q1.6-1.8 3.2 0t3.3 0 3.3 0 3.2 0" />
    </>
  ),
  sad: (
    <>
      <path d="M17 20.5l3.5-1.5M31 20.5l-3.5-1.5" />
      <circle cx="19.5" cy="23.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="28.5" cy="23.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M19 32q5-4 10 0" />
      <path d="M30.5 26.5q-1.4 2.2 0 3t1.4-.9q0-.9-1.4-2.1Z" fill="currentColor" fillOpacity=".5" strokeWidth="1" />
    </>
  ),
}

export function MoodFace({ mood, className = '', style }: { mood: MoodId; className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="17" fill={`var(--mood-${mood})`} stroke="none" />
      <circle cx="18" cy="17" r="7" fill="white" fillOpacity=".28" stroke="none" />
      <g className="text-[#3b2c3f]">{FEATURES[mood]}</g>
    </svg>
  )
}
