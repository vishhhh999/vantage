import LegalShell from './LegalShell'

const SECTIONS = [
  {
    heading: 'What VANTAGE collects',
    body: [
      'When you sign in, VANTAGE stores your email (for account access via Supabase authentication) and the Riot ID and region linked to your account after you complete Riot\'s own sign-in flow.',
      'Once you\'ve linked your Riot account, VANTAGE reads your last 20 competitive Valorant matches from Riot\'s official API and stores the resulting analysis — scores, priority findings, and summaries — tied to your account so you can view your history over time.',
      'VANTAGE never asks for, sees, or stores your Riot password. Authentication happens entirely on Riot\'s own login page; VANTAGE only receives a token proving you signed in, not your credentials.',
    ],
  },
  {
    heading: 'How it\'s used',
    body: [
      'Your match data is used for exactly one purpose: generating your coaching reports. It is not used to train any model, sold, or shared with advertisers.',
      'Match data and the resulting findings are sent to Anthropic\'s API to generate the written coaching text in your report. Anthropic processes this data to return a response and does not use it to improve their models under VANTAGE\'s API usage terms.',
    ],
  },
  {
    heading: 'Third parties involved',
    body: [
      'Riot Games — source of match and account data, via their official API and RSO sign-in.',
      'Supabase — hosts your account and stored reports, with row-level security so only your own account can read your data.',
      'Anthropic — processes match data to generate coaching text, on a per-request basis.',
    ],
  },
  {
    heading: 'Your data, your control',
    body: [
      'You can request deletion of your account and all associated data at any time by reaching out through the contact form on the homepage. Deletion removes your profile and stored reports from VANTAGE\'s database.',
      'Unlinking your Riot account stops future match reads immediately; it does not retroactively delete reports already generated, unless you separately request account deletion.',
    ],
  },
  {
    heading: 'Changes to this policy',
    body: [
      'VANTAGE is an early-stage, independently built product and this policy may change as the product does. Meaningful changes will be reflected here with an updated date.',
    ],
  },
]

export default function PrivacyPolicy() {
  return <LegalShell title="Privacy policy" updated="July 2026" sections={SECTIONS} />
}
