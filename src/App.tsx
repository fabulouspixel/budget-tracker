import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import { ActivePeriodPage } from "./routes/ActivePeriodPage";
import { ArchiveDetailPage } from "./routes/ArchiveDetailPage";
import { ArchivePage } from "./routes/ArchivePage";
import { SettingsPage } from "./routes/SettingsPage";

export function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <header className="app-header">
          <span className="app-title">Budget Tracker</span>
          <nav className="app-nav" aria-label="Main navigation">
            <NavLink to="/" end>
              Active
            </NavLink>
            <NavLink to="/archive">Archive</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<ActivePeriodPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/archive/:periodId" element={<ArchiveDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

