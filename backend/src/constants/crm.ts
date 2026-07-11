export const CRM_STATUS = Object.freeze({
  GOOD_LEAD_FOLLOW_UP: 'GOOD_LEAD_FOLLOW_UP',
  DID_NOT_CONNECT: 'DID_NOT_CONNECT',
  BAD_LEAD: 'BAD_LEAD',
  SALE_DONE: 'SALE_DONE',
} as const);

export const DATA_SOURCES = Object.freeze({
  LEADS_ON_DEMAND: 'leads_on_demand',
  MERIDIAN_TOWER: 'meridian_tower',
  EDEN_PARK: 'eden_park',
  VARAH_SWAMY: 'varah_swamy',
  SARJAPUR_PLOTS: 'sarjapur_plots',
} as const);

export type CrmStatusConstant = (typeof CRM_STATUS)[keyof typeof CRM_STATUS];
export type DataSourceConstant = (typeof DATA_SOURCES)[keyof typeof DATA_SOURCES];
