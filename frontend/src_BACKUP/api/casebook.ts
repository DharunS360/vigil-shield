/**
 * Vigil Shield - Casebook API Client
 */
import { apiClient } from "./client";

export interface CasebookCase {
  id: string;
  slug: string;
  title: string;
  case_id: string;
  severity: string;
  mitre: string;
  tactic: string;
  category: string;
  status: string;
}

export interface CasebookStats {
  total: number;
  by_category: Record<string, number>;
  by_severity: Record<string, number>;
  by_tactic: Record<string, number>;
}

export interface CaseDetail {
  slug: string;
  content: string;
  metadata: {
    case_id: string;
    severity: string;
    mitre: string;
    tactic: string;
  };
}

export async function listCases(): Promise<{
  total: number;
  cases: CasebookCase[];
}> {
  const res = await apiClient.get("/casebook/cases");
  return res.data;
}

export async function getCase(slug: string): Promise<CaseDetail> {
  const res = await apiClient.get(`/casebook/cases/${slug}`);
  return res.data;
}

export async function getCasebookStats(): Promise<CasebookStats> {
  const res = await apiClient.get("/casebook/stats");
  return res.data;
}

export async function listPlaybooks(): Promise<{
  total: number;
  playbooks: { name: string; title: string }[];
}> {
  const res = await apiClient.get("/casebook/playbooks");
  return res.data;
}

export async function getPlaybook(name: string): Promise<{
  name: string;
  content: string;
}> {
  const res = await apiClient.get(`/casebook/playbooks/${name}`);
  return res.data;
}