import { interpolate, MailLanguage } from '../shared/mail/wording';

/**
 * What the server raises, in each language, for the messages that leave the
 * product.
 *
 * The same words the web and the phone use for these keys; a test holds the
 * three copies together, so an email never says something the inbox does not.
 */
export const RAISED_WORDING: Record<MailLanguage, Record<string, string>> = {
  en: {
    'raised.tierAuditDue': '{{layer}} 5S audit due: {{place}}',
    'raised.redTagDecision': 'Red-tag decision due: {{item}}',
    'raised.auditFollowUp': '5S follow-up: {{place}}',
    'raised.dailyDigest': 'Today: {{dueToday}} due, {{overdue}} late',
    'raised.teamDigest': 'Team today: {{late}} late, {{unassigned}} with nobody on it',
    'raised.dueOn': 'Due {{date}}',
    'raised.dailyDigestBody': 'Late:\n{{overdue}}\nDue today:\n{{dueToday}}',
    'raised.teamDigestBody': 'Nobody on it:\n{{unassigned}}\nLate:\n{{late}}',
    'raised.tierAuditDueBody.daily':
      'Layer: tier {{tier}} ({{layer}})\nFrequency: daily\nLast checked at this layer: {{lastChecked}}\nDue: {{due}}',
    'raised.tierAuditDueBody.weekly':
      'Layer: tier {{tier}} ({{layer}})\nFrequency: weekly\nLast checked at this layer: {{lastChecked}}\nDue: {{due}}',
    'raised.tierAuditDueBody.monthly':
      'Layer: tier {{tier}} ({{layer}})\nFrequency: monthly\nLast checked at this layer: {{lastChecked}}\nDue: {{due}}',
    'raised.redTagDecisionBody':
      'Area: {{place}}\nHeld since: {{heldSince}}\nDecide whether the item is disposed of or returned to the area.',
    'raised.auditFollowUpBody':
      'The audit on {{date}} scored {{score}}%.\nThe standard for this area is {{standard}}%.\nBring the area back to its standard; the next audit verifies it.',
  },
  mn: {
    'raised.tierAuditDue': '{{layer}}-ын 5S аудитын хугацаа болсон: {{place}}',
    'raised.redTagDecision': 'Улаан шошготой зүйлд шийдвэр гаргах хугацаа болсон: {{item}}',
    'raised.auditFollowUp': '5S залруулах ажил: {{place}}',
    'raised.dailyDigest': 'Өнөөдөр: {{dueToday}} ажлын хугацаа дуусна, {{overdue}} хоцорсон',
    'raised.teamDigest': 'Багийн өнөөдөр: {{late}} хоцорсон, {{unassigned}} хариуцагчгүй',
    'raised.dueOn': '{{date}}-нд дуусна',
    'raised.dailyDigestBody': 'Хоцорсон:\n{{overdue}}\nӨнөөдөр дуусах:\n{{dueToday}}',
    'raised.teamDigestBody': 'Хариуцагчгүй:\n{{unassigned}}\nХоцорсон:\n{{late}}',
    'raised.tierAuditDueBody.daily':
      'Түвшин: {{tier}} ({{layer}})\nДавтамж: өдөр бүр\nЭнэ түвшинд сүүлд шалгасан: {{lastChecked}}\nДуусах: {{due}}',
    'raised.tierAuditDueBody.weekly':
      'Түвшин: {{tier}} ({{layer}})\nДавтамж: долоо хоног бүр\nЭнэ түвшинд сүүлд шалгасан: {{lastChecked}}\nДуусах: {{due}}',
    'raised.tierAuditDueBody.monthly':
      'Түвшин: {{tier}} ({{layer}})\nДавтамж: сар бүр\nЭнэ түвшинд сүүлд шалгасан: {{lastChecked}}\nДуусах: {{due}}',
    'raised.redTagDecisionBody':
      'Бүс: {{place}}\nШошголсон: {{heldSince}}\nЗүйлийг хаях эсвэл бүсэд нь буцаахыг шийднэ үү.',
    'raised.auditFollowUpBody':
      '{{date}}-ны аудитын оноо {{score}}%.\nЭнэ бүсийн стандарт {{standard}}%.\nБүсийг стандартад нь эргүүлж оруулна уу; дараагийн аудит үүнийг шалгана.',
  },
};

/**
 * A raised text in the given language, or the stored sentence when there is
 * no language, no key, or a key this server does not know.
 */
export const wordRaised = (
  key: string | undefined | null,
  params: Record<string, unknown> | undefined,
  language: MailLanguage | undefined,
  fallback: string,
) => {
  const template = key && language ? RAISED_WORDING[language][key] : undefined;

  return template ? interpolate(template, params) : fallback;
};
