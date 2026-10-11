/**
 * Report Button — Generate + auto-download PDF report.
 * MUI v9 compatible.
 */
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";
import { Description as DescriptionIcon } from "@mui/icons-material";
import { generateReport, getDownloadUrl } from "../api/reports";

interface ReportButtonProps {
  alertData: Record<string, any>;
}

export default function ReportButton({ alertData }: ReportButtonProps) {
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

      // FORCE PDF DOWNLOAD
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

  return (
    <>
      <Button
        variant="contained"
        startIcon={<DescriptionIcon />}
        onClick={() => setOpen(true)}
        sx={{
          bgcolor: "#00bfff",
          color: "#000",
          fontWeight: 600,
          "&:hover": { bgcolor: "#00d4ff" },
        }}
      >
        Generate Report
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { bgcolor: "#0f1621", border: "1px solid #00bfff40" },
          },
        }}
      >
        <DialogTitle sx={{ color: "#fff" }}>
          Generate Incident Report
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#999", mb: 3 }}>
            Create a professional PDF report for alert{" "}
            <strong style={{ color: "#00bfff" }}>
              {alertData.id || "N/A"}
            </strong>
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                sx={{ color: "#00bfff", "&.Mui-checked": { color: "#00bfff" } }}
              />
            }
            label={
              <Typography sx={{ color: "#ccc", fontSize: 14 }}>
                Send via email
              </Typography>
            }
          />

          {sendEmail && (
            <TextField
              fullWidth
              type="email"
              placeholder="recipient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                mt: 2,
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": { borderColor: "#00bfff30" },
                  "&:hover fieldset": { borderColor: "#00bfff" },
                  "&.Mui-focused fieldset": { borderColor: "#00bfff" },
                },
              }}
            />
          )}

          {status && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: status.startsWith("✓")
                  ? "rgba(0,168,84,0.1)"
                  : "rgba(255,59,59,0.1)",
                border: `1px solid ${
                  status.startsWith("✓") ? "#00a854" : "#ff3b3b"
                }40`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: status.startsWith("✓") ? "#00a854" : "#ff3b3b",
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              >
                {status}
              </Typography>
            </Box>
          )}

          {result && (
            <Button
              variant="outlined"
              onClick={() => {
                const link = document.createElement("a");
                link.href = getDownloadUrl(result.filename);
                link.download = result.filename;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              sx={{
                mt: 2,
                color: "#00bfff",
                borderColor: "#00bfff",
                "&:hover": {
                  borderColor: "#00d4ff",
                  bgcolor: "rgba(0,191,255,0.1)",
                },
              }}
            >
              📄 Download PDF Again
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: "#999" }}>
            Close
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || !!result}
            variant="contained"
            sx={{
              bgcolor: "#00bfff",
              color: "#000",
              fontWeight: 600,
              "&:hover": { bgcolor: "#00d4ff" },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1, color: "#000" }} />
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}