import { CRMRecord, CrmStatus, DataSource } from '../../types/crm.js';

/**
 * Normalizes a raw AI-extracted CRM record based on application business rules.
 */
export const normalizeRecord = (record: any): CRMRecord => {
  let email = (record.email || '').trim().toLowerCase();
  let mobile = (record.mobile_without_country_code || '').trim();
  let countryCode = (record.country_code || '').trim();
  let crmNote = (record.crm_note || '').trim();

  // Helper to split on either comma or semicolon
  const splitMultiValues = (val: string): string[] => {
    return val
      .split(/[;,]/)
      .map((x) => x.trim())
      .filter(Boolean);
  };

  // If multiple emails are comma/semicolon-separated, select the first as primary and append the rest to notes
  if (email.includes(',') || email.includes(';')) {
    const emails = splitMultiValues(email).map((e: string) => e.toLowerCase());
    email = emails[0] || '';
    const secondaryEmails = emails.slice(1);
    if (secondaryEmails.length > 0) {
      const emailNotes = `Secondary emails: ${secondaryEmails.join(', ')}`;
      crmNote = crmNote ? `${crmNote} | ${emailNotes}` : emailNotes;
    }
  }

  // If multiple mobile numbers are comma/semicolon-separated, select the first as primary and append the rest to notes
  if (mobile.includes(',') || mobile.includes(';')) {
    const mobiles = splitMultiValues(mobile);
    mobile = mobiles[0] || '';
    const secondaryMobiles = mobiles.slice(1);
    if (secondaryMobiles.length > 0) {
      const mobileNotes = `Secondary mobiles: ${secondaryMobiles.join(', ')}`;
      crmNote = crmNote ? `${crmNote} | ${mobileNotes}` : mobileNotes;
    }
  }

  // Extract country code if mobile starts with '+' and countryCode is empty
  if (mobile.startsWith('+')) {
    const cleanDigits = mobile.replace(/[^\d]/g, '');
    if (cleanDigits.length > 10) {
      const ccLength = cleanDigits.length - 10;
      countryCode = '+' + cleanDigits.substring(0, ccLength);
      // Find the index of the first digit of the mobile number in the original string
      let digitCount = 0;
      let splitIdx = 0;
      for (let i = 0; i < mobile.length; i++) {
        if (/\d/.test(mobile[i])) {
          digitCount++;
          if (digitCount === ccLength + 1) {
            splitIdx = i;
            break;
          }
        }
      }
      mobile = mobile.substring(splitIdx).trim();
    } else {
      const match = mobile.match(/^(\+\d{1,4})(.*)$/);
      if (match) {
        countryCode = match[1];
        mobile = match[2].trim();
      }
    }
  }

  // Clean up punctuation from the mobile number (spaces, hyphens, brackets)
  mobile = mobile.replace(/[\s\-()]/g, '');

  return {
    created_at: record.created_at || new Date().toISOString(),
    name: (record.name || '').trim(),
    email,
    country_code: countryCode,
    mobile_without_country_code: mobile,
    company: (record.company || '').trim(),
    city: (record.city || '').trim(),
    state: (record.state || '').trim(),
    country: (record.country || '').trim(),
    lead_owner: (record.lead_owner || '').trim(),
    crm_status: (record.crm_status || 'GOOD_LEAD_FOLLOW_UP') as CrmStatus,
    crm_note: crmNote,
    data_source: (record.data_source || '') as DataSource,
    possession_time: (record.possession_time || '').trim(),
    description: (record.description || '').trim(),
  };
};
