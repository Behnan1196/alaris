import { DOMAINS, type DomainKey } from "@alaris/shared";

export function DomainTag({ k }: { k: string }) {
  const d = DOMAINS[k as DomainKey];
  if (!d) return null;
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: d.color }}>
      {d.name}
    </span>
  );
}
