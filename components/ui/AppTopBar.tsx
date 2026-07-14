"use client";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function AppTopBar({
  icon,
  onIconClick,
  iconAriaLabel,
  iconAriaExpanded,
  iconCircle = false,
  settingsDropdown,
  backLabel,
  onBack,
  rightAction,
}: {
  icon: React.ReactNode;
  onIconClick?: () => void;
  iconAriaLabel?: string;
  iconAriaExpanded?: boolean;
  /** Custom avatar: clip to circle; default brand mark stays rounded square */
  iconCircle?: boolean;
  settingsDropdown?: React.ReactNode;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}) {
  return (
    <header
      className={`app-topbar relative w-full shrink-0 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] ${
        settingsDropdown ? "z-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="relative shrink-0">
            {settingsDropdown}
            <div className="flex flex-col items-start">
              <button
                type="button"
                onClick={onIconClick}
                aria-label={iconAriaLabel}
                aria-expanded={iconAriaExpanded}
                className={`app-topbar-icon flex h-9 w-9 items-center justify-center overflow-hidden bg-[var(--color-aura)]/15 font-bold text-[var(--color-aura)] ring-1 ring-white/70 ${
                  iconCircle ? "rounded-full" : "rounded-2xl"
                }`}
              >
                {icon}
              </button>
              <div className="app-topbar-back-slot mt-1.5">
                {backLabel && onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="max-w-[5.75rem] text-left text-[var(--color-haze)] transition-colors hover:text-[var(--color-mist)]"
                  >
                    ← {backLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="app-topbar-brand min-w-0 pt-0.5">
            <p className="truncate text-[var(--color-mist)]">{APP_NAME}</p>
            <p className="truncate text-[var(--color-haze)]">{APP_TAGLINE}</p>
          </div>
        </div>

        {rightAction ? (
          <div className="flex shrink-0 items-center self-start pt-0.5">{rightAction}</div>
        ) : null}
      </div>
    </header>
  );
}
