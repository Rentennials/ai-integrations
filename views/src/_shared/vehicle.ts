export function vehicleTitle(vehicle: { name: string; year?: string | null }): string {
  return vehicle.year && !new RegExp(`\\b${vehicle.year.replace(/[^\d]/g, '')}\\b`).test(vehicle.name)
    ? `${vehicle.name} ${vehicle.year}` : vehicle.name;
}
