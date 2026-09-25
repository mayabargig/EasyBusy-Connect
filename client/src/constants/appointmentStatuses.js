export const appointmentStatuses = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

export function appointmentStatusLabel(value) {
  return appointmentStatuses.find((status) => status.value === value)?.label || value;
}
