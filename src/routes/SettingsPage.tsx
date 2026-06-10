import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  renameCategory,
} from "../db/categoryService";
import type { Category } from "../domain/types";

export function SettingsPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | undefined>();
  const [editingCategoryName, setEditingCategoryName] = useState("");
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

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(undefined);
    setErrorMessage(undefined);

    try {
      await createCategory(categoryName);
      setCategoryName("");
      await loadCategories();
      setStatusMessage("Category created.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The category could not be created.",
      );
    }
  }

  async function handleRenameCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingCategoryId) {
      return;
    }

    setStatusMessage(undefined);
    setErrorMessage(undefined);

    try {
      await renameCategory(editingCategoryId, editingCategoryName);
      setEditingCategoryId(undefined);
      setEditingCategoryName("");
      await loadCategories();
      setStatusMessage("Category renamed.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The category could not be renamed.",
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

      <section className="settings-panel" aria-labelledby="categories-title">
        <h2 id="categories-title">Categories</h2>
        <p className="muted">
          Manage the category suggestions used when adding or editing entries.
        </p>

        <form className="inline-form" onSubmit={handleCreateCategory}>
          <label>
            <span>New category</span>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Groceries"
            />
          </label>
          <button className="primary-action" type="submit">
            Add
          </button>
        </form>

        {categories.length === 0 ? (
          <p className="muted">No categories yet.</p>
        ) : (
          <div className="category-list">
            {categories.map((category) => (
              <article className="category-list-item" key={category.id}>
                {editingCategoryId === category.id ? (
                  <form className="inline-form" onSubmit={handleRenameCategory}>
                    <label>
                      <span>Category name</span>
                      <input
                        autoFocus
                        value={editingCategoryName}
                        onChange={(event) =>
                          setEditingCategoryName(event.target.value)
                        }
                      />
                    </label>
                    <div className="entry-actions">
                      <button className="icon-action" type="submit" aria-label="Save category">
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                      </button>
                      <button
                        className="icon-action"
                        type="button"
                        aria-label="Cancel category edit"
                        onClick={() => {
                          setEditingCategoryId(undefined);
                          setEditingCategoryName("");
                        }}
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span className="category-name">{category.name}</span>
                    <div className="entry-actions">
                      <button
                        aria-label="Delete category"
                        className="icon-action danger-icon-action"
                        type="button"
                        onClick={() => void handleDeleteCategory(category)}
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="M5 7h14" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M6 7l1 14h10l1-14" />
                          <path d="M9 7V4h6v3" />
                        </svg>
                      </button>
                      <button
                        aria-label="Edit category"
                        className="icon-action"
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setEditingCategoryName(category.name);
                        }}
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                          <path d="M4 20h4l11-11-4-4L4 16v4Z" />
                          <path d="m14 6 4 4" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
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
