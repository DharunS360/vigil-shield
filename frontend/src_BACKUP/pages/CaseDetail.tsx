import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCase } from "../api/casebook";
import { useTheme } from "../App";

const CaseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        if (!slug) return;
        const res = await getCase(slug);
        setContent(res.content);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || "Failed");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div
        style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}
      >
        Loading case...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", color: "#ef4444" }}>
        ⚠️ {error}
        <br />
        <button
          onClick={() => navigate("/casebook")}
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
          ← Back to Casebook
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/casebook")}
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
        ← Back to Casebook
      </button>

      <div
        style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: "8px",
          padding: "32px",
          color: colors.text,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          lineHeight: "1.7",
          whiteSpace: "pre-wrap",
          fontSize: "14px",
          wordBreak: "break-word",
          transition: "all 0.3s ease",
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default CaseDetail;