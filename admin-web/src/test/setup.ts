// Components call useTranslation, so i18next has to be initialised before any
// test renders one. Without this a page renders raw keys instead of copy.
import '../i18n';
