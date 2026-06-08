# Budget Tracker Web App – Project Specification

## Goal

Develop a small mobile-first web application for tracking a budget locally.

The application should be intentionally simple and work without any backend. All data must remain exclusively on the user's device.

The application is primarily intended for smartphone use but should also work on desktop devices.

---

# Technical Requirements

## Architecture

The application will be implemented as a mobile-first web application.

Technology stack:

- React
- TypeScript
- Vite
- IndexedDB for local data storage
- Dexie.js as a wrapper for IndexedDB

The application must not require:

- a backend
- user accounts
- cloud synchronization
- a server-side database
- a native app
- React Native

The application must be deployable as a fully static website.

Suitable hosting options:

- GitHub Pages
- Any standard web hosting provider

---

# Core Concept

The application manages budgets within so-called periods.

A period:

- has a user-defined title
- is independent of calendar dates
- may optionally have a starting budget
- contains any number of entries
- can be active or archived

There is always exactly one active period.

When a new period is created, the previously active period is automatically archived.

---

# Data Model

## Period

A period contains:

- ID
- Title
- Optional starting budget
- Status (active or archived)
- Creation date
- Archive date (optional)
- List of entries

---

## Entry

An entry contains:

- ID
- Type
  - Income
  - Expense
- Amount
- Optional title/description
- Optional date
- Optional category
- Created timestamp
- Updated timestamp

---

# Monetary Values

All monetary values must be stored internally as integer cent values.

Examples:

- €12.50 → 1250
- €100.00 → 10000

Floating point numbers must not be used for storage.

Display format:

- Euro currency format
- Example: €12.50

---

# Starting Budget

A period may optionally have a starting budget.

Examples:

- €0
- €100
- €500

The starting budget serves as the opening balance for the period.

---

# Entries

Entries represent income or expenses.

The amount itself is always positive.

Examples:

Correct:

- Type: Income
- Amount: €50

Correct:

- Type: Expense
- Amount: €12.99

Incorrect:

- Amount: -€12.99

Whether an amount increases or decreases the balance is determined exclusively by the entry type.

---

# Validation

## Required Fields

An entry requires:

- Type
- Amount

## Optional Fields

- Title/Description
- Date
- Category

## Rules

- Amount must be greater than zero
- Amount must never be negative
- If no date is provided, the current date is used automatically
- Category is optional
- By default, an entry has no category

---

# Balance Calculation

The current balance of a period is calculated as:

Starting Budget
+ All Income Entries
− All Expense Entries

The balance may become negative.

Example:

Starting Budget: €100

Income:
+ €50

Expenses:
− €200

Result:

− €50

---

# Main View

The main view displays:

- Title of the active period
- Starting budget
- Current balance
- List of all entries

Additionally:

- Add income entry
- Add expense entry
- Edit entry
- Delete entry
- Create new period
- Open archive

The current balance must update immediately after any change.

---

# Creating a New Period

When creating a new period:

1. The active period is archived
2. The archive date is set
3. The new period becomes active
4. The user can define a title
5. The user can optionally define a starting budget

---

# Archive

Archived periods remain stored locally.

In the MVP, archived periods are read-only.

Users can:

- View the archive list
- Open archived periods
- View entries

Users cannot:

- Edit archived entries
- Delete archived entries
- Modify archived periods

---

# Archive List

The archive overview displays:

- Title
- Final balance
- Starting budget
- Number of entries
- Creation date
- Archive date

---

# Categories

Categories are optional.

For the MVP:

- Categories can be selected from existing categories
- Default value: No category

Categories are not a core feature and should remain simple.

---

# Import / Export

## Export

The application supports exporting all data as a JSON file.

The export contains:

- Active period
- Archived periods
- Entries
- Categories
- Data format version

Default filename:

`budget-tracker-backup.json`

---

## Import

The application supports importing a JSON file.

Before import, a warning must be displayed:

> Existing data will be replaced.

For the MVP:

- Existing data is completely replaced

Merging imported data is not part of the MVP.

---

# Navigation

The application must provide at least the following views:

## Active Period

Displays the current budgeting period.

## Add Entry

Form for creating a new entry.

## Edit Entry

Form for editing an existing entry.

## Archive List

Overview of all archived periods.

## Archive Details

Detailed view of an archived period.

## Settings

Area for:

- Data export
- Data import
- Future settings

---

# User Interface

The application must be designed mobile-first.

Requirements:

- Large touch targets
- Simple navigation
- Fast data entry
- Clear display of the current balance
- Minimal steps required to create an entry

The focus is on usability and speed rather than complex graphics.

---

# Out of Scope for MVP

The following features are explicitly excluded from the first version:

- User accounts
- Login
- Cloud synchronization
- Multi-user support
- Multiple currencies
- Statistics
- Charts and graphs
- CSV export
- React Native
- Backend services
- Server-side databases
- Editing archived periods

---

# Possible Future Enhancements

- Statistics
- Charts and graphs
- Category-based analysis
- CSV export
- Reopening archived periods
- Editing archived periods
- PWA with offline support
- Local password protection
- Optional cloud synchronization
- Multi-currency support

---

# Suggested Implementation Plan

Recommended implementation order:

1. Create the project with Vite, React, and TypeScript
2. Define the data model
3. Integrate Dexie / IndexedDB
4. Build navigation and base layout
5. Implement the active period
6. Implement creating, editing, and deleting entries
7. Implement balance calculation
8. Implement archive functionality
9. Implement import/export
10. Improve the mobile UI
11. Add error handling and testing
12. Deploy to GitHub Pages
