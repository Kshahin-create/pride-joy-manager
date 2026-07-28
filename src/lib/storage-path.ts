export function getSafeFileExtension(file: File, fallback = "bin") {
  const nameExtension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (nameExtension && nameExtension.length <= 12) return nameExtension;

  const typeExtension = file.type
    .split("/")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (typeExtension === "jpeg") return "jpg";
  return typeExtension || fallback;
}

export function createStorageObjectPath(prefix: string, file: File, label?: string) {
  const safePrefix = prefix
    .split("/")
    .map((part) =>
      part
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, ""),
    )
    .filter(Boolean)
    .join("/");
  const safeLabel = label
    ?.replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const extension = getSafeFileExtension(file);
  const fileName = [Date.now(), safeLabel, randomId].filter(Boolean).join("-");

  return safePrefix ? `${safePrefix}/${fileName}.${extension}` : `${fileName}.${extension}`;
}