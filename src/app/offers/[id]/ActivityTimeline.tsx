import { formatDateTime, formatDelta } from "@/lib/format";

type Person = { name: string; department: string };

type Props = {
  postedAt: Date;
  postedBy: Person;
  claim: {
    createdAt: Date;
    completedAt: Date | null;
    updatedAt: Date;
    status: string;
    notes: string | null;
    claimingUser: Person;
  } | null;
  offerStatus: string;
  scrappedAt: Date | null;
  offerUpdatedAt: Date;
  estimatedValue: number;
};

export function ActivityTimeline({
  postedAt,
  postedBy,
  claim,
  offerStatus,
  scrappedAt,
  offerUpdatedAt,
  estimatedValue,
}: Props) {
  const isCompleted = offerStatus === "COMPLETED";
  const isScrapped = offerStatus === "SCRAPPED";
  // Legacy fallbacks (pre-migration rows): use updatedAt if the dedicated
  // timestamp column is null.
  const receivedAt = isCompleted && claim
    ? (claim.completedAt ?? claim.updatedAt)
    : null;
  const scrapEventAt = isScrapped ? (scrappedAt ?? offerUpdatedAt) : null;

  const showClaimed = !!claim;
  const showAwaitingReceipt = showClaimed && !isCompleted && !isScrapped;
  const postedIsLast = !showClaimed && !isScrapped;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-gray-900">Activity</h2>
      <ol className="space-y-0">
        <Event
          icon="upload"
          title="Posted"
          person={postedBy}
          when={postedAt}
          tone="done"
          isLast={postedIsLast}
        />

        {claim && (
          <Event
            icon="check_circle"
            title="Claimed"
            person={claim.claimingUser}
            when={claim.createdAt}
            since={postedAt}
            notes={claim.notes}
            tone="done"
            isLast={!isCompleted && !isScrapped && !showAwaitingReceipt}
          />
        )}

        {claim && isCompleted && receivedAt && (
          <Event
            icon="verified"
            title="Received"
            when={receivedAt}
            since={claim.createdAt}
            footer={
              estimatedValue > 0 ? (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-900">
                  <span className="material-symbols-outlined text-[13px]">
                    savings
                  </span>
                  ₪{estimatedValue.toLocaleString()} saved from scrap
                </span>
              ) : null
            }
            tone="done"
            isLast
          />
        )}

        {isScrapped && scrapEventAt && (
          <Event
            icon="delete"
            title="Scrapped"
            person={postedBy}
            when={scrapEventAt}
            since={claim?.createdAt ?? postedAt}
            tone="scrapped"
            isLast
          />
        )}

        {showAwaitingReceipt && claim && (
          <Event
            icon="schedule"
            title="Awaiting receipt"
            since={claim.createdAt}
            tone="pending"
            isLast
          />
        )}
      </ol>
    </div>
  );
}

type Tone = "done" | "pending" | "scrapped";

function Event({
  icon,
  title,
  person,
  when,
  since,
  notes,
  footer,
  tone,
  isLast,
}: {
  icon: string;
  title: string;
  person?: Person;
  when?: Date;
  since?: Date;
  notes?: string | null;
  footer?: React.ReactNode;
  tone: Tone;
  isLast: boolean;
}) {
  const line =
    tone === "scrapped"
      ? "bg-gray-400"
      : tone === "done"
        ? "bg-green-300"
        : "bg-gray-200";
  const circle =
    tone === "scrapped"
      ? "bg-gray-500 text-white"
      : tone === "done"
        ? "bg-green-500 text-white"
        : "border-2 border-dashed border-gray-300 bg-white text-gray-400";

  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px ${line}`}
        />
      )}
      <div
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${circle}`}
      >
        <span className="material-symbols-outlined text-base">{icon}</span>
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        {person && (
          <p className="text-xs text-gray-600">
            {person.name} · {person.department}
          </p>
        )}
        {when && (
          <p className="mt-0.5 text-xs text-gray-500">
            {formatDateTime(when)}
            {since && (
              <span className="ml-1.5 text-gray-400">
                · {formatDelta(since, when)}
              </span>
            )}
          </p>
        )}
        {notes && (
          <p className="mt-1.5 rounded bg-gray-50 px-2 py-1 text-xs italic text-gray-700">
            “{notes}”
          </p>
        )}
        {footer}
      </div>
    </li>
  );
}
