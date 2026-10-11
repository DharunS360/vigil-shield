"""
Vigil Shield — Report Generator Service
Generates professional PDF incident reports using ReportLab.
"""
from datetime import datetime
from pathlib import Path
import logging

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

logger = logging.getLogger(__name__)

# Colors — Vigil Shield theme
VS_BLUE = colors.HexColor("#00bfff")
VS_DARK = colors.HexColor("#0a1424")
VS_GRAY = colors.HexColor("#666666")
VS_LIGHT = colors.HexColor("#f5f7fa")
VS_GREEN = colors.HexColor("#00a854")
VS_ORANGE = colors.HexColor("#ff9500")
VS_RED = colors.HexColor("#ff3b3b")
VS_YELLOW = colors.HexColor("#fbbf24")


class ReportGenerator:
    OUTPUT_DIR = Path(__file__).parent.parent.parent / "reports"

    def __init__(self):
        self.OUTPUT_DIR.mkdir(exist_ok=True)
        self._setup_styles()

    def _setup_styles(self):
        self.title_style = ParagraphStyle(
            name="VSTitle",
            fontSize=22,
            textColor=VS_BLUE,
            spaceAfter=4,
            fontName="Helvetica-Bold",
            alignment=TA_LEFT,
        )
        self.subtitle_style = ParagraphStyle(
            name="VSSubtitle",
            fontSize=9,
            textColor=VS_GRAY,
            spaceAfter=20,
            fontName="Helvetica",
            tracking=2,
        )
        self.h1_style = ParagraphStyle(
            name="VSH1",
            fontSize=16,
            textColor=VS_DARK,
            spaceBefore=4,
            spaceAfter=12,
            fontName="Helvetica-Bold",
        )
        self.h2_style = ParagraphStyle(
            name="VSH2",
            fontSize=12,
            textColor=VS_BLUE,
            spaceBefore=16,
            spaceAfter=8,
            fontName="Helvetica-Bold",
        )
        self.body_style = ParagraphStyle(
            name="VSBody",
            fontSize=10,
            textColor=colors.HexColor("#1a1a1a"),
            leading=14,
            fontName="Helvetica",
        )
        self.small_style = ParagraphStyle(
            name="VSSmall",
            fontSize=8,
            textColor=VS_GRAY,
            fontName="Helvetica",
        )
        self.ioc_style = ParagraphStyle(
            name="VSIOC",
            fontSize=9,
            textColor=VS_GREEN,
            fontName="Courier-Bold",
            leading=14,
        )

    def _generate_report_id(self, alert_id: str) -> str:
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        short = str(alert_id)[:6].upper() if alert_id else "UNKNOW"
        return f"VS-{ts}-{short}"

    def _build_header(self, report_id: str, analyst: str) -> list:
        """Build header with logo + report metadata."""
        header_data = [
            [
                Paragraph(
                    '<font color="#00bfff" size="16"><b>VIGIL SHIELD</b></font>'
                    '<br/><font color="#666666" size="7">SOC ALERT TRIAGE PLATFORM</font>',
                    self.body_style,
                ),
                Paragraph(
                    f'<font color="#666666" size="8">Report ID: <b>{report_id}</b>'
                    f'<br/>Generated: {datetime.now().strftime("%d %b %Y, %I:%M %p")}'
                    f'<br/>Analyst: <b>{analyst}</b></font>',
                    self.body_style,
                ),
            ]
        ]
        header_table = Table(header_data, colWidths=[100 * mm, 70 * mm])
        header_table.setStyle(TableStyle([
            ("ALIGN", (0, 0), (0, 0), "LEFT"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LINEBELOW", (0, 0), (-1, -1), 2, VS_BLUE),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ]))
        return [header_table, Spacer(1, 12)]

    def _build_executive_summary(self, alert_data: dict) -> list:
        """Build executive summary table."""
        severity = alert_data.get("severity", "LOW")
        decision = alert_data.get("decision", "TP")
        decision_label = "TRUE POSITIVE" if decision == "TP" else "FALSE POSITIVE"

        sev_color = {
            "CRIT": "#ff3b3b",
            "HIGH": "#ff9500",
            "MED": "#fbbf24",
            "LOW": "#00bfff",
        }.get(severity, "#666666")

        dec_color = "#00a854" if decision == "TP" else "#999999"

        data = [
            ["Alert Type", Paragraph(f'<b>{alert_data.get("type", "N/A")}</b>', self.body_style)],
            ["Severity", Paragraph(f'<font color="{sev_color}"><b>{severity}</b></font>', self.body_style)],
            ["Decision", Paragraph(f'<font color="{dec_color}"><b>{decision_label}</b></font>', self.body_style)],
            ["Status", Paragraph(f'<b>{alert_data.get("status", "Closed")}</b>', self.body_style)],
            ["Source IP", Paragraph(f'<font face="Courier">{alert_data.get("source_ip", "N/A")}</font>', self.body_style)],
            ["Target", Paragraph(str(alert_data.get("target", "N/A")), self.body_style)],
        ]

        table = Table(data, colWidths=[50 * mm, 120 * mm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), VS_LIGHT),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8f4ff")),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        return [table, Spacer(1, 8)]

    def _build_alert_details(self, alert_data: dict) -> list:
        """Build alert details section."""
        data = [
            ["Alert ID", Paragraph(f'<font face="Courier">{alert_data.get("id", "N/A")}</font>', self.body_style)],
            ["Timestamp", Paragraph(str(alert_data.get("timestamp", datetime.now().isoformat())), self.body_style)],
            ["Triggered Rule", Paragraph(str(alert_data.get("rule", "N/A")), self.body_style)],
            ["Raw Log (truncated)", Paragraph(
                f'<font face="Courier" size="8">{str(alert_data.get("raw_log", "N/A"))[:300]}</font>',
                self.body_style,
            )],
        ]
        table = Table(data, colWidths=[50 * mm, 120 * mm])
        table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
            ("BACKGROUND", (0, 0), (0, -1), VS_LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        return [table, Spacer(1, 6)]

    def _build_triage(self, alert_data: dict) -> list:
        """Build triage decision section."""
        data = [
            ["Analyst", Paragraph(str(alert_data.get("analyst", "Dharun S (SOC L1)")), self.body_style)],
            ["Decision", Paragraph(str(alert_data.get("decision", "TP")), self.body_style)],
            ["Rationale", Paragraph(str(alert_data.get("rationale", "Confirmed malicious activity")), self.body_style)],
            ["Actions Taken", Paragraph(str(alert_data.get("actions", "Blocked source IP, escalated to L2")), self.body_style)],
            ["Time Spent", Paragraph(str(alert_data.get("time_spent", "5m 30s")), self.body_style)],
        ]
        table = Table(data, colWidths=[50 * mm, 120 * mm])
        table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
            ("BACKGROUND", (0, 0), (0, -1), VS_LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        return [table, Spacer(1, 6)]

    def _build_mitre(self, alert_data: dict) -> list:
        """Build MITRE ATT&CK mapping section."""
        technique = alert_data.get("mitre_technique", "N/A")
        data = [
            ["Tactic", Paragraph(str(alert_data.get("mitre_tactic", "N/A")), self.body_style)],
            ["Technique", Paragraph(f'<b>{technique}</b> — {alert_data.get("mitre_technique_name", "N/A")}', self.body_style)],
            ["Sub-technique", Paragraph(str(alert_data.get("mitre_sub", "N/A")), self.body_style)],
            ["Reference", Paragraph(
                f'<link href="https://attack.mitre.org/techniques/{technique}/" color="blue">'
                f'https://attack.mitre.org/techniques/{technique}/</link>',
                self.body_style,
            )],
        ]
        table = Table(data, colWidths=[50 * mm, 120 * mm])
        table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e5e7eb")),
            ("BACKGROUND", (0, 0), (0, -1), VS_LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        return [table, Spacer(1, 6)]

    def _build_iocs(self, alert_data: dict) -> list:
        """Build IOC enrichment section — dark box."""
        ioc_text = (
            f"IP: {alert_data.get('source_ip', 'N/A')}<br/>"
            f"VirusTotal Score: {alert_data.get('vt_score', 'N/A')} / 89<br/>"
            f"AbuseIPDB Score: {alert_data.get('abuse_score', 'N/A')} / 100<br/>"
            f"Malware Family: {alert_data.get('malware_family', 'Unknown')}<br/>"
            f"First Seen: {alert_data.get('first_seen', 'N/A')}"
        )
        ioc_table = Table([[Paragraph(ioc_text, self.ioc_style)]], colWidths=[170 * mm])
        ioc_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), VS_DARK),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ]))
        return [ioc_table, Spacer(1, 8)]

    def _build_recommendations(self, alert_data: dict) -> list:
        """Build recommendations list."""
        recs = alert_data.get("recommendations", [
            "Block source IP at perimeter firewall",
            "Review targeted service account permissions",
            "Monitor for reinfection attempts",
            "Document findings in ticketing system",
        ])
        rows = []
        for rec in recs:
            rows.append([
                Paragraph(f'<font color="#00bfff"><b>▸</b></font>', self.body_style),
                Paragraph(str(rec), self.body_style),
            ])
        table = Table(rows, colWidths=[8 * mm, 162 * mm])
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        return [table, Spacer(1, 6)]

    def _build_timeline(self, alert_data: dict) -> list:
        """Build incident timeline section."""
        timeline = alert_data.get("timeline", [
            {"time": "11:30:45", "event": "Alert triggered by detection rule"},
            {"time": "11:31:00", "event": "Alert assigned to analyst"},
            {"time": "11:35:00", "event": "Investigation completed — confirmed TP"},
            {"time": "11:40:00", "event": "Escalated to SOC L2"},
            {"time": "11:45:00", "event": "Case closed — mitigation applied"},
        ])

        rows = []
        for evt in timeline:
            time_p = Paragraph(
                f'<font color="#00bfff" face="Courier"><b>{evt.get("time", "")}</b></font>',
                self.body_style,
            )
            event_p = Paragraph(str(evt.get("event", "")), self.body_style)
            rows.append([time_p, event_p])

        table = Table(rows, colWidths=[30 * mm, 140 * mm])
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBEFORE", (0, 0), (0, -1), 2, VS_BLUE),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        return [table, Spacer(1, 8)]

    def _build_footer(self, canvas, doc):
        """Draw footer on every page."""
        canvas.saveState()
        canvas.setStrokeColor(VS_BLUE)
        canvas.setLineWidth(1)
        canvas.line(20 * mm, 20 * mm, 190 * mm, 20 * mm)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(VS_GRAY)
        canvas.drawString(
            20 * mm, 15 * mm,
            "VIGIL SHIELD v1.0 | SOC Alert Triage Platform"
        )
        canvas.drawRightString(
            190 * mm, 15 * mm,
            f"Page {doc.page}"
        )
        canvas.drawCentredString(
            105 * mm, 15 * mm,
            "CONFIDENTIAL — INTERNAL USE ONLY"
        )
        canvas.restoreState()

    def generate_pdf(self, alert_data: dict) -> Path:
        """Generate professional PDF incident report."""
        alert_id = str(alert_data.get("id", "unknown"))
        report_id = self._generate_report_id(alert_id)
        analyst = alert_data.get("analyst", "Dharun S (SOC L1)")
        output_path = self.OUTPUT_DIR / f"{report_id}.pdf"

        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            topMargin=20 * mm,
            bottomMargin=25 * mm,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
        )

        story = []
        story.extend(self._build_header(report_id, analyst))
        story.append(Paragraph("Incident Report", self.h1_style))
        story.append(Paragraph(
            "Security Operations Center — Alert Investigation Summary",
            self.small_style,
        ))
        story.append(Spacer(1, 12))

        story.append(Paragraph("1. Executive Summary", self.h2_style))
        story.extend(self._build_executive_summary(alert_data))

        story.append(Paragraph("2. Alert Details", self.h2_style))
        story.extend(self._build_alert_details(alert_data))

        story.append(Paragraph("3. Triage Decision", self.h2_style))
        story.extend(self._build_triage(alert_data))

        story.append(Paragraph("4. MITRE ATT&CK Mapping", self.h2_style))
        story.extend(self._build_mitre(alert_data))

        story.append(Paragraph("5. IOC Enrichment", self.h2_style))
        story.extend(self._build_iocs(alert_data))

        story.append(Paragraph("6. Recommendations", self.h2_style))
        story.extend(self._build_recommendations(alert_data))

        story.append(PageBreak())
        story.append(Paragraph("7. Incident Timeline", self.h2_style))
        story.extend(self._build_timeline(alert_data))

        doc.build(story, onFirstPage=self._build_footer, onLaterPages=self._build_footer)

        logger.info(f"Report generated: {output_path}")
        return output_path

    def generate_html_preview(self, alert_data: dict) -> str:
        """Generate simple HTML preview (for dashboard)."""
        return f"""
        <div style="font-family: Arial; padding: 20px;">
            <h1 style="color: #00bfff;">{alert_data.get('type', 'Alert')}</h1>
            <p><strong>Severity:</strong> {alert_data.get('severity', 'N/A')}</p>
            <p><strong>Source IP:</strong> {alert_data.get('source_ip', 'N/A')}</p>
            <p><strong>Target:</strong> {alert_data.get('target', 'N/A')}</p>
            <p><strong>Decision:</strong> {alert_data.get('decision', 'N/A')}</p>
        </div>
        """