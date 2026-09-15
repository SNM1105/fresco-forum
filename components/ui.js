import {
  Atom,
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  Code2,
  Dna,
  Film,
  FlaskConical,
  Globe2,
  GraduationCap,
  Gavel,
  HeartPulse,
  Landmark,
  Languages,
  Megaphone,
  Microscope,
  Music2,
  Palette,
  PenTool,
  Theater,
} from "lucide-react";

const GROUP_COLOR = { art: "text-sienna", politics: "text-lapis", life: "text-verdigris" };

const STUDY_ICONS = [
  { terms: ["film", "cinema", "movie", "screenwriting"], icon: Film },
  { terms: ["art", "design", "graphic", "visual", "fashion", "architecture"], icon: Palette },
  { terms: ["music", "sound", "audio"], icon: Music2 },
  { terms: ["theatre", "theater", "drama", "acting", "dance"], icon: Theater },
  { terms: ["literature", "english", "writing", "creative writing", "journalism"], icon: PenTool },
  { terms: ["history", "classics", "anthropology", "philosophy"], icon: BookOpen },
  { terms: ["language", "linguistics", "translation"], icon: Languages },
  { terms: ["biology", "biochemistry", "genetics", "neuroscience"], icon: Dna },
  { terms: ["science", "chemistry", "physics"], icon: FlaskConical },
  { terms: ["astronomy", "astrophysics", "space"], icon: Atom },
  { terms: ["medicine", "nursing", "health", "psychology", "kinesiology"], icon: HeartPulse },
  { terms: ["computation arts", "computer", "software", "programming", "data", "technology", "informatics"], icon: Code2 },
  { terms: ["math", "mathematics", "statistics"], icon: Calculator },
  { terms: ["business", "commerce", "marketing", "finance", "accounting", "economics"], icon: BriefcaseBusiness },
  { terms: ["law", "legal", "political science", "politics", "government"], icon: Gavel },
  { terms: ["education", "teaching", "pedagogy"], icon: GraduationCap },
  { terms: ["geography", "environment", "geology", "earth", "urban"], icon: Globe2 },
  { terms: ["communication", "media", "public relations", "advertising"], icon: Megaphone },
  { terms: ["microscopy", "research"], icon: Microscope },
  { terms: ["international", "global", "relations"], icon: Landmark },
];

function getStudyIcon(program) {
  const value = program?.toLowerCase();
  if (!value) return null;
  return STUDY_ICONS.find(({ terms }) => terms.some((term) => value.includes(term)))?.icon || GraduationCap;
}

export function getProfileMediaUrl(path) {
  if (!path || path.startsWith("http") || path.startsWith("data:")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-media/${path}`;
}

export function Avatar({ name = "?", url, size = 36, verified, program, position = "50% 50%", scale = 100 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const StudyIcon = getStudyIcon(program);
  const imageUrl = getProfileMediaUrl(url);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {imageUrl ? (
        <span className="absolute inset-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={name} className="w-full h-full rounded-full object-cover" style={{ objectPosition: position, transform: `scale(${Math.max(100, scale) / 100})` }} />
        </span>
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
      {StudyIcon && (
        <span
          title={program}
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border border-card bg-ink text-plaster"
          style={{ width: Math.max(16, size * 0.42), height: Math.max(16, size * 0.42) }}
        >
          <StudyIcon size={Math.max(10, size * 0.25)} strokeWidth={2.25} aria-hidden="true" />
          <span className="sr-only">{program}</span>
        </span>
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
