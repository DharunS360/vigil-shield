/**
 * Reports Page — View, download, and email generated reports.
 * MUI v9 compatible.
 */
import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Alert,
  InputAdornment,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import {
  listReports,
  getDownloadUrl,
  emailReport,
  Report,
} from "../api/reports";

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listReports();
      setReports(data.reports);
    } catch (err: any) {
      setError(err?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDownload = (report: Report) => {
    window.open(getDownloadUrl(report.filename), "_blank");
  };

  const handleOpenEmail = (report: Report) => {
    setSelectedReport(report);
    setRecipientEmail("");
    setEmailStatus("");
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedReport || !recipientEmail) return;
    setEmailSending(true);
    setEmailStatus("");
    try {
      const result = await emailReport(selectedReport.filename, recipientEmail);
      if (result.status === "sent") {
        setEmailStatus("✓ Email sent successfully");
        setTimeout(() => setEmailDialogOpen(false), 1500);
      } else {
        setEmailStatus("✗ Failed to send email (SMTP not configured)");
      }
    } catch (err: any) {
      setEmailStatus("✗ Error: " + (err?.message || "Unknown"));
    } finally {
      setEmailSending(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleString();
  };

  const filteredReports = reports.filter((r) =>
    r.report_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <DescriptionIcon sx={{ fontSize: 40, color: "#00bfff", mr: 2 }} />
          <Box>
            <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700 }}>
              Incident Reports
            </Typography>
            <Typography variant="body2" sx={{ color: "#999" }}>
              Generated PDF reports from Vigil Shield SOC platform
            </Typography>
          </Box>
          <Box sx={{ ml: "auto" }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadReports}
              sx={{
                color: "#00bfff",
                borderColor: "#00bfff",
                "&:hover": {
                  borderColor: "#00d4ff",
                  bgcolor: "rgba(0,191,255,0.1)",
                },
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: "#0f1621", border: "1px solid #00bfff30" }}>
              <CardContent>
                <Typography sx={{ color: "#999", fontSize: 12 }}>
                  TOTAL REPORTS
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: "#00bfff", fontWeight: 700 }}
                >
                  {reports.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TextField
          fullWidth
          placeholder="Search by report ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              "& fieldset": { borderColor: "#00bfff30" },
              "&:hover fieldset": { borderColor: "#00bfff" },
              "&.Mui-focused fieldset": { borderColor: "#00bfff" },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#666" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#00bfff" }} />
        </Box>
      )}

      {!loading && filteredReports.length === 0 && (
        <Card
          sx={{
            bgcolor: "#0f1621",
            border: "1px dashed #00bfff40",
            textAlign: "center",
            py: 8,
          }}
        >
          <FileIcon sx={{ fontSize: 60, color: "#00bfff40", mb: 2 }} />
          <Typography sx={{ color: "#666", mb: 1 }}>No reports found</Typography>
          <Typography variant="body2" sx={{ color: "#444" }}>
            Generate a report from an alert detail page to see it here
          </Typography>
        </Card>
      )}

      {!loading && filteredReports.length > 0 && (
        <Grid container spacing={3}>
          {filteredReports.map((report) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={report.filename}>
              <Card
                sx={{
                  bgcolor: "#0f1621",
                  border: "1px solid #00bfff30",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "#00bfff",
                    transform: "translateY(-4px)",
                    boxShadow: "0 0 20px rgba(0,191,255,0.2)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <FileIcon sx={{ color: "#ff3b3b", mr: 1 }} />
                    <Chip
                      label="PDF"
                      size="small"
                      sx={{
                        bgcolor: "#ff3b3b20",
                        color: "#ff3b3b",
                        fontSize: 10,
                        height: 20,
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      mb: 1,
                      fontFamily: "monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {report.report_id}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#666", display: "block", mb: 0.5 }}
                  >
                    {formatDate(report.created_at)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#666", display: "block", mb: 2 }}
                  >
                    Size: {formatSize(report.size_bytes)}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(report)}
                      sx={{
                        bgcolor: "#00bfff",
                        color: "#000",
                        fontWeight: 600,
                        fontSize: 12,
                        "&:hover": { bgcolor: "#00d4ff" },
                      }}
                    >
                      Download
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEmail(report)}
                      sx={{
                        color: "#00bfff",
                        border: "1px solid #00bfff40",
                        "&:hover": { bgcolor: "rgba(0,191,255,0.1)" },
                      }}
                    >
                      <EmailIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        slotProps={{
          paper: {
            sx: { bgcolor: "#0f1621", border: "1px solid #00bfff40" },
          },
        }}
      >
        <DialogTitle sx={{ color: "#fff" }}>Email Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#999", mb: 2 }}>
            Send{" "}
            <strong style={{ color: "#00bfff" }}>
              {selectedReport?.report_id}
            </strong>{" "}
            to:
          </Typography>
          <TextField
            fullWidth
            type="email"
            placeholder="recipient@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                "& fieldset": { borderColor: "#00bfff30" },
                "&:hover fieldset": { borderColor: "#00bfff" },
                "&.Mui-focused fieldset": { borderColor: "#00bfff" },
              },
            }}
          />
          {emailStatus && (
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                color: emailStatus.startsWith("✓") ? "#00a854" : "#ff3b3b",
                fontFamily: "monospace",
              }}
            >
              {emailStatus}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEmailDialogOpen(false)}
            sx={{ color: "#999" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={!recipientEmail || emailSending}
            variant="contained"
            sx={{
              bgcolor: "#00bfff",
              color: "#000",
              "&:hover": { bgcolor: "#00d4ff" },
            }}
          >
            {emailSending ? <CircularProgress size={20} /> : "Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}