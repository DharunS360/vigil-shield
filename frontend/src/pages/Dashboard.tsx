import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { apiClient } from "../api/client";
import { useWebSocket } from "../hooks/useWebSocket";
import { useTheme } from "../App";
import MITREMatrix from "../components/dashboard/MITREMatrix";
import ReportButton from "../components/ReportButton";

interface Alert {
  id: string | number;
  title?: string;
  severity: string;
  src_ip?: string;
  dst_ip?: string;
  signature?: string;
  mitre_technique?: string;
  risk_score?: number;
  risk_level?: string;
  enriched_at?: string;
}

const Dashboard = () => {
  const { colors, theme } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { messages, isConnected } = useWebSocket("ws://localhost:8000/ws");

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/alerts");
      const data = response.data;
      const alertsList = Array.isArray(data) ? data : data.data || [];
      setAlerts(alertsList);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (messages.length > 0) fetchAlerts();
  }, [messages]);

  const handleBulkEnrich = async () => {
    setBulkLoading(true);
    try {
      const res = await apiClient.post("/enrichment/bulk");
      alert(
        `✅ Enriched: ${res.data.enriched} | Failed: ${res.data.failed} | Total: ${res.data.total}`
      );
      fetchAlerts();
    } catch (err: any) {
      alert("❌ Bulk enrichment failed: " + (err?.message || "Unknown"));
    } finally {
      setBulkLoading(false);
    }
  };

  const totalAlerts = alerts.length;
  const criticalCount = alerts.filter(
    (a) => a.severity?.toLowerCase() === "critical"
  ).length;
  const highCount = alerts.filter(
    (a) => a.severity?.toLowerCase() === "high"
  ).length;
  const mediumCount = alerts.filter(
    (a) => a.severity?.toLowerCase() === "medium"
  ).length;
  const lowCount = alerts.filter(
    (a) => a.severity?.toLowerCase() === "low"
  ).length;
  const enrichedCount = alerts.filter((a) => a.enriched_at).length;
  const highRiskCount = alerts.filter(
    (a) => a.risk_level === "critical" || a.risk_level === "high"
  ).length;

  const severityData = [
    { name: "Critical", value: criticalCount, color: "#ef4444" },
    { name: "High", value: highCount, color: "#f97316" },
    { name: "Medium", value: mediumCount, color: "#fbbf24" },
    { name: "Low", value: lowCount, color: "#22c55e" },
  ].filter((d) => d.value > 0);

  const attackTypeCounts: Record<string, number> = {};
  alerts.forEach((a) => {
    const type = a.signature || a.title || "Unknown";
    attackTypeCounts[type] = (attackTypeCounts[type] || 0) + 1;
  });
  const attackTypeData = Object.entries(attackTypeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const cardStyle: React.CSSProperties = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    padding: "20px",
    transition: "all 0.3s ease",
  };

  const tooltipStyle = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: "6px",
    color: colors.text,
  };

  if (loading) {
    return (
      <div
        style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}
      >
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              color: colors.textHeading,
              fontSize: "28px",
              margin: 0,
            }}
          >
            📊 Dashboard
          </h1>
          <p
            style={{
              color: colors.textMuted,
              margin: "4px 0 0 0",
              fontSize: "14px",
            }}
          >
            Real-time security monitoring
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={handleBulkEnrich}
            disabled={bulkLoading}
            style={{
              background: bulkLoading ? "#475569" : "#7c3aed",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: bulkLoading ? "wait" : "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {bulkLoading ? "⏳ Enriching..." : "⚡ Enrich All"}
          </button>
          <button
            onClick={fetchAlerts}
            style={{
              background: colors.bgInput,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            🔄 Refresh
          </button>
          <ReportButton alertData={alerts[0] || { id: "dashboard" }} />
        </div>
      </div>

      <div
        style={{
          marginBottom: "16px",
          fontSize: "13px",
          color: isConnected ? "#22c55e" : "#ef4444",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isConnected ? "#22c55e" : "#ef4444",
            display: "inline-block",
          }}
        />
        WebSocket: {isConnected ? "Connected" : "Disconnected"}
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

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <StatCard label="Total Alerts" value={totalAlerts} color="#00bfff" icon="📊" colors={colors} />
        <StatCard label="Critical" value={criticalCount} color="#ef4444" icon="🔴" colors={colors} />
        <StatCard label="High" value={highCount} color="#f97316" icon="🟠" colors={colors} />
        <StatCard label="Medium" value={mediumCount} color="#fbbf24" icon="🟡" colors={colors} />
        <StatCard label="Low" value={lowCount} color="#22c55e" icon="🟢" colors={colors} />
        <StatCard label="Enriched" value={enrichedCount} color="#7c3aed" icon="⚡" colors={colors} />
        <StatCard label="High Risk" value={highRiskCount} color="#dc2626" icon="⚠️" colors={colors} />
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={cardStyle}>
          <h4
            style={{
              color: colors.textMuted,
              marginBottom: "16px",
              marginTop: 0,
            }}
          >
            🎯 Severity Distribution
          </h4>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: colors.textMuted, textAlign: "center" }}>
              No data
            </p>
          )}
        </div>

        <div style={cardStyle}>
          <h4
            style={{
              color: colors.textMuted,
              marginBottom: "16px",
              marginTop: 0,
            }}
          >
            ⚔️ Top Attack Types
          </h4>
          {attackTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attackTypeData}>
                <XAxis dataKey="name" stroke={colors.textMuted} fontSize={11} />
                <YAxis stroke={colors.textMuted} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={colors.accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: colors.textMuted, textAlign: "center" }}>
              No data
            </p>
          )}
        </div>
      </div>

      {/* MITRE Matrix */}
      <div style={cardStyle}>
        <h4
          style={{
            color: colors.textMuted,
            marginBottom: "16px",
            marginTop: 0,
          }}
        >
          🎯 MITRE ATT&CK Coverage
        </h4>
        <MITREMatrix alerts={alerts} />
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  color,
  icon,
  colors,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
  colors: any;
}) => (
  <div
    style={{
      background: colors.bgCard,
      border: `1px solid ${color}40`,
      borderLeft: `4px solid ${color}`,
      borderRadius: "8px",
      padding: "20px",
      transition: "all 0.3s ease",
    }}
  >
    <div
      style={{
        color: colors.textMuted,
        fontSize: "13px",
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span>{icon}</span> {label}
    </div>
    <div
      style={{
        color: colors.text,
        fontSize: "32px",
        fontWeight: "bold",
      }}
    >
      {value}
    </div>
  </div>
);

export default Dashboard;