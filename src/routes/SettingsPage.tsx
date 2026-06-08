import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BACKUP_FILE_NAME,
  createBackup,
  parseBackupJson,
  replaceDataFromBackup,
  serializeBackup,
} from "../db/backupService";

export function SettingsPage() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isImporting, setIsImporting] = useState(false);

  async function handleExport() {
    setStatusMessage(undefined);
    setErrorMessage(undefined);

    try {
      const backup = await createBackup();
      const blob = new Blob([serializeBackup(backup)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = BACKUP_FILE_NAME;
      link.click();
      URL.revokeObjectURL(url);
      setStatusMessage("Backup export started.");
    } catch {
      setErrorMessage("The backup could not be exported.");
    }
  }

  async function handleImport(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    const canImport = window.confirm("Existing data will be replaced.");

    if (!canImport) {
      return;
    }

    setStatusMessage(undefined);
    setErrorMessage(undefined);
    setIsImporting(true);

    try {
      const backup = parseBackupJson(await file.text());
      await replaceDataFromBackup(backup);
      setStatusMessage("Backup imported successfully.");
      navigate("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The backup could not be imported.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="page-section" aria-labelledby="settings-title">
      <h1 className="compact-title" id="settings-title">
        Backup and app settings
      </h1>
      <p className="muted">
        Export your local data or replace it with a JSON backup.
      </p>
      {statusMessage ? <p className="success-message">{statusMessage}</p> : null}
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

      <div className="settings-actions">
        <button className="primary-action" type="button" onClick={handleExport}>
          Export JSON Backup
        </button>

        <label className="file-action">
          <span>{isImporting ? "Importing..." : "Import JSON Backup"}</span>
          <input
            accept=".json,application/json"
            disabled={isImporting}
            type="file"
            onChange={handleImport}
          />
        </label>
      </div>
    </section>
  );
}
