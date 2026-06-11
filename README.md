# Budget Tracker

Budget Tracker is a small mobile-first web application for tracking a personal budget locally. It is designed as a static React app without a backend, user accounts, or cloud synchronization.

The app stores all data on the user's device and focuses on fast entry, clear balances, and simple period-based budgeting.

## Live Demo

The GitHub Pages deployment URL is:

https://fabulouspixel.github.io/budget-tracker/

## Features

- Local browser storage with IndexedDB and Dexie.js
- Active and archived budget periods
- Income and expense entries
- Optional starting budget, including negative starting balances
- Automatic balance calculation
- Categories derived from existing entries
- JSON export and import for local backups
- Read-only archive for completed periods

## Tech Stack

- React
- TypeScript
- Vite
- Dexie.js
- IndexedDB

## Getting Started

Install dependencies:

```sh
npm install
```

Start the local development server:

```sh
npm run dev
```

Vite will print the local development URL. By default, it is usually:

```text
http://localhost:5173
```

## Available Scripts

Build the app for production:

```sh
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

Run the test suite:

```sh
npm run test
```

## Deployment

The app is intended to be deployable as a fully static website.

For the repository `fabulouspixel/budget-tracker`, the Vite base path should be configured as:

```ts
base: "/budget-tracker/"
```

This allows assets and routes to work correctly when the app is hosted through GitHub Pages at:

```text
https://fabulouspixel.github.io/budget-tracker/
```

Deployment is configured through GitHub Actions from the `main` branch. The local folder is not initialized as a git repository by default. To publish the app, initialize git, add the remote repository, push to `main`, and enable GitHub Pages with GitHub Actions as the source.

Typical first publish flow:

```sh
git init
git add .
git commit -m "Initial budget tracker MVP"
git branch -M main
git remote add origin https://github.com/fabulouspixel/budget-tracker.git
git push -u origin main
```

## Install as App

The app includes a web app manifest and service worker so supported browsers can install it as a Progressive Web App.

On Android Chrome, open the deployed app and use the browser menu to choose `Install app` or `Add to Home screen`.

PWA installation requires HTTPS. GitHub Pages provides HTTPS for:

```text
https://fabulouspixel.github.io/budget-tracker/
```

## Data & Privacy

All budget data stays on the user's device. The app does not require a backend, account, login, or cloud synchronization.

Data export and import use local JSON files. Importing a backup replaces the existing local data.

Clearing browser data can remove the stored budget data. Users should export a backup before clearing site data or switching devices.

## Data Model

The app is based on budget periods and entries.

A period contains a title, optional starting budget, status, creation date, optional archive date, and entries.

An entry represents either income or an expense. Entry amounts are always stored as positive integer cent values. Whether an entry increases or decreases the balance is determined by its type.

All monetary values are stored internally as integer cents to avoid floating-point rounding errors.

## MVP Scope

The MVP includes:

- Active period view
- Creating a new period
- Adding, editing, and deleting entries
- Automatic balance calculation
- Archive list
- Read-only archive details
- JSON export and import
- Basic settings view

The MVP does not include:

- User accounts
- Login
- Backend services
- Cloud synchronization
- Multi-user support
- Multiple currencies
- Statistics
- Charts and graphs
- CSV export
- Editing archived periods

## Project Status

MVP implemented. The app supports local period-based budgeting, entry CRUD, archive details, and JSON backup import/export.

## License

MIT
