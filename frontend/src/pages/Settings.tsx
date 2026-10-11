import { useState } from "react";
import { useTheme } from "../App";

const Settings = () => {
  const { theme, colors, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("30 seconds");

  const cardStyle: React.CSSProperties = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "16px",
    transition: "all 0.3s ease",
  };

  const sectionHeader: React.CSSProperties = {
    color: colors.accent,
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "16px",
    marginTop: 0,
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ color: colors.textHeading, fontSize: "28px", margin: 0 }}>
            ⚙️ Settings
          </h1>
          <p
            style={{
              color: colors.textMuted,
              margin: "4px 0 0 0",
              fontSize: "14px",
            }}
          >
            Configure your VigilShield SIEM
          </p>
        </div>
        <button
          onClick={() =>
            alert(`✅ Settings saved!\n\nTheme: ${theme.toUpperCase()}`)
          }
          style={{
            background: "#22c55e",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          💾 Save Settings
        </button>
      </div>

      {/* Appearance */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>🎨 Appearance</h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              color: colors.text,
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Theme:
          </div>
          <button
            onClick={() => setTheme("dark")}
            style={{
              background: theme === "dark" ? colors.bgInput : "transparent",
              color: theme === "dark" ? colors.accent : colors.textMuted,
              border: `2px solid ${
                theme === "dark" ? colors.accent : colors.border
              }`,
              padding: "8px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.2s",
            }}
          >
            🌙 Dark
          </button>
          <button
            onClick={() => setTheme("light")}
            style={{
              background:
                theme === "light" ? "rgba(245, 158, 11, 0.15)" : "transparent",
              color: theme === "light" ? "#f59e0b" : colors.textMuted,
              border: `2px solid ${
                theme === "light" ? "#f59e0b" : colors.border
              }`,
              padding: "8px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              transition: "all 0.2s",
            }}
          >
            ☀️ Light
          </button>
        </div>
        <p
          style={{
            color: colors.textMuted,
            fontSize: "12px",
            marginTop: "12px",
            marginBottom: 0,
          }}
        >
          ℹ️ Theme is saved automatically and applied across all pages
        </p>
      </div>

      {/* Notifications */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>🔔 Notifications</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: colors.textMuted, fontSize: "14px" }}>
            Enable notifications
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            style={{
              background: notifications ? "#22c55e" : "#64748b",
              color: "#fff",
              border: "none",
              padding: "6px 16px",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "12px",
              minWidth: "60px",
            }}
          >
            {notifications ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Auto Refresh */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>🔄 Auto Refresh</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div style={{ color: colors.textMuted, fontSize: "14px" }}>
            Enable auto-refresh
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              background: autoRefresh ? "#22c55e" : "#64748b",
              color: "#fff",
              border: "none",
              padding: "6px 16px",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "12px",
              minWidth: "60px",
            }}
          >
            {autoRefresh ? "ON" : "OFF"}
          </button>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "12px",
          }}
        >
          <div style={{ color: colors.textMuted, fontSize: "14px" }}>
            Refresh interval:
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value)}
            style={{
              background: colors.bgInput,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            <option>10 seconds</option>
            <option>30 seconds</option>
            <option>60 seconds</option>
            <option>5 minutes</option>
          </select>
        </div>
      </div>

      {/* About */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>ℹ️ About VigilShield SIEM</h3>
        <div
          style={{
            color: colors.textMuted,
            fontSize: "14px",
            lineHeight: 1.8,
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ color: colors.text }}>Version:</strong> 1.0.0
          </div>
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ color: colors.text }}>Platform:</strong> SOC Alert
            Triage & Incident Management
          </div>
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ color: colors.text }}>Built by:</strong> Dharun S
          </div>
          <div>
            <strong style={{ color: colors.text }}>Features:</strong> Real-time
            alerts, IOC enrichment, correlation engine, casebook, MITRE mapping
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;