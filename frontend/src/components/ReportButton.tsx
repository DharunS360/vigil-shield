import { useState } from "react";
import { generateReport, getDownloadUrl } from "../api/reports";
import { useTheme } from "../App";

interface ReportButtonProps {
  alertData: Record<string, any>;
}

export default function ReportButton({ alertData }: ReportButtonProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await generateReport({
        alert_id: String(alertData.id || "unknown"),
        alert_data: alertData,
        send_email: sendEmail && !!email,
        to_email: email || undefined,
      });

      setResult(res);
      setStatus("✓ Report generated successfully");

      const downloadUrl = getDownloadUrl(res.filename);
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = res.filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 500);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail || err?.message || "Unknown error";
      setStatus("✗ Error: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStatus("");
    setResult(null);
    setEmail("");
    setSendEmail(false);
  };

  const dialogStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: open ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const dialogContentStyle: React.CSSProperties = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "500px",
    width: "90%",
    color: colors.text,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: colors.bgInput,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    padding: "10px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    marginTop: "8px",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: colors.accent,
          color: "#000",
          fontWeight: 600,
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        📄 Generate Report
      </button>

      {open && (
        <div style={dialogStyle} onClick={handleClose}>
          <div style={dialogContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3
              style={{
                color: colors.textHeading,
                margin: "0 0 8px 0",
                fontSize: "18px",
              }}
            >
              Generate Incident Report
            </h3>
            <p
              style={{
                color: colors.textMuted,
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              Create a professional PDF report for alert{" "}
              <strong style={{ color: colors.accent }}>
                {alertData.id || "N/A"}
              </strong>
            </p>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: colors.text,
                fontSize: "14px",
                marginBottom: "12px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              Send via email
            </label>

            {sendEmail && (
              <input
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            )}

            {status && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px",
                  borderRadius: "6px",
                  background: status.startsWith("✓")
                    ? "rgba(0,168,84,0.1)"
                    : "rgba(255,59,59,0.1)",
                  color: status.startsWith("✓") ? "#22c55e" : "#ef4444",
                  border: `1px solid ${
                    status.startsWith("✓") ? "#22c55e" : "#ef4444"
                  }40`,
                  fontSize: "13px",
                  fontFamily: "monospace",
                }}
              >
                {status}
              </div>
            )}

            {result && (
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = getDownloadUrl(result.filename);
                  link.download = result.filename;
                  link.style.display = "none";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{
                  marginTop: "12px",
                  background: "transparent",
                  color: colors.accent,
                  border: `1px solid ${colors.accent}`,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                📄 Download PDF Again
              </button>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  background: "transparent",
                  color: colors.textMuted,
                  border: `1px solid ${colors.border}`,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Close
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !!result}
                style={{
                  background: loading || result ? "#475569" : colors.accent,
                  color: "#000",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: loading || result ? "wait" : "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                {loading
                  ? "⏳ Generating..."
                  : result
                  ? "✓ Generated"
                  : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}