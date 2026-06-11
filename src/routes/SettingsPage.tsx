import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryCombobox } from "../components/CategoryCombobox";
import {
  BACKUP_FILE_NAME,
  createBackup,
  deleteAllLocalData,
  parseBackupJson,
  replaceDataFromBackup,
  serializeBackup,
} from "../db/backupService";
import {
  createCategory,
  deleteCategory,
  getCategories,
} from "../db/categoryService";
import type { Category } from "../domain/types";

export function SettingsPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isImporting, setIsImporting] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);

  async function loadCategories() {
    setCategories(await getCategories());
  }

  useEffect(() => {
    void loadCategories();
  }, []);

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
      await loadCategories();
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

  async function handleCreateCategory(name: string) {
    setStatusMessage(undefined);
    setErrorMessage(undefined);

    try {
      await createCategory(name);
      setCategoryName("");
      await loadCategories();
      setStatusMessage("Category created.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The category could not be created.",
      );
    }
  }

  async function handleDeleteCategory(category: Category) {
    const canDelete = window.confirm(
      "Delete this category? Entries using it will become uncategorized.",
    );

    if (!canDelete) {
      return;
    }

    setStatusMessage(undefined);
    setErrorMessage(undefined);

    try {
      await deleteCategory(category.id);
      if (categoryName === category.name) {
        setCategoryName("");
      }
      await loadCategories();
      setStatusMessage("Category deleted.");
    } catch {
      setErrorMessage("The category could not be deleted.");
    }
  }

  async function handleDeleteAllLocalData() {
    const canDelete = window.confirm(
      "Delete all local data? This cannot be undone.",
    );

    if (!canDelete) {
      return;
    }

    setStatusMessage(undefined);
    setErrorMessage(undefined);
    setIsDeletingData(true);

    try {
      await deleteAllLocalData();
      await loadCategories();
      setStatusMessage("All local data was deleted.");
    } catch {
      setErrorMessage("Local data could not be deleted.");
    } finally {
      setIsDeletingData(false);
    }
  }

  return (
    <section className="page-section" aria-labelledby="settings-title">
      <h1 className="settings-title" id="settings-title">
        Backup
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

      <section className="settings-panel" aria-labelledby="categories-title">
        <h2 id="categories-title">Categories</h2>
        <p className="muted">
          Manage the category suggestions used when adding or editing entries.
        </p>

        <CategoryCombobox
          addLabel="Add category"
          categories={categories}
          label="Category"
          placeholder="No category"
          value={categoryName}
          onAdd={(name) => void handleCreateCategory(name)}
          onChange={setCategoryName}
          onDelete={(category) => {
            const managedCategory = categories.find(
              (candidate) => candidate.id === category.id,
            );

            if (!managedCategory) {
              return;
            }

            void handleDeleteCategory(managedCategory);
          }}
        />

        {categories.length === 0 ? (
          <p className="muted">No categories yet.</p>
        ) : null}
      </section>

      <section className="settings-panel danger-panel" aria-labelledby="local-data-title">
        <h2 id="local-data-title">Local data</h2>
        <p className="muted">
          Permanently delete all periods, entries, and categories stored in this
          browser.
        </p>
        <button
          className="danger-action"
          disabled={isDeletingData}
          type="button"
          onClick={() => void handleDeleteAllLocalData()}
        >
          {isDeletingData ? "Deleting..." : "Delete all local data"}
        </button>
      </section>
    </section>
  );
}
