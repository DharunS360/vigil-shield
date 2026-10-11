import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";

interface Alert {
  id: number;
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
  risk_score?: number;
  risk_level?: string;
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
  triage_notes?: string;
  rule_id?: string;
  rule_name?: string;
  mitre_tactics?: string[];
  mitre_techniques?: string[];
  timeline?: TimelineEntry[];
  evidence?: EvidenceEntry[];
  playbook_ref?: string;
  detected_at?: string;
  resolved_at?: string;
  alerts?: Alert[];
}

const IncidentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
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
      const data = res.data;
      setIncident(data.data || data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load");
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

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#8a96b8" }}>
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
            background: "#00bfff",
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
          color: "#00bfff",
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
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 style={{ color: "#fff", fontSize: "28px", margin: 0 }}>
            🔺 Incident #{incident.id}
          </h1>
          <p style={{ color: "#8a96b8", margin: "8px 0 0 0", fontSize: "16px" }}>
            {incident.title}
          </p>
        </div>
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

      {/* Status & Triage */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>
          ⚙️ Status & Triage{" "}
          {updating && (
            <span style={{ color: "#00bfff", fontSize: "12px" }}>
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
              style={selectStyle}
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
              style={selectStyle}
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
              style={selectStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select
              value={incident.priority || "P3"}
              onChange={(e) => updateIncident({ priority: e.target.value })}
              disabled={updating}
              style={selectStyle}
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
          <InfoBox label="Rule ID" value={incident.rule_id || "N/A"} />
          <InfoBox label="Rule Name" value={incident.rule_name || "N/A"} />
          <InfoBox label="Detected At" value={formatTime(incident.detected_at)} />
          <InfoBox
            label="MITRE Tactics"
            value={(incident.mitre_tactics || []).join(", ") || "N/A"}
          />
          <InfoBox
            label="MITRE Techniques"
            value={(incident.mitre_techniques || []).join(", ") || "N/A"}
          />
          <InfoBox
            label="Alert Count"
            value={String(incident.alerts?.length || 0)}
          />
        </div>
      </div>

      {/* Timeline */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>📅 Timeline</h3>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Add timeline note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTimelineEntry()}
              style={{ ...selectStyle, flex: 1 }}
            />
            <button onClick={addTimelineEntry} style={buttonStyle}>
              + Add Note
            </button>
          </div>
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
                  background: "#1e293b",
                  borderRadius: "6px",
                  borderLeft: "3px solid #00bfff",
                }}
              >
                <div
                  style={{
                    color: "#00bfff",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    minWidth: "140px",
                  }}
                >
                  {formatTime(entry.time)}
                </div>
                <div style={{ flex: 1, color: "#fff", fontSize: "13px" }}>
                  {entry.event}
                </div>
                <div style={{ color: "#8a96b8", fontSize: "12px" }}>
                  👤 {entry.analyst}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#8a96b8", textAlign: "center" }}>
            No timeline entries yet
          </p>
        )}
      </div>

      {/* Evidence */}
      <div style={cardStyle}>
        <h3 style={sectionHeader}>📎 Evidence</h3>

        {/* File Upload */}
        <div
          style={{
            marginBottom: "16px",
            padding: "16px",
            background: "#1e293b",
            borderRadius: "8px",
            border: "1px dashed #334155",
          }}
        >
          <h4
            style={{ color: "#00bfff", margin: "0 0 12px 0", fontSize: "14px" }}
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
                background: "#0f1621",
                color: "#fff",
                border: "1px solid #334155",
                padding: "8px",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              style={{ ...selectStyle, width: "250px" }}
            />
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploading}
              style={{
                ...buttonStyle,
                background: !selectedFile || uploading ? "#475569" : "#00bfff",
                cursor: !selectedFile || uploading ? "wait" : "pointer",
              }}
            >
              {uploading ? "⏳ Uploading..." : "📤 Upload"}
            </button>
          </div>
          {selectedFile && (
            <div
              style={{ color: "#8a96b8", fontSize: "12px", marginTop: "8px" }}
            >
              Selected: <strong>{selectedFile.name}</strong> (
              {(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Add URL/Note */}
        <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            style={{ ...selectStyle, width: "150px" }}
          >
            <option value="url">URL</option>
            <option value="note">Note</option>
          </select>
          <input
            type="text"
            placeholder="Description..."
            value={evidenceDesc}
            onChange={(e) => setEvidenceDesc(e.target.value)}
            style={{ ...selectStyle, flex: 1 }}
          />
          <input
            type="text"
            placeholder="URL (optional)"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            style={{ ...selectStyle, flex: 1 }}
          />
          <button onClick={addEvidence} style={buttonStyle}>
            + Add
          </button>
        </div>

        {/* Evidence List */}
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
                    background: "#1e293b",
                    borderRadius: "6px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
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
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: "13px" }}>
                      {ev.description}
                    </div>
                    {ev.url && (
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#00bfff", fontSize: "12px" }}
                      >
                        {ev.filename || ev.url}
                      </a>
                    )}
                  </div>
                  <div style={{ color: "#8a96b8", fontSize: "11px" }}>
                    {ev.added_at ? formatTime(ev.added_at) : ""}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "#8a96b8", textAlign: "center" }}>
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
                <tr style={{ background: "#1e293b" }}>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Dest</th>
                  <th style={thStyle}>Signature</th>
                  <th style={thStyle}>Severity</th>
                  <th style={thStyle}>MITRE</th>
                </tr>
              </thead>
              <tbody>
                {incident.alerts.map((alert) => {
                  const alertSev = getSeverityColor(alert.severity);
                  return (
                    <tr
                      key={alert.id}
                      style={{ borderTop: "1px solid #1e293b" }}
                    >
                      <td style={tdStyle}>{formatTime(alert.timestamp)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: "monospace" }}>
                          {alert.src_ip || "N/A"}
                        </span>
                        {alert.src_port && (
                          <span style={{ color: "#8a96b8", fontSize: "11px" }}>
                            :{alert.src_port}
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: "monospace" }}>
                          {alert.dst_ip || "N/A"}
                        </span>
                        {alert.dst_port && (
                          <span style={{ color: "#8a96b8", fontSize: "11px" }}>
                            :{alert.dst_port}
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>{alert.signature || "Unknown"}</td>
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
                      <td style={tdStyle}>
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
          <p style={{ color: "#8a96b8", textAlign: "center" }}>
            No related alerts
          </p>
        )}
      </div>
    </div>
  );
};

const InfoBox = ({ label, value }: { label: string; value: string }) => (
  <div style={{ background: "#1e293b", padding: "12px", borderRadius: "6px" }}>
    <div style={{ color: "#8a96b8", fontSize: "11px", marginBottom: "4px" }}>
      {label}
    </div>
    <div style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>{value}</div>
  </div>
);

const cardStyle: React.CSSProperties = {
  background: "#0f1621",
  border: "1px solid #1e293b",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "16px",
};

const sectionHeader: React.CSSProperties = {
  color: "#00bfff",
  fontSize: "16px",
  fontWeight: 600,
  marginBottom: "16px",
  marginTop: 0,
};

const labelStyle: React.CSSProperties = {
  color: "#8a96b8",
  fontSize: "12px",
  marginBottom: "6px",
  display: "block",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "#1e293b",
  color: "#fff",
  border: "1px solid #334155",
  padding: "8px 12px",
  borderRadius: "6px",
  fontSize: "13px",
};

const buttonStyle: React.CSSProperties = {
  background: "#00bfff",
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
  color: "#8a96b8",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: "13px",
  color: "#fff",
};

export default IncidentDetails;