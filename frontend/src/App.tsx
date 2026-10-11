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
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

const NavBar = () => {
  const location = useLocation();

  const links = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/alerts", label: "Alerts", icon: "🚨" },
    { path: "/incidents", label: "Incidents", icon: "🔺" },
    { path: "/reports", label: "Reports", icon: "📄" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav
      style={{
        background: "#0a0f1a",
        borderBottom: "1px solid #1e293b",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#fff",
          fontSize: "18px",
          fontWeight: 700,
        }}
      >
        🛡️ VigilShield SIEM
      </div>
      <div style={{ display: "flex", gap: "4px" }}>
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
                color: isActive ? "#00bfff" : "#8a96b8",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                background: isActive ? "rgba(0, 191, 255, 0.1)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              {link.icon} {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0f1a",
          color: "#fff",
        }}
      >
        <NavBar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/alerts/:id" element={<AlertDetails />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/:id" element={<IncidentDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;