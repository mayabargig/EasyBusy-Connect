export const postCategories = [
  { value: "general", label: "General" },
  { value: "promotion", label: "Promotion" },
  { value: "question", label: "Question" },
  { value: "recommendation", label: "Recommendation" },
  { value: "event", label: "Event" },
];

export function postCategoryLabel(category) {
  return postCategories.find((item) => item.value === category)?.label || "General";
}
