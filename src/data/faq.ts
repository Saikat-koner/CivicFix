export interface CivicFaqItem {
  q: string;
  a: string;
  category?: string;
}

export const CIVIC_FAQ_ITEMS: CivicFaqItem[] = [
  {
    q: 'Do I have to pay any fee to report an issue or use CivicFix?',
    a: 'No. CivicFix is 100% free for all residents, citizens, and neighborhood associations. It is a public municipal redressal utility operated in coordination with city authorities.',
    category: 'General',
  },
  {
    q: 'How does my complaint reach the actual Municipal Corporation officials?',
    a: 'When you submit a report with photo and location, our geo-routing engine tags the specific municipal ward and assigns the ticket directly to the designated Junior Engineer and Ward Commissioner, complete with an SLA countdown.',
    category: 'Process',
  },
  {
    q: 'What are Civic Credits (CC) and how can I redeem them?',
    a: 'Every verified issue you report or confirm earns you Civic Credits (CC). These credits can be redeemed in the Community Perks store for free 1-day municipal parking passes, metro passes, and official certificates of civic appreciation.',
    category: 'Rewards',
  },
  {
    q: 'Can I report issues anonymously?',
    a: 'Yes. While an account is required to prevent spam and allow you to track your tickets, you can choose to make your name private on public civic cards so only municipal officials see verified coordinates.',
    category: 'Privacy',
  },
  {
    q: 'What if a municipal department ignores my complaint?',
    a: 'If a ticket crosses its SLA deadline without resolution, you can escalate it with 1 click to the Municipal Ombudsman Desk and request a formal appointment with the Commissioner.',
    category: 'Escalation',
  },
  {
    q: 'How fast are emergency hazards like sinkholes or fallen powerlines addressed?',
    a: 'Critical safety hazards are flagged automatically for rapid dispatch with a 2-4 hour field inspection SLA. You can also dial the 24/7 City Emergency Helpline directly from the hotline menu.',
    category: 'Emergency',
  },
];
