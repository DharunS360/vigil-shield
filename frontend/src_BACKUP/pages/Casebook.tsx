import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listCases,
  getCasebookStats,
  CasebookCase,
  CasebookStats,
} from "../api/casebook";
import { useTheme } from "../App";

const Casebook = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [cases, setCases] = useState<CasebookCase[]>([]);
  const [stats, setStats] = useState<CasebookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      try {
        const [casesRes, statsRes] = await Promise.all([
          listCases(),
          getCasebookStats(),
        ]);
        setCases(casesRes.cases);
        setStats(statsRes);
      } catch (err) {
        console.error("Failed to load casebook:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = cases.filter((c) => {
    if (
      search &&
      !c.title.toLowerCase().includes(search.toLowerCase()) &&
      !c.mitre.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (severityFilter !== "all" && c.severity !== severityFilter) return false;
    return true;
  });

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Authentication":
        return "🔐";
      case "Malware":
        return "🦠";
      case "Credential Access":
        return "🔑";
      case "Lateral Movement":
        return "↔️";
      case "Impact":
        return "💥";
      default:
        return "📁";
    }
  };

  const inputStyle: React.CSSProperties = {
    background: colors.bgInput,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    padding: "10px 16px",
    borderRadius: "6px",
    fontSize: "14px",
  };

  if (loading) {
    return (
      <div
        style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}
      >
        Loading casebook...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: colors.textHeading, fontSize: "28px", margin: 0 }}>
          📚 SOC Casebook
        </h1>
        <p
          style={{
            color: colors.textMuted,
            margin: "4px 0 0 0",
            fontSize: "14px",
          }}
        >
          50 real SOC alert triage cases documented
        </p>
      </div>

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <StatCard
            label="Total Cases"
            value={stats.total}
            color={colors.accent}
            icon="📚"
            colors={colors}
          />
          <StatCard
            label="Categories"
            value={Object.keys(stats.by_category).length}
            color="#7c3aed"
            icon="📂"
            colors={colors}
          />
          <StatCard
            label="Critical"
            value={stats.by_severity.critical || 0}
            color="#ef4444"
            icon="🔴"
            colors={colors}
          />
          <StatCard
            label="High"
            value={stats.by_severity.high || 0}
            color="#f97316"
            icon="🟠"
            colors={colors}
          />
        </div>
      )}

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
          placeholder="🔍 Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: "300px" }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All Categories</option>
          <option value="Authentication">🔐 Authentication</option>
          <option value="Malware">🦠 Malware</option>
          <option value="Credential Access">🔑 Credential Access</option>
          <option value="Lateral Movement">↔️ Lateral Movement</option>
          <option value="Impact">💥 Impact</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div
        style={{
          color: colors.textMuted,
          fontSize: "13px",
          marginBottom: "16px",
        }}
      >
        Showing {filtered.length} of {cases.length} cases
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {filtered.map((c) => {
          const sevColor = getSeverityColor(c.severity);
          return (
            <div
              key={c.id}
              onClick={() => navigate(`/casebook/${c.slug}`)}
              style={{
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid ${sevColor.border}`,
                borderRadius: "8px",
                padding: "16px",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 4px 20px ${sevColor.border}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    color: colors.accent,
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  VS-CB-{c.id}
                </div>
                <span
                  style={{
                    background: sevColor.bg,
                    color: sevColor.text,
                    border: `1px solid ${sevColor.border}`,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {c.severity.toUpperCase()}
                </span>
              </div>
              <div
                style={{
                  color: colors.text,
                  fontSize: "15px",
                  fontWeight: 600,
                  marginBottom: "10px",
                  lineHeight: 1.4,
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  fontSize: "11px",
                  paddingTop: "10px",
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ color: colors.textMuted }}>
                  {getCategoryIcon(c.category)} {c.category}
                </span>
                {c.mitre && (
                  <span style={{ color: "#fbbf24", fontFamily: "monospace" }}>
                    🎯 {c.mitre}
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
      }}
    >
      {icon} {label}
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

export default Casebook;