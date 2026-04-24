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
  estimatedValue: number;
};

export function ActivityTimeline({
  postedAt,
  postedBy,
  claim,
  offerStatus,
  estimatedValue,
}: Props) {
  const isCompleted = offerStatus === "COMPLETED";
  // Legacy completed claims (pre-completedAt column) fall back to updatedAt.
  const receivedAt = isCompleted && claim
    ? (claim.completedAt ?? claim.updatedAt)
    : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-gray-900">Activity</h2>
      <ol className="space-y-0">
        <Event
          icon="upload"
          title="Posted"
          person={postedBy}
          when={postedAt}
          done
          isLast={!claim}
        />

        {claim && (
          <Event
            icon="check_circle"
            title="Claimed"
            person={claim.claimingUser}
            when={claim.createdAt}
            since={postedAt}
            notes={claim.notes}
            done
            isLast={!isCompleted}
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
            done
            isLast
          />
        )}

        {claim && !isCompleted && (
          <Event
            icon="schedule"
            title="Awaiting receipt"
            since={claim.createdAt}
            done={false}
            isLast
          />
        )}
      </ol>
    </div>
  );
}

function Event({
  icon,
  title,
  person,
  when,
  since,
  notes,
  footer,
  done,
  isLast,
}: {
  icon: string;
  title: string;
  person?: Person;
  when?: Date;
  since?: Date;
  notes?: string | null;
  footer?: React.ReactNode;
  done: boolean;
  isLast: boolean;
}) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!isLast && (
        <span
          aria-hidden
          className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px ${
            done ? "bg-green-300" : "bg-gray-200"
          }`}
        />
      )}
      <div
        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-green-500 text-white" : "border-2 border-dashed border-gray-300 bg-white text-gray-400"
        }`}
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
