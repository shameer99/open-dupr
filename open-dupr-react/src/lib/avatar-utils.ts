export const normalizeName = (name: string): string => {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ");
};

export const getInitials = (name: string): string => {
  const cleaned = normalizeName(name);
  if (!cleaned) return "";
  const parts = cleaned.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts[parts.length - 1]?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];

  const basis = normalizeName(name).toLowerCase();
  const hash = basis.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};
