"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Globe2, LayoutDashboard, Loader2, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface AccountMenuProps {
  name: string;
  email: string;
  /** Rendered in the trigger and the panel header; falls back to an initial. */
  avatarUrl?: string | null;
  dashboardHref: string;
  dashboardLabel: string;
  languageLabel: string;
  logoutLabel: string;
  logoutFailedLabel: string;
  menuLabel: string;
  signingOut: boolean;
  logoutFailed: boolean;
  onLogout: () => void;
  onSwitchLanguage: () => void;
}

/**
 * The account control, as a single trigger that opens a menu.
 *
 * It replaces a row that tried to show the name, the e-mail, a dashboard link,
 * a language switch and a logout button side by side: the name truncated at
 * 90px, the e-mail spilled out below the bar, and the logout label wrapped onto
 * two lines. Identity belongs in the panel, where there is room to show it in
 * full, and the bar keeps one control of a predictable width.
 */
export function AccountMenu({
  name,
  email,
  avatarUrl,
  dashboardHref,
  dashboardLabel,
  languageLabel,
  logoutLabel,
  logoutFailedLabel,
  menuLabel,
  signingOut,
  logoutFailed,
  onLogout,
  onSwitchLanguage,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // A menu that only closes on its own trigger feels broken, so close on an
  // outside pointer press and on Escape, returning focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = (name || email).trim().charAt(0).toUpperCase() || "?";

  const avatar = (size: string) =>
    avatarUrl ? (
      // Avatars come from arbitrary provider hosts, so they bypass the image
      // optimizer rather than requiring every host in next.config - the same
      // way the report page renders an account's picture.
      <span className={`${size} relative shrink-0 overflow-hidden rounded-full`}>
        <Image
          loader={({ src }) => src}
          unoptimized
          fill
          sizes="40px"
          src={avatarUrl}
          alt=""
          className="object-cover"
        />
      </span>
    ) : (
      <span
        aria-hidden="true"
        className={`${size} grid shrink-0 place-items-center rounded-full bg-brand font-black text-brand-foreground`}
      >
        {initial}
      </span>
    );

  const item =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-white/85 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={menuLabel}
        className="flex h-10 max-w-[190px] items-center gap-2 rounded-[10px] border border-white/[0.14] bg-white/[0.06] pe-2 ps-1.5 text-xs font-black text-white/85 transition hover:border-brand/40 hover:text-brand"
      >
        {avatar("size-7 text-[11px]")}
        <span className="min-w-0 truncate">{name || email}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label={menuLabel}
          className="absolute end-0 top-full z-50 mt-2 w-[268px] rounded-2xl border border-white/[0.10] bg-[#15161a] p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,.85)]"
        >
          <div className="flex items-center gap-3 rounded-xl px-3 py-3">
            {avatar("size-10 text-sm")}
            <span className="min-w-0">
              <strong className="block truncate text-sm font-bold text-white">
                {name || email}
              </strong>
              <span className="block truncate text-xs text-white/50" dir="ltr">
                {email}
              </span>
            </span>
          </div>

          <div className="my-1 h-px bg-white/[0.08]" />

          <Link
            href={dashboardHref}
            role="menuitem"
            className={item}
            onClick={() => setOpen(false)}
          >
            <LayoutDashboard className="size-4 shrink-0 text-white/55" />
            {dashboardLabel}
          </Link>

          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              onSwitchLanguage();
              setOpen(false);
            }}
          >
            <Globe2 className="size-4 shrink-0 text-white/55" />
            {languageLabel}
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            className={`${item} hover:text-[#ff8f9f]`}
            onClick={onLogout}
          >
            {signingOut ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-white/55" />
            ) : (
              <LogOut className="size-4 shrink-0 text-white/55" />
            )}
            {logoutLabel}
          </button>

          {logoutFailed && (
            <p role="alert" className="px-3 pb-1 pt-2 text-[11px] font-medium text-[#ff8f9f]">
              {logoutFailedLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
