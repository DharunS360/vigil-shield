import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import IOCPanel from "../components/IOCPanel";
import { useTheme } from "../App";

interface Alert {
  id: string | number;
  timestamp?: string;
  src_ip?: string;
  dst_ip?: string;
  src_port?: number;
  dst_port?: number;
  protocol?: string;
  signature?: string;
  severity?: string;
  category?: string;
  mitre_technique?: string;
  source_type?: string;
  risk_score?: number;
  status?: string;
  title?: string;
}

const AlertDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/alerts/${id}`);
        const data = response.data;
        setAlert(data.data || data);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail || err?.message || "Failed to load alert"
        );
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAlert();
  }, [id]);

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
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
    marginBottom: "16px",
    fontSize: "16px",
    fontWeight: 600,
    marginTop: 0,
  };

  const inputStyle: React.CSSProperties = {
    background: colors.bgInput,
    padding: "10px 12px",
    borderRadius: "6px",
  };

  if (loading) {
    return (
      <div
        style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}
      >
        Loading alert details...
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div style={{ padding: "40px", color: "#ef4444" }}>
        ⚠️ {error || "Alert not found"}
        <br />
        <button
          onClick={() => navigate("/alerts")}
          style={{
            marginTop: "16px",
            background: colors.accent,
            color: "#000",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ← Back to Alerts
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/alerts")}
        style={{
          background: "transparent",
          color: colors.accent,
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          marginBottom: "8px",
          padding: 0,
        }}
      >
        ← Back to Alerts
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{ color: colors.textHeading, fontSize: "24px", margin: 0 }}
          >
            Alert #{alert.id}
          </h1>
          <p
            style={{
              color: colors.textMuted,
              margin: "4px 0 0 0",
              fontSize: "14px",
            }}
          >
            {alert.signature || alert.title || "Unknown Alert"}
          </p>
        </div>
        <div
          style={{
            background: `${getSeverityColor(alert.severity)}20`,
            color: getSeverityColor(alert.severity),
            border: `1px solid ${getSeverityColor(alert.severity)}`,
            padding: "8px 16px",
            borderRadius: "6px",
            fontWeight: 700,
            fontSize: "14px",
            textTransform: "uppercase",
          }}
        >
          {alert.severity || "Unknown"}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={sectionHeader}>📋 Alert Information</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <InfoRow label="Timestamp" value={alert.timestamp || "N/A"} colors={colors} />
          <InfoRow label="Source IP" value={alert.src_ip || "N/A"} mono colors={colors} />
          <InfoRow
            label="Source Port"
            value={alert.src_port?.toString() || "N/A"}
            colors={colors}
          />
          <InfoRow
            label="Destination IP"
            value={alert.dst_ip || "N/A"}
            mono
            colors={colors}
          />
          <InfoRow
            label="Destination Port"
            value={alert.dst_port?.toString() || "N/A"}
            colors={colors}
          />
          <InfoRow label="Protocol" value={alert.protocol || "N/A"} colors={colors} />
          <InfoRow label="Category" value={alert.category || "N/A"} colors={colors} />
          <InfoRow
            label="Source Type"
            value={alert.source_type || "N/A"}
            colors={colors}
          />
          <InfoRow
            label="MITRE Technique"
            value={alert.mitre_technique || "N/A"}
            mono
            colors={colors}
          />
          <InfoRow label="Status" value={alert.status || "N/A"} colors={colors} />
        </div>
      </div>

      {alert.src_ip && (
        <div style={cardStyle}>
          <h3 style={{ ...sectionHeader, marginBottom: "8px" }}>
            🔍 Threat Intelligence Enrichment
          </h3>
          <p
            style={{
              color: colors.textMuted,
              fontSize: "13px",
              marginBottom: 0,
            }}
          >
            Get real-time threat intelligence for source IP:{" "}
            <strong style={{ color: colors.accent }}>{alert.src_ip}</strong>
          </p>
          <IOCPanel ip={alert.src_ip} />
        </div>
      )}

      {alert.dst_ip && alert.dst_ip !== "0.0.0.0" && alert.dst_ip !== alert.src_ip && (
        <div style={cardStyle}>
          <h3 style={{ ...sectionHeader, marginBottom: "8px" }}>
            🔍 Destination IP Enrichment
          </h3>
          <p
            style={{
              color: colors.textMuted,
              fontSize: "13px",
              marginBottom: 0,
            }}
          >
            Get threat intelligence for destination IP:{" "}
            <strong style={{ color: colors.accent }}>{alert.dst_ip}</strong>
          </p>
          <IOCPanel ip={alert.dst_ip} />
        </div>
      )}
    </div>
  );
};

const InfoRow = ({
  label,
  value,
  mono,
  colors,
}: {
  label: string;
  value: string;
  mono?: boolean;
  colors: any;
}) => (
  <div
    style={{
      background: colors.bgInput,
      padding: "10px 12px",
      borderRadius: "6px",
    }}
  >
    <div
      style={{
        color: colors.textMuted,
        fontSize: "11px",
        marginBottom: "4px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        color: colors.text,
        fontSize: "13px",
        fontFamily: mono ? "monospace" : "inherit",
        wordBreak: "break-all",
      }}
    >
      {value}
    </div>
  </div>
);

export default AlertDetails;