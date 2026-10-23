/**
 * Places to get support, shown when someone checks in as Stressed or Sad.
 * BEFORE LAUNCH: confirm every number, address and link with Penn State (see the launch checklist).
 */
export type Resource = { name: string; what: string; action: string; href: string }

export const URGENT: Resource[] = [
  { name: '988 Suicide & Crisis Lifeline', what: 'Free, 24/7. Call, text or chat.', action: 'Call or text 988', href: 'tel:988' },
  { name: 'Penn State Crisis Line', what: '24/7 for Penn State students', action: 'Call 877-229-6400', href: 'tel:18772296400' },
  { name: 'Crisis Text Line', what: '24/7, by text', action: 'Text LIONS to 741741', href: 'sms:741741?&body=LIONS' },
]

export const ON_CAMPUS: Resource[] = [
  {
    name: 'Counseling and Psychological Services (CAPS)',
    what: 'Free counseling, groups and same-day help for students',
    action: 'Visit site',
    href: 'https://studentaffairs.psu.edu/counseling',
  },
  {
    name: 'Student Care and Advocacy',
    what: 'Help when life gets in the way of classes',
    action: 'Visit site',
    href: 'https://studentaffairs.psu.edu/support-safety-conduct/student-care-advocacy',
  },
  {
    name: 'Health Promotion and Wellness',
    what: 'Stress, sleep and wellness programs on campus',
    action: 'Visit site',
    href: 'https://studentaffairs.psu.edu/health-wellness',
  },
]

export const ONLINE: Resource[] = [
  { name: '988 Lifeline chat', what: 'Talk to someone online, any time', action: 'Open chat', href: 'https://988lifeline.org/chat/' },
  { name: 'Crisis Text Line', what: 'Free, confidential support by text', action: 'Learn more', href: 'https://www.crisistextline.org/' },
]
