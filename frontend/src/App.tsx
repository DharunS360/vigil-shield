import { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import AlertDetails from "./pages/AlertDetails";
import Incidents from "./pages/Incidents";
import IncidentDetails from "./pages/IncidentDetails";
import Casebook from "./pages/Casebook";
import CaseDetail from "./pages/CaseDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// ============================================================
// Theme Context
// ============================================================
export type Theme = "dark" | "light";

export interface ThemeColors {
  bg: string;
  bgCard: string;
  bgHover: string;
  bgInput: string;
  border: string;
  text: string;
  textMuted: string;
  textHeading: string;
  accent: string;
  accentHover: string;
  navBg: string;
  navBorder: string;
  navActiveBg: string;
  navActiveText: string;
}

export const themeColors: Record<Theme, ThemeColors> = {
  dark: {
    bg: "#0a0f1a",
    bgCard: "#0f1621",
    bgHover: "#141b28",
    bgInput: "#1e293b",
    border: "#1e293b",
    text: "#fff",
    textMuted: "#8a96b8",
    textHeading: "#fff",
    accent: "#00bfff",
    accentHover: "#00d4ff",
    navBg: "#0a0f1a",
    navBorder: "#1e293b",
    navActiveBg: "rgba(0, 191, 255, 0.1)",
    navActiveText: "#00bfff",
  },
  light: {
    bg: "#f5f7fa",
    bgCard: "#ffffff",
    bgHover: "#f1f5f9",
    bgInput: "#f8fafc",
    border: "#e2e8f0",
    text: "#1e293b",
    textMuted: "#64748b",
    textHeading: "#0f172a",
    accent: "#0082c8",
    accentHover: "#0066a0",
    navBg: "#ffffff",
    navBorder: "#e2e8f0",
    navActiveBg: "rgba(0, 130, 200, 0.1)",
    navActiveText: "#0082c8",
  },
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  colors: themeColors.dark,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ============================================================
// NavBar
// ============================================================
const NavBar = () => {
  const location = useLocation();
  const { theme, colors, toggleTheme } = useTheme();

  const links = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/alerts", label: "Alerts", icon: "🚨" },
    { path: "/incidents", label: "Incidents", icon: "🔺" },
    { path: "/casebook", label: "Casebook", icon: "📚" },
    { path: "/reports", label: "Reports", icon: "📄" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav
      style={{
        background: colors.navBg,
        borderBottom: `1px solid ${colors.navBorder}`,
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: colors.text,
          fontSize: "18px",
          fontWeight: 700,
        }}
      >
        🛡️ VigilShield SIEM
      </div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", flex: 1 }}>
        {links.map((link) => {
          const isActive =
            link.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                color: isActive ? colors.navActiveText : colors.textMuted,
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                background: isActive ? colors.navActiveBg : "transparent",
                transition: "all 0.2s",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {link.icon} {link.label}
            </Link>
          );
        })}
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        style={{
          background: colors.bgInput,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </nav>
  );
};

// ============================================================
// App
// ============================================================
function App() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("vigilshield-theme");
    return (saved === "light" || saved === "dark" ? saved : "dark") as Theme;
  });

  useEffect(() => {
    localStorage.setItem("vigilshield-theme", theme);
    document.body.style.background = themeColors[theme].bg;
    document.body.style.color = themeColors[theme].text;
    document.body.style.transition = "background 0.3s ease, color 0.3s ease";
  }, [theme]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const toggleTheme = () =>
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  const contextValue: ThemeContextType = {
    theme,
    colors: themeColors[theme],
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <Router>
        <div
          style={{
            minHeight: "100vh",
            background: themeColors[theme].bg,
            color: themeColors[theme].text,
            transition: "all 0.3s ease",
          }}
        >
          <NavBar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/alerts/:id" element={<AlertDetails />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/incidents/:id" element={<IncidentDetails />} />
            <Route path="/casebook" element={<Casebook />} />
            <Route path="/casebook/:slug" element={<CaseDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;