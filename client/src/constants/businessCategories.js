export const businessCategories = [
  { value: "beauty", label: "Beauty" },
  { value: "education", label: "Education" },
  { value: "events", label: "Events" },
  { value: "fitness", label: "Fitness" },
  { value: "food", label: "Food" },
  { value: "health", label: "Health" },
  { value: "home_services", label: "Home services" },
  { value: "other", label: "Other" },
];

export function categoryLabel(category) {
  return businessCategories.find((item) => item.value === category)?.label || "General";
}
