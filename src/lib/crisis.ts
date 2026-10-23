// Crisis resources shown in the Calm Corner.
// Before launch: double-check every number with Penn State CAPS (see launch checklist).
export const CRISIS_RESOURCES = [
  { name: '988 Suicide & Crisis Lifeline', action: 'Call or text 988', href: 'tel:988', note: 'Free, 24/7, anywhere in the US' },
  { name: 'Penn State Crisis Line', action: 'Call 877-229-6400', href: 'tel:18772296400', note: '24/7 for Penn State students' },
  { name: 'Crisis Text Line', action: 'Text LIONS to 741741', href: 'sms:741741?&body=LIONS', note: '24/7, by text' },
  { name: 'Emergency', action: 'Call 911', href: 'tel:911', note: 'If you or someone else is in danger right now' },
] as const
