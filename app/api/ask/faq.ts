// app/api/ask/faq.ts

export const FAQ = {
  cost_help: `
If your medication is too expensive in Alberta, common options are:
• Ask the pharmacy if there is a lower-cost generic or similar covered drug.
• Ask any insurance providers you have if this medication needs Special Authorization.
• Dial 811 and ask about income-based help like Special Support or Non-Group coverage.
`.trim(),

  blue_cross_seniors: `
Alberta Blue Cross has a Seniors program that helps with prescription costs for eligible Albertans with an Alberta Health Care number. It usually covers common medications, but there can still be a copay or deductible.

The copay is 30% of the prescription cost, but if 30% of the prescription cost is more than $30 (November 2025), the maximum you pay will be $30.
`.trim(),
emergency: `
If this may be an emergency, please dial 911 or go to the nearest emergency department immediately. 
`.trim(),
  compression_stockings: `
For stronger compression stockings in Alberta (for example 20–30 mmHg or higher), you usually need a prescription and proper measurement by trained staff. Lighter support stockings can be sold over the counter.

Measurements are often booked as an appointment, ideally in the morning so there is less swelling from day-to-day activities and you can receive a proper fit. Call your local pharmacy and ask if they have any staff trained to do these fits!


`.trim(),
} as const;

export type FaqId = keyof typeof FAQ;

// list of valid IDs as strings, for the router prompt
export const FAQ_IDS: FaqId[] = Object.keys(FAQ) as FaqId[];
