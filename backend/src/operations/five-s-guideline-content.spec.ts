import { defaultGuidelineContent } from './five-s-guideline-content';

/**
 * The default 5S standard every new workspace starts from.
 *
 * It is the product's, not one site's: a pilot organisation's own folder
 * prefixes and colours were once written into it, so every new customer
 * started out filing documents under somebody else's name.
 */
describe('default 5S guideline content', () => {
  const text = JSON.stringify(defaultGuidelineContent);

  it.each(['МБТ', 'APO', 'Гүйцэтгэх захир'])('names no particular organisation (%s)', (word) => {
    expect(text).not.toContain(word);
  });

  it('still carries label standards and assessment criteria', () => {
    expect(defaultGuidelineContent.labelStandards.length).toBeGreaterThan(3);
    expect(defaultGuidelineContent.assessmentCriteria.length).toBeGreaterThan(10);
  });
});
