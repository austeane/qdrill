import { test, expect } from '@playwright/test';

// Provide these to run: PLAYWRIGHT_SEASON_ID, PLAYWRIGHT_ICS_TOKEN
const seasonId = process.env.PLAYWRIGHT_SEASON_ID || process.env.E2E_SEASON_ID;
const icsToken = process.env.PLAYWRIGHT_ICS_TOKEN || process.env.E2E_ICS_TOKEN;

const describeFn = seasonId && icsToken ? test.describe : test.describe.skip;

describeFn('ICS feed', () => {
  test('serves calendar.ics with valid token', async ({ request }) => {
    const res = await request.get(`/api/seasons/${seasonId}/calendar.ics?token=${icsToken}`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/calendar');
    const body = await res.text();
    expect(body).toContain('BEGIN:VCALENDAR');
    expect(body).toContain('END:VCALENDAR');
  });

  test('rejects invalid token', async ({ request }) => {
    const res = await request.get(`/api/seasons/${seasonId}/calendar.ics?token=invalid`);
    expect([401, 404]).toContain(res.status());
  });
});

