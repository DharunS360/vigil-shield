import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";

interface Incident {
  id: number;
  title: string;
  description?: string;
  severity: string;
  status: string;
  priority?: string;
  assignee?: string;
  triage_decision?: string;
  rule_id?: string;
  rule_name?: string;
  mitre_tactics?: string[];
  mitre_techniques?: string[];
  detected_at?: string;
  resolved_at?: string;
  alert_count?: number;
}

const Incidents = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [correlating, setCorrelating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/incidents");
      const data = res.data;
      const list = Array.isArray(data) ? data : data.data || [];
      setIncidents(list);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch incidents:", err);
      setError(err?.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  const runCorrelation = async () => {
    setCorrelating(true);
    setError(null);
    try {
      const res = await apiClient.post("/incidents/correlate");
      const data = res.data;
      alert(
        `✅ Correlation complete!\n${data.incidents_created || 0} incidents created\n${data.total_alerts_analyzed || 0} alerts analyzed`
      );
      fetchIncidents();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.message || "Correlation failed";
      setError(msg);
      alert(`❌ ${msg}`);
    } finally {
      setCorrelating(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const filtered = incidents.filter((inc) => {
    if (statusFilter === "all") return true;
    return inc.status === statusFilter;
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "#ef4444";
      case "investigating":
        return "#fbbf24";
      case "resolved":
        return "#22c55e";
      case "false_positive":
        return "#8a96b8";
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
            🔺 Incidents
          </h1>
          <p style={{ color: "#8a96b8", margin: "4px 0 0 0", fontSize: "14px" }}>
            Security incidents from correlation engine
          </p>
        </div>
        <button
          onClick={runCorrelation}
          disabled={correlating}
          style={{
            background: correlating ? "#475569" : "#00bfff",
            color: "#000",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: correlating ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          {correlating ? "⏳ Running..." : "⚡ Run Correlation"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#7f1d1d",
            color: "#fecaca",
            padding: "12px 16px",
            borderRadius: "6px",
            marginBottom: "16px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["all", "open", "investigating", "resolved", "false_positive"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                background:
                  statusFilter === status ? "#00bfff20" : "transparent",
                color: statusFilter === status ? "#00bfff" : "#8a96b8",
                border: `1px solid ${
                  statusFilter === status ? "#00bfff" : "#1e293b"
                }`,
                padding: "6px 14px",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {status.replace("_", " ")}
            </button>
          )
        )}
        <div
          style={{
            marginLeft: "auto",
            color: "#8a96b8",
            fontSize: "13px",
            alignSelf: "center",
          }}
        >
          {filtered.length} incident{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#8a96b8" }}>
          Loading incidents...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: "#0f1621",
            border: "1px solid #1e293b",
            borderRadius: "8px",
            padding: "60px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h3 style={{ color: "#fff", margin: "0 0 8px 0" }}>
            No incidents found
          </h3>
          <p style={{ color: "#8a96b8", fontSize: "14px" }}>
            Click "Run Correlation" to analyze alerts
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((inc) => {
            const sevColor = getSeverityColor(inc.severity);
            return (
              <div
                key={inc.id}
                onClick={() => navigate(`/incidents/${inc.id}`)}
                style={{
                  background: "#0f1621",
                  border: "1px solid #1e293b",
                  borderLeft: `4px solid ${sevColor.border}`,
                  borderRadius: "8px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#141b28";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0f1621";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "16px",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      #{inc.id} — {inc.title}
                    </div>
                    <div style={{ color: "#8a96b8", fontSize: "13px" }}>
                      {inc.description}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: "8px", alignItems: "center" }}
                  >
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
                      {inc.severity}
                    </span>
                    <span
                      style={{
                        color: getStatusColor(inc.status),
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      ● {inc.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    fontSize: "12px",
                    color: "#8a96b8",
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid #1e293b",
                  }}
                >
                  {inc.rule_id && (
                    <span>
                      🔧 Rule:{" "}
                      <strong style={{ color: "#00bfff" }}>{inc.rule_id}</strong>
                    </span>
                  )}
                  {inc.alert_count !== undefined && (
                    <span>
                      🚨 Alerts:{" "}
                      <strong style={{ color: "#fff" }}>
                        {inc.alert_count}
                      </strong>
                    </span>
                  )}
                  {inc.mitre_techniques && inc.mitre_techniques.length > 0 && (
                    <span>
                      🎯 MITRE:{" "}
                      <strong style={{ color: "#fbbf24" }}>
                        {inc.mitre_techniques.join(", ")}
                      </strong>
                    </span>
                  )}
                  {inc.detected_at && (
                    <span>⏰ {formatTime(inc.detected_at)}</span>
                  )}
                  <span style={{ marginLeft: "auto", color: "#00bfff", fontWeight: 600 }}>
                    View Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Incidents;