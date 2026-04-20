import Link from "next/link";
import { UserSwitcherButton } from "./UserSwitcherButton";

type User = { id: string; name: string; department: string; role: string };

type Props = {
  user: User | null;
  users: User[];
  unreadCount: number;
};

export function TopBar({ user, users, unreadCount }: Props) {

  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-[#faf8ff]/80 bg-opacity-80 px-8 py-4 shadow-[0_10px_30px_-5px_rgba(25,27,35,0.04)] backdrop-blur-xl">
      <div className="flex items-center gap-8">
        <h1 className="font-['Inter'] text-2xl font-black uppercase tracking-tighter text-[#191b23]">
          SecondLife
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/inbox"
            className="relative rounded-full p-2 text-[#434655] transition-all hover:bg-slate-100"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <button className="rounded-full p-2 text-[#434655] transition-all hover:bg-slate-100">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <button className="rounded-full p-2 text-[#434655] transition-all hover:bg-slate-100">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="mx-2 h-8 w-[1px] bg-outline-variant opacity-30" />
        <UserSwitcherButton current={user} users={users} />
      </div>
    </header>
  );
}
