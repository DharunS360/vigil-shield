import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useTheme } from "../App";

interface Alert {
  id: string | number;
  timestamp?: string;
  src_ip?: string;
  dst_ip?: string;
  src_port?: number;
  dst_port?: number;
  signature?: string;
  severity?: string;
  category?: string;
  mitre_technique?: string;
  risk_score?: number;
  risk_level?: string;
  enriched_at?: string;
}

const Alerts = () => {
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filtered, setFiltered] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/alerts");
        const data = res.data;
        const list = Array.isArray(data) ? data : data.data || [];
        setAlerts(list);
        setFiltered(list);
      } catch (err) {
        console.error("Failed to load alerts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  useEffect(() => {
    let result = alerts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.src_ip?.toLowerCase().includes(q) ||
          a.dst_ip?.toLowerCase().includes(q) ||
          a.signature?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }
    if (severityFilter !== "all") {
      result = result.filter(
        (a) => a.severity?.toLowerCase() === severityFilter
      );
    }
    if (riskFilter !== "all") {
      result = result.filter((a) => a.risk_level === riskFilter);
    }
    setFiltered(result);
  }, [search, severityFilter, riskFilter, alerts]);

  const getSeverityColor = (sev?: string) => {
    switch (sev?.toLowerCase()) {
      case "critical":
        return { bg: "#7f1d1d", text: "#ef4444", border: "#ef4444" };
      case "high":
        return { bg: "#7c2d12", text: "#f97316", border: "#f97316" };
      case "medium":
        return { bg: "#78350f", text: "#fbbf24", border: "#fbbf24" };
      case "low":
        return { bg: "#064e3b", text: "#22c55e", border: "#22c55e" };
      default:
        return { bg: "#1e293b", text: "#8a96b8", border: "#334155" };
    }
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "medium":
        return "#fbbf24";
      case "low":
        return "#22c55e";
      default:
        return colors.textMuted;
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "N/A";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const inputStyle: React.CSSProperties = {
    background: colors.bgInput,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    padding: "10px 16px",
    borderRadius: "6px",
    fontSize: "14px",
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ color: colors.textHeading, fontSize: "28px", margin: 0 }}>
          🚨 Alerts
        </h1>
        <p
          style={{
            color: colors.textMuted,
            margin: "4px 0 0 0",
            fontSize: "14px",
          }}
        >
          All security alerts with detailed information
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search alerts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: "300px", flex: 1 }}
        />
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical Risk</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>

      <div
        style={{
          color: colors.textMuted,
          fontSize: "13px",
          marginBottom: "16px",
        }}
      >
        Showing {filtered.length} of {alerts.length} alerts
      </div>

      <div
        style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          overflow: "hidden",
          transition: "all 0.3s ease",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: colors.textMuted,
            }}
          >
            Loading alerts...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: colors.textMuted,
            }}
          >
            No alerts found
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: colors.bgInput }}>
                <th style={{ ...thStyle, color: colors.textMuted }}>Time</th>
                <th style={{ ...thStyle, color: colors.textMuted }}>Source</th>
                <th style={{ ...thStyle, color: colors.textMuted }}>
                  Destination
                </th>
                <th style={{ ...thStyle, color: colors.textMuted }}>
                  Signature
                </th>
                <th style={{ ...thStyle, color: colors.textMuted }}>
                  Severity
                </th>
                <th style={{ ...thStyle, color: colors.textMuted }}>Risk</th>
                <th style={{ ...thStyle, color: colors.textMuted }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => {
                const sevColor = getSeverityColor(alert.severity);
                return (
                  <tr
                    key={alert.id}
                    style={{
                      borderTop: `1px solid ${colors.border}`,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={{ ...tdStyle, color: colors.text }}>
                      {formatTime(alert.timestamp)}
                    </td>
                    <td style={{ ...tdStyle, color: colors.text }}>
                      <div style={{ fontFamily: "monospace" }}>
                        {alert.src_ip || "N/A"}
                      </div>
                      <div
                        style={{ fontSize: "11px", color: colors.textMuted }}
                      >
                        Port: {alert.src_port || "N/A"}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: colors.text }}>
                      <div style={{ fontFamily: "monospace" }}>
                        {alert.dst_ip || "N/A"}
                      </div>
                      <div
                        style={{ fontSize: "11px", color: colors.textMuted }}
                      >
                        Port: {alert.dst_port || "N/A"}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: colors.text }}>
                      <div style={{ fontWeight: 500 }}>
                        {alert.signature || "Unknown"}
                      </div>
                      <div
                        style={{ fontSize: "11px", color: colors.textMuted }}
                      >
                        {alert.category || "Unknown"}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: sevColor.bg,
                          color: sevColor.text,
                          border: `1px solid ${sevColor.border}`,
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {alert.severity || "unknown"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {alert.enriched_at ? (
                        <div>
                          <div
                            style={{
                              color: getRiskColor(alert.risk_level),
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            {alert.risk_level?.toUpperCase() || "LOW"}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: colors.textMuted,
                            }}
                          >
                            Score: {alert.risk_score ?? 0}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{ color: colors.textMuted, fontSize: "11px" }}
                        >
                          Not enriched
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <Link
                        to={`/alerts/${alert.id}`}
                        style={{
                          color: colors.accent,
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "13px",
  verticalAlign: "top",
};

export default Alerts;