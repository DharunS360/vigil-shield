import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";

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
  source_type?: string;
  mitre_technique?: string;
  status?: string;
  risk_score?: number;
  risk_level?: string;
  enriched_at?: string;
}

const Alerts = () => {
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
        return "#8a96b8";
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

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ color: "#fff", fontSize: "28px", margin: 0 }}>
            🚨 Alerts
          </h1>
          <p style={{ color: "#8a96b8", margin: "4px 0 0 0", fontSize: "14px" }}>
            All security alerts with detailed information
          </p>
        </div>
      </div>

      {/* Filters */}
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
          style={{
            background: "#0f1621",
            color: "#fff",
            border: "1px solid #1e293b",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "14px",
            minWidth: "300px",
            flex: 1,
          }}
        />
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{
            background: "#0f1621",
            color: "#fff",
            border: "1px solid #1e293b",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "14px",
          }}
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
          style={{
            background: "#0f1621",
            color: "#fff",
            border: "1px solid #1e293b",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical Risk</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </div>

      {/* Count */}
      <div style={{ color: "#8a96b8", fontSize: "13px", marginBottom: "16px" }}>
        Showing {filtered.length} of {alerts.length} alerts
      </div>

      {/* Table */}
      <div
        style={{
          background: "#0f1621",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#8a96b8" }}>
            Loading alerts...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#8a96b8" }}>
            No alerts found
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1e293b" }}>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Destination</th>
                <th style={thStyle}>Signature</th>
                <th style={thStyle}>Severity</th>
                <th style={thStyle}>Risk</th>
                <th style={thStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => {
                const sevColor = getSeverityColor(alert.severity);
                return (
                  <tr
                    key={alert.id}
                    style={{
                      borderTop: "1px solid #1e293b",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#141b28";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={tdStyle}>{formatTime(alert.timestamp)}</td>
                    <td style={tdStyle}>
                      <div style={{ fontFamily: "monospace", color: "#fff" }}>
                        {alert.src_ip || "N/A"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8a96b8" }}>
                        Port: {alert.src_port || "N/A"}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontFamily: "monospace", color: "#fff" }}>
                        {alert.dst_ip || "N/A"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8a96b8" }}>
                        Port: {alert.dst_port || "N/A"}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ color: "#fff", fontWeight: 500 }}>
                        {alert.signature || "Unknown"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8a96b8" }}>
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
                          <div style={{ fontSize: "11px", color: "#8a96b8" }}>
                            Score: {alert.risk_score ?? 0}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#8a96b8", fontSize: "11px" }}>
                          Not enriched
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <Link
                        to={`/alerts/${alert.id}`}
                        style={{
                          color: "#00bfff",
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
  color: "#8a96b8",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "13px",
  color: "#fff",
  verticalAlign: "top",
};

export default Alerts;