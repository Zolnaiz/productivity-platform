import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/*
 * The privacy policy, at /privacy.
 *
 * Why it exists: Google Play refuses an app that asks for the camera and holds
 * personal data unless its listing links a privacy policy, and people signing
 * an organization up on /register should be able to read what is kept about
 * their staff before they do. So the page is public: App.tsx mounts it outside
 * ProtectedRoute, and the landing page links to it.
 *
 * Where the words are: every sentence lives in the locale files under
 * `privacy.*` (en.ts is the reference, mn.ts the translation), as the
 * no-hardcoded-text test requires. This file only decides the order.
 *
 * What it must stay true to. Each section states a fact about the code, so
 * changing that code means changing the policy in the same commit:
 *   collect   - the user entity (backend/src/users/entities/user.entity.ts),
 *               attachments, and the camera permission in the Android manifest
 *   ai        - the only data that leaves the server:
 *               backend/src/operations/monthly-summary.service.ts (monthFacts)
 *   device    - the phone's read cache, cleared on sign-out, and its outbox,
 *               whose changes only their owner's session sends
 *               (mobile-flutter/lib/services/read_cache.dart, outbox.dart,
 *               providers/auth_provider.dart)
 *   storage   - bcrypt in backend/src/users/users.service.ts
 *   retention - DEFAULT_RETENTION_DAYS in backend/src/audit/audit-retention.service.ts
 *   rights    - the deletion request (FR-21): AccountPage on the web, AccountMenu
 *               in mobile-flutter/lib/screens/tasks_screen.dart, and
 *               backend/src/operations/account.controller.ts; an administrator's
 *               deletion closes the account (UsersService.remove)
 */
const sections = ['collect', 'use', 'ai', 'device', 'storage', 'retention', 'rights', 'contact'] as const;

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <article className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800 md:p-10">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('privacy.title')}</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('privacy.updated')}</p>
        <p className="mt-6 text-gray-700 dark:text-gray-300">{t('privacy.intro')}</p>
        {sections.map((id) => (
          <section key={id} className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t(`privacy.${id}.title`)}</h2>
            <p className="mt-2 leading-relaxed text-gray-700 dark:text-gray-300">{t(`privacy.${id}.body`)}</p>
          </section>
        ))}
        <Link to="/" className="mt-10 inline-block text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
          {t('privacy.back')}
        </Link>
      </article>
    </main>
  );
};

export default PrivacyPage;
