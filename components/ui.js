const GROUP_COLOR = { art: "text-sienna", politics: "text-lapis", life: "text-verdigris" };

export function Avatar({ name = "?", url, size = 36, verified }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center font-display font-semibold text-white bg-sienna"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </div>
      )}
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px] text-lapis">
          {/* BadgeCheck rendered by caller if lucide import is needed inline */}
        </div>
      )}
    </div>
  );
}

export function Pill({ children, active, className = "", ...props }) {
  return (
    <button
      className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
        active ? "bg-ink text-plaster border-ink" : "border-line text-ink-soft"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function CategoryLabel({ group, label }) {
  return (
    <span className={`font-mono uppercase tracking-wider text-[10px] ${GROUP_COLOR[group] || "text-ink-soft"}`}>
      {label}
    </span>
  );
}
