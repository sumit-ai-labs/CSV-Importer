import { normalizeRecord } from './normalize.service.js';

describe('normalizeRecord', () => {
  it('normalizes a standard lead record', () => {
    const raw = {
      name: ' John Doe ',
      email: ' JOHN@EXAMPLE.COM ',
      mobile_without_country_code: ' 9876543210 ',
      country_code: ' +91 ',
      company: ' Google ',
      city: ' Bangalore ',
      state: ' Karnataka ',
      country: ' India ',
      lead_owner: ' Owner A ',
      crm_status: 'SALE_DONE',
      data_source: 'leads_on_demand',
    };

    const res = normalizeRecord(raw);

    expect(res.name).toBe('John Doe');
    expect(res.email).toBe('john@example.com');
    expect(res.mobile_without_country_code).toBe('9876543210');
    expect(res.country_code).toBe('+91');
    expect(res.company).toBe('Google');
    expect(res.city).toBe('Bangalore');
    expect(res.state).toBe('Karnataka');
    expect(res.country).toBe('India');
    expect(res.lead_owner).toBe('Owner A');
    expect(res.crm_status).toBe('SALE_DONE');
    expect(res.data_source).toBe('leads_on_demand');
  });

  it('splits multiple comma-separated emails, keeps first as email and appends rest to crm_note', () => {
    const raw = {
      email: 'primary@example.com, secondary@example.com, tertiary@example.com',
      crm_note: 'Initial remark',
    };

    const res = normalizeRecord(raw);

    expect(res.email).toBe('primary@example.com');
    expect(res.crm_note).toBe(
      'Initial remark | Secondary emails: secondary@example.com, tertiary@example.com',
    );
  });

  it('splits multiple semicolon-separated emails, keeps first as email and appends rest to crm_note', () => {
    const raw = {
      email: 'first@example.com; second@example.com',
    };

    const res = normalizeRecord(raw);

    expect(res.email).toBe('first@example.com');
    expect(res.crm_note).toBe('Secondary emails: second@example.com');
  });

  it('splits multiple comma-separated phones, keeps first as mobile and appends rest to crm_note', () => {
    const raw = {
      mobile_without_country_code: '9999911111, 8888822222',
    };

    const res = normalizeRecord(raw);

    expect(res.mobile_without_country_code).toBe('9999911111');
    expect(res.crm_note).toBe('Secondary mobiles: 8888822222');
  });

  it('splits multiple semicolon-separated phones, keeps first as mobile and appends rest to crm_note', () => {
    const raw = {
      mobile_without_country_code: '+919999911111; 8888822222',
    };

    const res = normalizeRecord(raw);

    expect(res.mobile_without_country_code).toBe('9999911111');
    expect(res.country_code).toBe('+91');
    expect(res.crm_note).toBe('Secondary mobiles: 8888822222');
  });

  it('cleans up spaces, hyphens, and brackets from the mobile number', () => {
    const raw = {
      mobile_without_country_code: ' (987) 654-3210 ',
    };

    const res = normalizeRecord(raw);

    expect(res.mobile_without_country_code).toBe('9876543210');
  });

  it('extracts country code if mobile starts with plus', () => {
    const raw = {
      mobile_without_country_code: '+91-98765-43210',
    };

    const res = normalizeRecord(raw);

    expect(res.country_code).toBe('+91');
    expect(res.mobile_without_country_code).toBe('9876543210');
  });
});
