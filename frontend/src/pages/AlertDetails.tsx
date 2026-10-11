import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import IOCPanel from "../components/IOCPanel";

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
  description?: string;
}

const AlertDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        console.error("Failed to fetch alert:", err);
        setError(err?.response?.data?.detail || err?.message || "Failed to load alert");
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
        return "#8a96b8";
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#8a96b8" }}>
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
            background: "#00bfff",
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
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <button
            onClick={() => navigate("/alerts")}
            style={{
              background: "transparent",
              color: "#00bfff",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              marginBottom: "8px",
              padding: 0,
            }}
          >
            ← Back to Alerts
          </button>
          <h1 style={{ color: "#fff", fontSize: "24px", margin: 0 }}>
            Alert #{alert.id}
          </h1>
          <p style={{ color: "#8a96b8", margin: "4px 0 0 0", fontSize: "14px" }}>
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

      {/* Alert Info Card */}
      <div style={cardStyle}>
        <h3 style={{ color: "#00bfff", marginBottom: "16px", fontSize: "16px" }}>
          📋 Alert Information
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          <InfoRow label="Timestamp" value={alert.timestamp || "N/A"} />
          <InfoRow label="Source IP" value={alert.src_ip || "N/A"} mono />
          <InfoRow label="Source Port" value={alert.src_port?.toString() || "N/A"} />
          <InfoRow label="Destination IP" value={alert.dst_ip || "N/A"} mono />
          <InfoRow label="Destination Port" value={alert.dst_port?.toString() || "N/A"} />
          <InfoRow label="Protocol" value={alert.protocol || "N/A"} />
          <InfoRow label="Category" value={alert.category || "N/A"} />
          <InfoRow label="Source Type" value={alert.source_type || "N/A"} />
          <InfoRow label="MITRE Technique" value={alert.mitre_technique || "N/A"} mono />
          <InfoRow label="Status" value={alert.status || "N/A"} />
        </div>
      </div>

      {/* IOC Enrichment Card */}
      {alert.src_ip && (
        <div style={cardStyle}>
          <h3 style={{ color: "#00bfff", marginBottom: "8px", fontSize: "16px" }}>
            🔍 Threat Intelligence Enrichment
          </h3>
          <p style={{ color: "#8a96b8", fontSize: "13px", marginBottom: "0" }}>
            Get real-time threat intelligence for source IP: <strong style={{ color: "#00bfff" }}>{alert.src_ip}</strong>
          </p>
          <IOCPanel ip={alert.src_ip} />
        </div>
      )}

      {/* Destination IP Enrichment */}
      {alert.dst_ip && alert.dst_ip !== "0.0.0.0" && alert.dst_ip !== alert.src_ip && (
        <div style={cardStyle}>
          <h3 style={{ color: "#00bfff", marginBottom: "8px", fontSize: "16px" }}>
            🔍 Destination IP Enrichment
          </h3>
          <p style={{ color: "#8a96b8", fontSize: "13px", marginBottom: "0" }}>
            Get threat intelligence for destination IP: <strong style={{ color: "#00bfff" }}>{alert.dst_ip}</strong>
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
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div
    style={{
      background: "#1e293b",
      padding: "10px 12px",
      borderRadius: "6px",
    }}
  >
    <div style={{ color: "#8a96b8", fontSize: "11px", marginBottom: "4px" }}>
      {label}
    </div>
    <div
      style={{
        color: "#fff",
        fontSize: "13px",
        fontFamily: mono ? "monospace" : "inherit",
        wordBreak: "break-all",
      }}
    >
      {value}
    </div>
  </div>
);

const cardStyle: React.CSSProperties = {
  background: "#0f1621",
  border: "1px solid #1e293b",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "16px",
};

export default AlertDetails;