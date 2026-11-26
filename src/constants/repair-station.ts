export const repairStationKycStatuses = [
  { value: 2, label: 'authenticated', type: 'success', tone: '#168460' },
  { value: 1, label: 'authenticationInProgress', type: 'info', tone: '#4179d9' },
  { value: 0, label: 'unauthenticated', type: 'warning', tone: '#b26713' },
  { value: 3, label: 'authenticationFailed', type: 'error', tone: '#bd5268' }
] as const;
