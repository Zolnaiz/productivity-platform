import type { Page } from '@playwright/test';

const hrefs = (anchors: Element[]) => [
  ...new Set(anchors.map((a) => a.getAttribute('href') ?? '').filter((href) => href.startsWith('/'))),
];

/**
 * Every page somebody can reach from the menu: each section in the main
 * menu, and each tab across the top of a section. Read from the page, so a
 * page added to the menu is walked without anybody listing it here.
 */
export const everyMenuPage = async (page: Page): Promise<string[]> => {
  const menu = page.getByRole('navigation', { name: /main menu|үндсэн цэс/i });
  await menu.getByRole('link').first().waitFor();
  const sections = await menu.getByRole('link').evaluateAll(hrefs);

  const pages = new Set(sections);
  for (const section of sections) {
    await page.goto(section);
    const tabs = page.getByTestId('section-tabs');
    if (await tabs.count()) {
      for (const tab of await tabs.getByRole('link').evaluateAll(hrefs)) pages.add(tab);
    }
  }
  return [...pages];
};
