import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { useTheme } from "../App";

interface Report {
  filename: string;
  report_id: string;
  size_bytes: number;
  created_at: number;
  download_url: string;
}

const Reports = () => {
  const { colors } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await apiClient.get("/reports/list");
        setReports(res.data.reports || []);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatTime = (ts: number) => {
    try {
      return new Date(ts * 1000).toLocaleString();
    } catch {
      return "N/A";
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

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: colors.textHeading, fontSize: "28px", margin: 0 }}>
          📄 Reports
        </h1>
        <p
          style={{
            color: colors.textMuted,
            margin: "4px 0 0 0",
            fontSize: "14px",
          }}
        >
          Generated PDF incident reports
        </p>
      </div>

      <div style={cardStyle}>
        <h3
          style={{
            color: colors.accent,
            fontSize: "16px",
            fontWeight: 600,
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          📚 Generated Reports ({reports.length})
        </h3>

        {loading ? (
          <p style={{ color: colors.textMuted, textAlign: "center" }}>
            Loading reports...
          </p>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
            <h3 style={{ color: colors.text, margin: "0 0 8px 0" }}>
              No reports yet
            </h3>
            <p style={{ color: colors.textMuted, fontSize: "14px" }}>
              Generate a report from any alert or incident
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reports.map((r) => (
              <div
                key={r.filename}
                style={{
                  padding: "16px",
                  background: colors.bgInput,
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div
                    style={{
                      color: colors.text,
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                  >
                    📄 {r.report_id}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                    {formatTime(r.created_at)} • {formatSize(r.size_bytes)}
                  </div>
                </div>
                <a
                  href={`http://localhost:8000${r.download_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: colors.accent,
                    color: "#000",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  ⬇️ Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;