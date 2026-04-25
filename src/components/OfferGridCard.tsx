import Link from "next/link";
import Image from "next/image";
import { getCategory } from "@/lib/categories";
import { conditionBadge } from "@/lib/conditionBadge";
import { daysUntil, formatCondition, formatDate } from "@/lib/format";

type Mode = "browse" | "owner";

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-900",
  CLAIMED: "bg-amber-100 text-amber-900",
  COMPLETED: "bg-blue-100 text-blue-900",
  SCRAPPED: "bg-gray-200 text-gray-700",
};

type Props = {
  offer: {
    id: string;
    itemName: string;
    images: string[];
    condition: string;
    location: string;
    scrapDate: Date;
    quantity: number;
    estimatedValue: number;
    subCategory: string;
    category: string;
    status: string;
    offeringUser?: { department: string };
    claim?: { claimingUser: { name: string } } | null;
  };
  mode: Mode;
};

export function OfferGridCard({ offer: o, mode }: Props) {
  const days = daysUntil(o.scrapDate);
  const overdue = mode === "browse" && days <= 0 && o.status === "AVAILABLE";
  const urgent = o.status === "AVAILABLE" && days <= 1;
  const editable = o.status !== "SCRAPPED" && o.status !== "COMPLETED";
  const badge = conditionBadge(o.condition);
  const category = getCategory(o.category);
  const heroHeight = mode === "browse" ? "h-48" : "h-40";
  const fillSizes =
    mode === "browse"
      ? "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
      : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

  const Hero = (
    <div
      className={`relative ${heroHeight} overflow-hidden bg-gradient-to-br from-surface-container-high to-surface-container`}
    >
      {overdue && (
        <div className="absolute inset-x-0 top-0 z-10 bg-amber-500/95 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur">
          Overdue
        </div>
      )}
      {o.images[0] ? (
        <Image
          src={o.images[0]}
          alt={o.itemName}
          fill
          sizes={fillSizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-primary/40 transition-transform duration-500 group-hover:scale-105">
          <span className="material-symbols-outlined text-[96px]">
            {category.icon}
          </span>
        </div>
      )}

      {mode === "browse" && (
        <>
          <span className={`card-cond ${badge.cls} absolute left-3 top-3`}>
            <span className="dot" />
            {badge.label}
          </span>
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-on-surface shadow-sm backdrop-blur">
            <span className="material-symbols-outlined text-xs">
              {category.icon}
            </span>
            {category.label}
          </div>
        </>
      )}

      {mode === "owner" && (
        <span
          className={`absolute left-3 top-3 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLE[o.status] ?? "bg-gray-100"}`}
        >
          {o.status}
        </span>
      )}
    </div>
  );

  const Title = (
    <>
      <h3 className="text-lg font-bold text-on-surface">{o.itemName}</h3>
      {o.subCategory && (
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          {category.label} · {o.subCategory}
        </p>
      )}
      {o.estimatedValue > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          Estimated Value: ${o.estimatedValue.toLocaleString()}
        </p>
      )}
    </>
  );

  if (mode === "browse") {
    return (
      <Link
        href={`/offers/${o.id}`}
        aria-label={`View and claim ${o.itemName}`}
        className="group block overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {Hero}
        <div className="p-6">
          <div className="mb-2 min-w-0">{Title}</div>
          <div className="mb-6 flex flex-wrap gap-y-2">
            <Meta icon="domain" text={o.offeringUser?.department ?? ""} half />
            <Meta icon="location_on" text={o.location} half truncate />
            <Meta
              icon="schedule"
              text={`Deadline: ${days > 0 ? `${days}d left` : "expired"}`}
              wide
              upper
              urgent={urgent}
            />
            <Meta
              icon="inventory_2"
              text={`qty ${o.quantity} · ${formatCondition(o.condition)}`}
              wide
            />
          </div>
          <span
            role="button"
            aria-hidden="true"
            className="block w-full rounded-lg bg-surface-container py-3 text-center font-bold text-primary transition-colors group-hover:bg-primary-container group-hover:text-white"
          >
            Claim Asset
          </span>
        </div>
      </Link>
    );
  }

  // owner mode
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-xl">
      <Link href={`/offers/${o.id}`} className="block">
        {Hero}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 min-w-0">
          <Link
            href={`/offers/${o.id}`}
            className="text-lg font-bold text-on-surface hover:underline"
          >
            {o.itemName}
          </Link>
          {o.estimatedValue > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Estimated Value: ${o.estimatedValue.toLocaleString()}
            </p>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-y-2">
          <Meta icon="location_on" text={o.location} wide />
          <Meta
            icon="inventory_2"
            text={`qty ${o.quantity} · ${formatCondition(o.condition)}`}
            wide
          />
          <Meta
            icon="schedule"
            text={
              o.status === "AVAILABLE"
                ? days > 0
                  ? `Deadline: ${days}d left`
                  : `Deadline: expired ${formatDate(o.scrapDate)}`
                : `Scrap by ${formatDate(o.scrapDate)}`
            }
            wide
            urgent={urgent}
          />
          {o.claim && o.status === "CLAIMED" && (
            <Meta
              icon="assignment_ind"
              text={`Claimed by ${o.claim.claimingUser.name}`}
              wide
            />
          )}
        </div>

        <div className="mt-auto flex gap-2">
          <Link
            href={`/offers/${o.id}`}
            className="flex-1 rounded-lg bg-surface-container py-2 text-center text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            View
          </Link>
          {editable && (
            <Link
              href={`/offers/${o.id}/edit`}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2 text-center text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Edit
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon,
  text,
  half,
  wide,
  truncate,
  upper,
  urgent,
}: {
  icon: string;
  text: string;
  half?: boolean;
  wide?: boolean;
  truncate?: boolean;
  upper?: boolean;
  urgent?: boolean;
}) {
  const widthCls = half ? "w-1/2" : wide ? "w-full" : "";
  const textCls = `${truncate ? "truncate " : ""}text-xs ${
    upper ? "font-bold uppercase tracking-tighter" : "font-medium"
  } ${urgent ? "text-error" : "text-on-surface-variant"}`;
  return (
    <div className={`flex items-center gap-2 ${widthCls}`}>
      <span className="material-symbols-outlined text-xs text-outline">
        {icon}
      </span>
      <span className={textCls}>{text}</span>
    </div>
  );
}
