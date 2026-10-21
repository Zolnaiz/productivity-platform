import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import { apiErrorMessage } from '../../i18n/apiError';
import { BulkInviteResult, peopleService } from '../../services/people.service';
import { invitesFromSheet, readSheet } from '../../utils/sheetImport';

/**
 * UC-17: invite a whole list from a CSV or Excel file. The file is read in the
 * browser, every row is checked by the server (a dry run) and shown with what
 * is wrong with it, and only then does "Invite" send anything.
 */
const BulkInvite: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Array<{ email: string; role: string }>>([]);
  const [preview, setPreview] = useState<BulkInviteResult | null>(null);
  const [done, setDone] = useState<BulkInviteResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPreview(null);
    setDone(null);
    setBusy(true);
    try {
      const read = invitesFromSheet(await readSheet(file));
      if (!read.length) {
        setError(t('bulkInvite.emptyFile'));
        return;
      }
      setRows(read);
      setPreview(await peopleService.importInvitations(read, true));
    } catch (readError) {
      setError(readError instanceof Error && !('response' in readError) ? t('bulkInvite.unreadable') : apiErrorMessage(readError, t));
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      setDone(await peopleService.importInvitations(rows, false));
      setPreview(null);
      onDone();
    } catch (sendError) {
      setError(apiErrorMessage(sendError, t));
    } finally {
      setBusy(false);
    }
  };

  const shown = done ?? preview;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('bulkInvite.help')}</p>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('bulkInvite.file')}
        <input
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="mt-1 block w-full text-sm"
          disabled={busy}
          onChange={(event) => choose(event.target.files?.[0])}
        />
      </label>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {shown && (
        <>
          <p className="text-sm text-gray-700 dark:text-gray-300" role="status">
            {done
              ? t('bulkInvite.sent', { valid: done.valid, total: done.total })
              : t('bulkInvite.summary', { valid: shown.valid, total: shown.total })}
          </p>
          <div className="max-h-72 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-2 py-1">{t('bulkInvite.row')}</th>
                  <th className="px-2 py-1">{t('bulkInvite.email')}</th>
                  <th className="px-2 py-1">{t('bulkInvite.role')}</th>
                  <th className="px-2 py-1">{t('bulkInvite.result')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {shown.rows.map((row) => (
                  <tr key={row.row}>
                    <td className="px-2 py-1">{row.row}</td>
                    <td className="px-2 py-1">{row.email || '—'}</td>
                    <td className="px-2 py-1">{row.role}</td>
                    <td className={`px-2 py-1 ${row.status === 'ok' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {row.status === 'ok' ? t('bulkInvite.ok') : t(`bulkInvite.error.${row.error}`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview && (
            <Button type="button" onClick={send} disabled={busy || preview.valid === 0}>
              {t('bulkInvite.send', { count: preview.valid })}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default BulkInvite;
