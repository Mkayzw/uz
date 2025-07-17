export function calculateCommission(applicationCount: number): number {
  const commissionPerApplication = 15;
  return applicationCount * commissionPerApplication;
}