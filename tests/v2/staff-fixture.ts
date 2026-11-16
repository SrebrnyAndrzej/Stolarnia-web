import { test as base, expect } from "@playwright/test";

// Only the loopback QA server accepts this fixture when explicitly enabled.
// Production authorization is verified separately against Express + Supabase test doubles.
export const test = base.extend({
  page: async ({ page, context, baseURL }, use) => {
    await context.addCookies([
      { name: "pan_stolarz_qa_staff", value: "employee", url: baseURL! },
    ]);
    await use(page);
  },
});
export { expect };
