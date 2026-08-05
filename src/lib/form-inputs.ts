export function getCheckboxInput(formData: FormData, key: string, defaultValue = false) {
  const values = formData.getAll(key).map((value) => String(value));

  if (values.length === 0) {
    return defaultValue;
  }

  return values.includes("true");
}
