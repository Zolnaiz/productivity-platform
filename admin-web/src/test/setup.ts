// Components call useTranslation, so i18next has to be initialised before any
// test renders one. Without this a page renders raw keys instead of copy.
import i18n from '../i18n';

// Tests assert against English, the reference locale, so they stay stable when
// the product's default language changes.
void i18n.changeLanguage('en');
