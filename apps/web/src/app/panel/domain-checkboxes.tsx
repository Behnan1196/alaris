import { DOMAINS, type DomainKey } from "@alaris/shared";

export function DomainCheckboxes({
  keys,
  defaultChecked = [],
}: {
  keys: readonly string[];
  defaultChecked?: readonly string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((key) => {
        const d = DOMAINS[key as DomainKey];
        if (!d) return null;
        return (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-300 px-3 py-1.5 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white"
          >
            <input
              type="checkbox"
              name="domains"
              value={key}
              defaultChecked={defaultChecked.includes(key)}
              className="sr-only"
            />
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name}
          </label>
        );
      })}
    </div>
  );
}
