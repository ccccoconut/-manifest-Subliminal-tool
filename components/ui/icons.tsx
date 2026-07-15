import type { BgSource, SceneKey } from "@/lib/types";

// Lucide 风格描边图标（替代 emoji，符合 ui-ux-pro-max「no emoji as icons」规则）
function Svg({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className ?? "h-5 w-5"}
    >
      {children}
    </svg>
  );
}

const PATHS = {
  // 场景
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" />
      <path d="M8 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  moon: <path d="M12 3a6.5 6.5 0 1 0 9 9 7.5 7.5 0 0 1-9-9Z" />,
  book: (
    <>
      <path d="M3 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H3Z" />
      <path d="M21 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H21Z" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.6 4.8a2 2 0 0 0 1.6 1.6L20 11l-4.8 1.6a2 2 0 0 0-1.6 1.6L12 19l-1.6-4.8a2 2 0 0 0-1.6-1.6L4 11l4.8-1.6a2 2 0 0 0 1.6-1.6Z" />
      <path d="M19 4v3M20.5 5.5h-3" />
    </>
  ),
  // 背景音来源
  music: (
    <>
      <path d="M9 18V6l11-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M12 4v12" />
    </>
  ),
  disc: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  library: (
    <>
      <path d="M8 6h12v14H8z" />
      <path d="M6 8H4v12h12v-2" />
      <path d="M11 10h5M11 14h6" />
    </>
  ),
  mute: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M22 9l-6 6M16 9l6 6" />
    </>
  ),
} as const;

const SCENE_ICON: Record<SceneKey, keyof typeof PATHS> = {
  interview: "target",
  exam: "clipboard",
  sleep: "moon",
  study: "book",
  other: "sparkles",
};

const BG_ICON: Record<BgSource, keyof typeof PATHS> = {
  recipe: "music",
  upload: "upload",
  library: "library",
  qqmusic: "disc",
  none: "mute",
};

export function SceneIcon({
  scene,
  className,
}: {
  scene: SceneKey;
  className?: string;
}) {
  return <Svg className={className}>{PATHS[SCENE_ICON[scene]]}</Svg>;
}

export function BgIcon({
  source,
  className,
}: {
  source: BgSource;
  className?: string;
}) {
  return <Svg className={className}>{PATHS[BG_ICON[source]]}</Svg>;
}
