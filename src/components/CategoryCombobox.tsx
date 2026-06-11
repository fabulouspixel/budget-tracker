import { type KeyboardEvent, useState } from "react";

export interface CategoryComboboxOption {
  id?: string;
  name: string;
}

interface CategoryComboboxProps {
  addLabel?: string;
  categories: CategoryComboboxOption[];
  label: string;
  onAdd?: (name: string) => void;
  onChange: (value: string) => void;
  onDelete?: (category: CategoryComboboxOption) => void;
  placeholder?: string;
  value: string;
}

export function CategoryCombobox({
  addLabel = "Add category",
  categories,
  label,
  onAdd,
  onChange,
  onDelete,
  placeholder = "No category",
  value,
}: CategoryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const trimmedValue = value.trim();
  const filteredCategories = categories.filter((category) =>
    category.name.toLocaleLowerCase().includes(trimmedValue.toLocaleLowerCase()),
  );
  const canAdd = Boolean(onAdd && trimmedValue);

  function openIfAvailable() {
    setIsOpen(categories.length > 0);
  }

  function handleAdd() {
    if (!canAdd || !onAdd) {
      return;
    }

    onAdd(trimmedValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !onAdd) {
      return;
    }

    event.preventDefault();
    handleAdd();
  }

  return (
    <div className="combo-control">
      <label>
        <span>{label}</span>
        <div className={`combo-field${onAdd ? " combo-field-with-add" : ""}`}>
          <input
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              openIfAvailable();
            }}
            onFocus={openIfAvailable}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
          {onAdd ? (
            <button
              aria-label={addLabel}
              className="combo-icon-button"
              disabled={!canAdd}
              type="button"
              onClick={handleAdd}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
          ) : null}
          <button
            aria-label="Show categories"
            className="combo-toggle"
            disabled={categories.length === 0}
            type="button"
            onClick={() => setIsOpen((current) => !current)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </label>

      {isOpen && filteredCategories.length > 0 ? (
        <div className="combo-menu">
          {filteredCategories.map((category) => (
            <div
              className={`combo-menu-row${onDelete ? " combo-menu-row-with-action" : ""}`}
              key={category.id ?? category.name}
            >
              <button
                className="combo-menu-option"
                type="button"
                onClick={() => {
                  onChange(category.name);
                  setIsOpen(false);
                }}
              >
                {category.name}
              </button>
              {onDelete ? (
                <button
                  aria-label={`Delete ${category.name}`}
                  className="combo-menu-delete"
                  type="button"
                  onClick={() => onDelete(category)}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M5 7h14" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M6 7l1 14h10l1-14" />
                    <path d="M9 7V4h6v3" />
                  </svg>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
