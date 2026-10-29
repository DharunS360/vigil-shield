import React, { useState } from "react";
import { enrichIP, EnrichmentResult } from "../api/enrichment";
import { useTheme } from "../App";

interface IOCPanelProps {
  ip: string;
}

const riskColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  low: { bg: "#064e3b", border: "#22c55e", text: "#22c55e" },
  medium: { bg: "#78350f", border: "#fbbf24", text: "#fbbf24" },
  high: { bg: "#7c2d12", border: "#f97316", text: "#f97316" },
  critical: { bg: "#7f1d1d", border: "#ef4444", text: "#ef4444" },
};

const IOCPanel: React.FC<IOCPanelProps> = ({ ip }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEnrich = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await enrichIP(ip);
      setResult(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || err?.message || "Enrichment failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const riskStyle = result
    ? riskColors[result.risk_level] || riskColors.low
    : riskColors.low;

  return (
    <div style={{ marginTop: "16px" }}>
      <button
        onClick={handleEnrich}
        disabled={loading}
        style={{
          background: loading ? "#475569" : colors.accent,
          color: "#000",
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          cursor: loading ? "wait" : "pointer",
          fontWeight: 600,
          fontSize: "14px",
        }}
      >
        {loading ? "⏳ Enriching..." : "🔍 Enrich IOC"}
      </button>

      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#7f1d1d",
            color: "#fecaca",
            borderRadius: "6px",
            fontSize: "13px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "16px",
            background: colors.bgCard,
            border: `1px solid ${riskStyle.border}40`,
            borderLeft: `4px solid ${riskStyle.border}`,
            borderRadius: "8px",
            padding: "16px",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div
              style={{
                color: colors.text,
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              🌐 IOC Enrichment
            </div>
            <div
              style={{
                background: riskStyle.bg,
                color: riskStyle.text,
                padding: "4px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
                border: `1px solid ${riskStyle.border}`,
              }}
            >
              {result.risk_level.toUpperCase()} • {result.risk_score}
            </div>
          </div>

          <div
            style={{
              color: colors.textMuted,
              fontSize: "13px",
              marginBottom: "16px",
              padding: "8px",
              background: colors.bgInput,
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          >
            <strong style={{ color: colors.accent }}>IP:</strong>{" "}
            {result.value}
          </div>

          {result.virustotal && (
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  color: colors.accent,
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                🦠 VirusTotal
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "8px",
                }}
              >
                <StatBox
                  label="Malicious"
                  value={result.virustotal.malicious ?? 0}
                  color="#ef4444"
                  colors={colors}
                />
                <StatBox
                  label="Suspicious"
                  value={result.virustotal.suspicious ?? 0}
                  color="#f59e0b"
                  colors={colors}
                />
                <StatBox
                  label="Harmless"
                  value={result.virustotal.harmless ?? 0}
                  color="#22c55e"
                  colors={colors}
                />
                <StatBox
                  label="Total Engines"
                  value={result.virustotal.total_engines ?? 0}
                  color={colors.textMuted}
                  colors={colors}
                />
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: colors.textMuted,
                }}
              >
                <strong>Country:</strong> {result.virustotal.country || "N/A"}{" "}
                • <strong>AS Owner:</strong>{" "}
                {result.virustotal.as_owner || "N/A"} •{" "}
                <strong>Reputation:</strong>{" "}
                {result.virustotal.reputation ?? "N/A"}
              </div>
            </div>
          )}

          {result.abuseipdb && (
            <div>
              <div
                style={{
                  color: colors.accent,
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                🚨 AbuseIPDB
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "8px",
                }}
              >
                <StatBox
                  label="Confidence"
                  value={`${result.abuseipdb.abuse_confidence_score ?? 0}%`}
                  color={
                    (result.abuseipdb.abuse_confidence_score ?? 0) > 50
                      ? "#ef4444"
                      : "#22c55e"
                  }
                  colors={colors}
                />
                <StatBox
                  label="Reports"
                  value={result.abuseipdb.total_reports ?? 0}
                  color="#f59e0b"
                  colors={colors}
                />
                <StatBox
                  label="Whitelisted"
                  value={result.abuseipdb.is_whitelisted ? "Yes" : "No"}
                  color={
                    result.abuseipdb.is_whitelisted ? "#22c55e" : "#ef4444"
                  }
                  colors={colors}
                />
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: colors.textMuted,
                }}
              >
                <strong>ISP:</strong> {result.abuseipdb.isp || "N/A"} •{" "}
                <strong>Domain:</strong>{" "}
                {result.abuseipdb.domain || "N/A"} •{" "}
                <strong>Usage:</strong>{" "}
                {result.abuseipdb.usage_type || "N/A"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatBox = ({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: number | string;
  color: string;
  colors: any;
}) => (
  <div
    style={{
      background: colors.bgInput,
      padding: "8px",
      borderRadius: "4px",
      textAlign: "center",
    }}
  >
    <div
      style={{
        color: colors.textMuted,
        fontSize: "10px",
        marginBottom: "4px",
      }}
    >
      {label}
    </div>
    <div style={{ color, fontSize: "18px", fontWeight: "bold" }}>{value}</div>
  </div>
);

export default IOCPanel;