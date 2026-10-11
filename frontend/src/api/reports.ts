/**
 * Reports API Client
 * Uses the shared apiClient (baseURL: http://localhost:8000/api/v1)
 */
import { apiClient } from "./client";

export interface Report {
  filename: string;
  report_id: string;
  size_bytes: number;
  created_at: number;
  download_url: string;
}

export interface GenerateReportRequest {
  alert_id: string;
  alert_data: Record<string, any>;
  send_email?: boolean;
  to_email?: string;
}

export interface GenerateReportResponse {
  status: string;
  report_id: string;
  filename: string;
  download_url: string;
  email_sent: boolean;
}

export async function generateReport(
  req: GenerateReportRequest
): Promise<GenerateReportResponse> {
  const response = await apiClient.post<GenerateReportResponse>(
    "/reports/generate",
    req
  );
  return response.data;
}

export async function listReports(): Promise<{
  total: number;
  reports: Report[];
}> {
  const response = await apiClient.get("/reports/list");
  return response.data;
}

export function getDownloadUrl(filename: string): string {
  return `http://localhost:8000/api/v1/reports/download/${filename}`;
}

export async function emailReport(
  filename: string,
  toEmail: string
): Promise<{ status: string; to: string; filename: string }> {
  const response = await apiClient.post(
    `/reports/email/${filename}?to_email=${encodeURIComponent(toEmail)}`
  );
  return response.data;
}