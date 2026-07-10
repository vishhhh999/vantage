import LegalShell from './LegalShell'

const SECTIONS = [
  {
    heading: 'What VANTAGE is',
    body: [
      'VANTAGE is an independent coaching tool for Valorant players that reads your competitive match history through Riot\'s official API and generates decision-focused analysis. It is not an official Riot Games product and is not endorsed by or affiliated with Riot Games, Inc.',
    ],
  },
  {
    heading: 'Account and eligibility',
    body: [
      'You must have a valid Riot Games account in good standing to use VANTAGE\'s analysis features. You\'re responsible for keeping your sign-in secure and for all activity under your account.',
      'VANTAGE is intended for players old enough to hold a Riot Games account under Riot\'s own terms of service; if you don\'t meet Riot\'s eligibility requirements, you shouldn\'t use VANTAGE either.',
    ],
  },
  {
    heading: 'Acceptable use',
    body: [
      'Don\'t attempt to access another player\'s match data or account without authorization, attempt to circumvent rate limits or sign-in requirements, or use VANTAGE to scrape, resell, or redistribute Riot match data in bulk.',
    ],
  },
  {
    heading: 'No competitive guarantee',
    body: [
      'Coaching findings are generated from your own match data and are intended as directional guidance, not a guarantee of rank improvement. VANTAGE surfaces patterns in your data — what you do with them is up to you.',
    ],
  },
  {
    heading: 'Service availability',
    body: [
      'VANTAGE is an early-stage, independently maintained product. Features, scoring categories, and availability may change without notice, and the service may be interrupted or discontinued at any time.',
    ],
  },
  {
    heading: 'Limitation of liability',
    body: [
      'VANTAGE is provided as-is, without warranty of any kind. To the fullest extent permitted by law, VANTAGE and its creator are not liable for any indirect, incidental, or consequential damages arising from use of the service.',
    ],
  },
  {
    heading: 'Contact',
    body: [
      'Questions about these terms can be sent through the contact form on the homepage.',
    ],
  },
]

export default function TermsOfService() {
  return <LegalShell title="Terms of service" updated="July 2026" sections={SECTIONS} />
}
