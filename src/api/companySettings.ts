import { apiFetch, ApiError } from './client';

export interface CompanySettings {
  id: string;
  legalNameAr: string;
  legalNameEn: string | null;
  vatNumber: string;
  crNumber: string | null;
  buildingNumber: string | null;
  streetName: string | null;
  district: string | null;
  city: string | null;
  postalCode: string | null;
  additionalNumber: string | null;
  countryCode: string;
}

/** Returns null (instead of throwing) when the company hasn't configured its tax settings yet. */
export async function fetchCompanySettings(): Promise<CompanySettings | null> {
  try {
    return await apiFetch<CompanySettings>('/company-settings');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export interface CompanySettingsInput {
  legalNameAr: string;
  legalNameEn?: string;
  vatNumber: string;
  crNumber?: string;
  buildingNumber?: string;
  streetName?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  additionalNumber?: string;
}

export function updateCompanySettings(input: CompanySettingsInput) {
  return apiFetch<CompanySettings>('/company-settings', { method: 'PATCH', body: JSON.stringify(input) });
}
