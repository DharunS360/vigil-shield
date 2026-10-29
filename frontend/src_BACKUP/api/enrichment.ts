/**
 * Vigil Shield - IOC Enrichment API Client
 */
import { apiClient } from "./client";

export interface VirusTotalResult {
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
  total_engines?: number;
  country?: string;
  as_owner?: string;
  reputation?: number;
  registrar?: string;
  type_description?: string;
  names?: string[];
  threat_label?: string;
  error?: string;
}

export interface AbuseIPDBResult {
  abuse_confidence_score?: number;
  total_reports?: number;
  country_code?: string;
  isp?: string;
  domain?: string;
  is_whitelisted?: boolean;
  usage_type?: string;
  error?: string;
}

export interface EnrichmentResult {
  ioc_type: "ip" | "hash" | "domain";
  value: string;
  virustotal?: VirusTotalResult;
  abuseipdb?: AbuseIPDBResult;
  risk_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  enriched_at: string;
  error?: string;
}

export async function enrichIP(ip: string): Promise<EnrichmentResult> {
  const response = await apiClient.get<EnrichmentResult>(
    `/enrichment/ip/${ip}`
  );
  return response.data;
}

export async function enrichHash(hash: string): Promise<EnrichmentResult> {
  const response = await apiClient.get<EnrichmentResult>(
    `/enrichment/hash/${hash}`
  );
  return response.data;
}

export async function enrichDomain(domain: string): Promise<EnrichmentResult> {
  const response = await apiClient.get<EnrichmentResult>(
    `/enrichment/domain/${domain}`
  );
  return response.data;
}

export async function enrichIOC(
  iocType: "ip" | "hash" | "domain",
  value: string
): Promise<EnrichmentResult> {
  const response = await apiClient.post<EnrichmentResult>(
    "/enrichment/lookup",
    {
      ioc_type: iocType,
      value,
    }
  );
  return response.data;
}

export async function getEnrichmentStatus() {
  const response = await apiClient.get("/enrichment/status");
  return response.data;
}