import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { useTheme } from "../App";

interface Alert {
  id: number;
  timestamp?: string;
  src_ip?: string;
  dst_ip?: string;
  src_port?: number;
  dst_port?: number;
  signature?: string;
  severity?: string;
  mitre_technique?: string;
}

interface TimelineEntry {
  time: string;
  event: string;
  analyst: string;
}

interface EvidenceEntry {
  type: string;
  description: string;
  url?: string;
  filename?: string;
  size?: number;
  content_type?: string;
  added_at?: string;
}

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
  timeline?: TimelineEntry[];
  evidence?: EvidenceEntry[];
  detected_at?: string;
  alerts?: Alert[];
}

const IncidentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [evidenceType, setEvidenceType] = useState("url");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDesc, setUploadDesc] = useState("");

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/incidents/${id}`);
      setIncident(res.data.data || res.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchIncident();
  }, [id]);

  const updateIncident = async (updates: Partial<Incident>) => {
    setUpdating(true);
    try {
      await apiClient.put(`/incidents/${id}`, updates);
      await fetchIncident();
    } catch (err: any) {
      alert("❌ Update failed: " + (err?.message || "Unknown"));
    } finally {
      setUpdating(false);
    }
  };

  const generateIncidentReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await apiClient.post(`/incidents/${id}/report`);
      const filename = res.data.filename;

      const downloadUrl = `http://localhost:8000/api/v1/reports/download/${filename}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("✅ Incident report generated and downloaded!");
    } catch (err: any) {
      alert(
        "❌ Report generation failed: " +
          (err?.response?.data?.detail || err?.message || "Unknown")
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  const addTimelineEntry = async () => {
    if (!newNote.trim()) return;
    try {
      await apiClient.post(`/incidents/${id}/timeline`, {
        event: newNote,
        analyst: incident?.assignee || "Analyst",
      });
      setNewNote("");
      await fetchIncident();
    } catch (err: any) {
      alert("❌ Failed: " + (err?.message || "Unknown"));
    }
  };

  const addEvidence = async () => {
    if (!evidenceDesc.trim()) return;
    try {
      await apiClient.post(`/incidents/${id}/evidence`, {
        type: evidenceType,
        description: evidenceDesc,
        url: evidenceUrl || undefined,
      });
      setEvidenceDesc("");
      setEvidenceUrl("");
      await fetchIncident();
    } catch (err: any) {
      alert("❌ Failed: " + (err?.message || "Unknown"));
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      await apiClient.post(
        `/incidents/${id}/upload?description=${encodeURIComponent(
          uploadDesc || selectedFile.name
        )}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSelectedFile(null);
      setUploadDesc("");
      await fetchIncident();
      alert("✅ File uploaded successfully");
    } catch (err: any) {
      alert("❌ Upload failed: " + (err?.message || "Unknown"));
    } finally {
      setUploading(false);
    }
  };

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

  const formatTime = (ts?: string) => {
    if (!ts) return "N/A";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
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
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "16px",
    marginTop: 0,
  };

  const labelStyle: React.CSSProperties = {
    color: colors.textMuted,
    fontSize: "12px",
    marginBottom: "6px",
    display: "block",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: colors.bgInput,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "13px",
  };

  const buttonStyle: React.CSSProperties = {
    background: colors.accent,
    color: "#000",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "13px",
  };

  if (loading) {
    return (
      <div
        style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}
      >
        Loading incident details...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div style={{ padding: "40px", color: "#ef4444" }}>
        ⚠️ {error || "Incident not found"}
        <br />
        <button
          onClick={() => navigate("/incidents")}
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
          ← Back to Incidents
        </button>
      </div>
    );
  }

  const sevColor = getSeverityColor(incident.severity);

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/incidents")}
        style={{
          background: "transparent",
          color: colors.accent,
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          marginBottom: "12px",
          padding: 0,
        }}
      >
        ← Back to Incidents
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
        <div style={{ flex: 1 }}>
          <h1
            style={{ color: colors.textHeading, fontSize: "28px", margin: 0 }}
          >
            🔺 Incident #{incident.id}
          </h1>
          <p
            style={{
              color: colors.textMuted,
              margin: "8px 0 0 0",
              fontSize: "16px",
            }}
          >
            {incident.title}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={generateIncidentReport}
            disabled={generatingReport}
            style={{
              background: generatingReport ? "#475569" : "#22c55e",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: generatingReport ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {generatingReport ? "⏳ Generating..." : "📄 Generate Report"}
          </button>
          <span
            style={{
              background: sevColor.bg,
              color: sevColor.text,
              border: `1px solid ${sevColor.border}`,
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {incident.severity}
          </span>
        </div>
      </div>

      {/* Status & Triage */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>
          ⚙️ Status & Triage{" "}
          {updating && (
            <span style={{ color: colors.accent, fontSize: "12px" }}>
              ⏳ Saving...
            </span>
          )}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={incident.status}
              onChange={(e) => updateIncident({ status: e.target.value })}
              disabled={updating}
              style={inputStyle}
            >
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="false_positive">False Positive</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Triage Decision</label>
            <select
              value={incident.triage_decision || ""}
              onChange={(e) =>
                updateIncident({ triage_decision: e.target.value })
              }
              disabled={updating}
              style={inputStyle}
            >
              <option value="">Not decided</option>
              <option value="TP">True Positive</option>
              <option value="FP">False Positive</option>
              <option value="benign">Benign</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Assignee</label>
            <input
              type="text"
              placeholder="Analyst name"
              defaultValue={incident.assignee || ""}
              onBlur={(e) => {
                if (e.target.value !== incident.assignee) {
                  updateIncident({ assignee: e.target.value });
                }
              }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select
              value={incident.priority || "P3"}
              onChange={(e) => updateIncident({ priority: e.target.value })}
              disabled={updating}
              style={inputStyle}
            >
              <option value="P1">P1 - Critical</option>
              <option value="P2">P2 - High</option>
              <option value="P3">P3 - Medium</option>
              <option value="P4">P4 - Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Correlation Details */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>🔗 Correlation Details</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          <InfoBox label="Rule ID" value={incident.rule_id || "N/A"} colors={colors} />
          <InfoBox
            label="Rule Name"
            value={incident.rule_name || "N/A"}
            colors={colors}
          />
          <InfoBox
            label="Detected At"
            value={formatTime(incident.detected_at)}
            colors={colors}
          />
          <InfoBox
            label="MITRE Tactics"
            value={(incident.mitre_tactics || []).join(", ") || "N/A"}
            colors={colors}
          />
          <InfoBox
            label="MITRE Techniques"
            value={(incident.mitre_techniques || []).join(", ") || "N/A"}
            colors={colors}
          />
          <InfoBox
            label="Alert Count"
            value={String(incident.alerts?.length || 0)}
            colors={colors}
          />
        </div>
      </div>

      {/* Timeline */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>📅 Timeline</h3>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Add timeline note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTimelineEntry()}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={addTimelineEntry} style={buttonStyle}>
            + Add Note
          </button>
        </div>
        {incident.timeline && incident.timeline.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {incident.timeline.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px",
                  background: colors.bgInput,
                  borderRadius: "6px",
                  borderLeft: `3px solid ${colors.accent}`,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    color: colors.accent,
                    fontSize: "12px",
                    fontFamily: "monospace",
                    minWidth: "140px",
                  }}
                >
                  {formatTime(entry.time)}
                </div>
                <div style={{ flex: 1, color: colors.text, fontSize: "13px" }}>
                  {entry.event}
                </div>
                <div style={{ color: colors.textMuted, fontSize: "12px" }}>
                  👤 {entry.analyst}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: colors.textMuted, textAlign: "center" }}>
            No timeline entries yet
          </p>
        )}
      </div>

      {/* Evidence */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>📎 Evidence</h3>

        <div
          style={{
            marginBottom: "16px",
            padding: "16px",
            background: colors.bgInput,
            borderRadius: "8px",
            border: `1px dashed ${colors.border}`,
          }}
        >
          <h4
            style={{
              color: colors.accent,
              margin: "0 0 12px 0",
              fontSize: "14px",
            }}
          >
            📤 Upload File (Screenshot, PDF, Log)
          </h4>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept="image/*,.pdf,.txt,.log"
              style={{
                flex: 1,
                background: colors.bgCard,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                padding: "8px",
                borderRadius: "6px",
                fontSize: "13px",
                minWidth: "200px",
              }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              style={{ ...inputStyle, width: "250px" }}
            />
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploading}
              style={{
                ...buttonStyle,
                background:
                  !selectedFile || uploading ? "#475569" : colors.accent,
                cursor: !selectedFile || uploading ? "wait" : "pointer",
              }}
            >
              {uploading ? "⏳ Uploading..." : "📤 Upload"}
            </button>
          </div>
          {selectedFile && (
            <div
              style={{
                color: colors.textMuted,
                fontSize: "12px",
                marginTop: "8px",
              }}
            >
              Selected: <strong>{selectedFile.name}</strong> (
              {(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            style={{ ...inputStyle, width: "150px" }}
          >
            <option value="url">URL</option>
            <option value="note">Note</option>
          </select>
          <input
            type="text"
            placeholder="Description..."
            value={evidenceDesc}
            onChange={(e) => setEvidenceDesc(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            type="text"
            placeholder="URL (optional)"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={addEvidence} style={buttonStyle}>
            + Add
          </button>
        </div>

        {incident.evidence && incident.evidence.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {incident.evidence.map((ev, idx) => {
              const fullUrl = ev.url?.startsWith("http")
                ? ev.url
                : `http://localhost:8000${ev.url}`;
              return (
                <div
                  key={idx}
                  style={{
                    padding: "12px",
                    background: colors.bgInput,
                    borderRadius: "6px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>
                    {ev.type === "file" && ev.content_type?.startsWith("image/")
                      ? "📷"
                      : ev.type === "file"
                      ? "📁"
                      : ev.type === "url"
                      ? "🔗"
                      : "📝"}
                  </span>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ color: colors.text, fontSize: "13px" }}>
                      {ev.description}
                    </div>
                    {ev.url && (
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: colors.accent, fontSize: "12px" }}
                      >
                        {ev.filename || ev.url}
                      </a>
                    )}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: "11px" }}>
                    {ev.added_at ? formatTime(ev.added_at) : ""}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: colors.textMuted, textAlign: "center" }}>
            No evidence added yet
          </p>
        )}
      </div>

      {/* Related Alerts */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>
          🚨 Related Alerts ({incident.alerts?.length || 0})
        </h3>
        {incident.alerts && incident.alerts.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: colors.bgInput }}>
                  <th style={{ ...thStyle, color: colors.textMuted }}>Time</th>
                  <th style={{ ...thStyle, color: colors.textMuted }}>
                    Source
                  </th>
                  <th style={{ ...thStyle, color: colors.textMuted }}>Dest</th>
                  <th style={{ ...thStyle, color: colors.textMuted }}>
                    Signature
                  </th>
                  <th style={{ ...thStyle, color: colors.textMuted }}>
                    Severity
                  </th>
                  <th style={{ ...thStyle, color: colors.textMuted }}>MITRE</th>
                </tr>
              </thead>
              <tbody>
                {incident.alerts.map((alert) => {
                  const alertSev = getSeverityColor(alert.severity);
                  return (
                    <tr
                      key={alert.id}
                      style={{ borderTop: `1px solid ${colors.border}` }}
                    >
                      <td style={{ ...tdStyle, color: colors.text }}>
                        {formatTime(alert.timestamp)}
                      </td>
                      <td style={{ ...tdStyle, color: colors.text }}>
                        <span style={{ fontFamily: "monospace" }}>
                          {alert.src_ip || "N/A"}
                        </span>
                        {alert.src_port && (
                          <span
                            style={{
                              color: colors.textMuted,
                              fontSize: "11px",
                            }}
                          >
                            :{alert.src_port}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, color: colors.text }}>
                        <span style={{ fontFamily: "monospace" }}>
                          {alert.dst_ip || "N/A"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: colors.text }}>
                        {alert.signature || "Unknown"}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: alertSev.bg,
                            color: alertSev.text,
                            border: `1px solid ${alertSev.border}`,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {alert.severity?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: colors.text }}>
                        {alert.mitre_technique ? (
                          <span style={{ color: "#fbbf24" }}>
                            {alert.mitre_technique}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: colors.textMuted, textAlign: "center" }}>
            No related alerts
          </p>
        )}
      </div>
    </div>
  );
};

const InfoBox = ({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) => (
  <div
    style={{
      background: colors.bgInput,
      padding: "12px",
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
        fontWeight: 500,
      }}
    >
      {value}
    </div>
  </div>
);

export default IncidentDetails;