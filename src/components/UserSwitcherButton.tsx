"use client";

import { useRef, useState, useEffect } from "react";
import { switchUserAction } from "@/lib/actions";

type User = { id: string; name: string; department: string; role: string };

export function UserSwitcherButton({
  current,
  users,
}: {
  current: User | null;
  users: User[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = current
    ? current.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 pl-2 transition-opacity hover:opacity-80"
        aria-expanded={open}
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold text-on-surface">
            {current?.name ?? "Not signed in"}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            {current?.department ?? "Click to log in"}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-fixed bg-primary-fixed text-sm font-bold text-primary">
          {initials}
        </div>
        <span className="material-symbols-outlined text-sm text-outline">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-xl">
          <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-outline">
            Switch User
          </p>
          {users.map((u) => {
            const isActive = u.id === current?.id;
            return (
              <form key={u.id} action={switchUserAction}>
                <input type="hidden" name="userId" value={u.id} />
                <button
                  type="submit"
                  disabled={isActive}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container disabled:cursor-default ${
                    isActive ? "bg-primary-fixed/30" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-primary">
                    {u.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-on-surface">
                      {u.name}
                    </p>
                    <p className="truncate text-[10px] text-on-surface-variant">
                      {u.department}
                    </p>
                  </div>
                  {isActive && (
                    <span className="material-symbols-outlined ml-auto text-sm text-primary">
                      check
                    </span>
                  )}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
