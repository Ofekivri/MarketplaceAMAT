"use client";

import { useState } from "react";
import Link from "next/link";

export type MonthBucket = { label: string; posted: number; claimed: number };
export type Category = { name: string; amt: number; pct: number };
export type Badge = {
  key: string;
  name: string;
  desc: string;
  icon: string;
  earned: boolean;
  earnedLabel?: string;
};
export type ActivityItem = {
  type: "post" | "claim";
  title: string;
  from: string;
  val: string;
  when: string;
};

export type MyImpactData = {
  valueRehomed: number;
  valueDeltaQuarter: number;
  postedCount: number;
  postedAvailable: number;
  postedClaimed: number;
  postedCompleted: number;
  postedExpired: number;
  claimedCount: number;
  claimedMultiplier: number | null;
  kgDiverted: number;
  rank: number | null;
  rankTotal: number;
  months: MonthBucket[];
  categories: Category[];
  badges: Badge[];
  timeline: ActivityItem[];
};

type Range = "3m" | "6m" | "12m" | "all";

export function MyImpactClient({ data }: { data: MyImpactData }) {
  const [range, setRange] = useState<Range>("12m");

  const months =
    range === "3m"
      ? data.months.slice(-3)
      : range === "6m"
        ? data.months.slice(-6)
        : data.months;
  const maxBar = Math.max(
    1,
    ...months.flatMap((m) => [m.posted, m.claimed]),
  );
  const maxCat = data.categories[0]?.pct ?? 1;

  const deltaSign = data.valueDeltaQuarter >= 0 ? "↑" : "↓";
  const deltaColor =
    data.valueDeltaQuarter >= 0 ? "var(--avail)" : "var(--warn)";

  return (
    <div className="my-impact">
      <style jsx global>{`
        .my-impact {
          --bg: #f6f7f9;
          --surface: #ffffff;
          --surface-2: #fbfbfc;
          --line: #e8eaef;
          --line-2: #eef0f4;
          --ink-1: #0f1420;
          --ink-2: #3a4050;
          --ink-3: #6b7386;
          --ink-4: #9aa1b2;
          --ink-5: #c8cdd8;
          --brand: #3a4ee5;
          --brand-50: #eef0ff;
          --brand-100: #dfe3ff;
          --avail: #0d8f6a;
          --avail-50: #e6f5ef;
          --avail-100: #cfeadf;
          --warn: #c65a00;
          --warn-50: #fff2e6;
          color: var(--ink-1);
          font-size: 14px;
        }
        .my-impact .hero {
          background: linear-gradient(
            135deg,
            #0f1420 0%,
            #1a2242 60%,
            #0d4d3a 130%
          );
          color: white;
          border-radius: 16px;
          padding: 32px 36px;
          position: relative;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .my-impact .hero::after {
          content: "";
          position: absolute;
          right: -80px;
          top: -80px;
          width: 280px;
          height: 280px;
          background: radial-gradient(
            circle,
            rgba(13, 143, 106, 0.35) 0%,
            transparent 70%
          );
          pointer-events: none;
        }
        .my-impact .hero-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.55);
        }
        .my-impact .hero-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin: 8px 0 6px;
          max-width: 640px;
        }
        .my-impact .hero-title b {
          color: #5ee0b7;
          font-weight: 700;
        }
        .my-impact .hero-sub {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.7);
          max-width: 560px;
          line-height: 1.5;
        }
        .my-impact .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          padding: 8px 14px 8px 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 500;
          backdrop-filter: blur(6px);
        }
        .my-impact .hero-badge .rank-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #5ee0b7;
          color: #0f1420;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 700;
        }

        .my-impact .kpi-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 800px) {
          .my-impact .kpi-row {
            grid-template-columns: 1fr;
          }
        }
        .my-impact .kpi {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .my-impact .kpi-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-3);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .my-impact .kpi-val {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          margin-top: 4px;
        }
        .my-impact .kpi-sub {
          font-size: 11.5px;
          color: var(--ink-3);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .my-impact .kpi-sub .delta {
          font-weight: 600;
        }

        .my-impact .section {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px 22px;
          margin-bottom: 16px;
        }
        .my-impact .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .my-impact .section-head h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.005em;
          color: var(--ink-1);
        }
        .my-impact .section-head p {
          margin: 2px 0 0;
          font-size: 12.5px;
          color: var(--ink-3);
        }

        .my-impact .toggle-group {
          display: flex;
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 3px;
        }
        .my-impact .toggle-group button {
          border: none;
          background: transparent;
          font-size: 11.5px;
          color: var(--ink-3);
          padding: 5px 10px;
          border-radius: 5px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
        }
        .my-impact .toggle-group button.active {
          background: var(--surface);
          color: var(--ink-1);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          font-weight: 600;
        }

        .my-impact .bars {
          display: grid;
          gap: 8px;
          align-items: end;
          height: 160px;
          padding: 0 4px;
        }
        .my-impact .bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .my-impact .bar {
          width: 100%;
          border-radius: 5px 5px 2px 2px;
          position: relative;
          cursor: pointer;
          min-height: 2px;
        }
        .my-impact .bar.posted {
          background: linear-gradient(180deg, var(--brand) 0%, #5c6df0 100%);
        }
        .my-impact .bar.claimed {
          background: linear-gradient(180deg, var(--avail) 0%, #37b792 100%);
        }
        .my-impact .bar-label {
          font-size: 10.5px;
          color: var(--ink-4);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .my-impact .bar:hover::before {
          content: attr(data-val);
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--ink-1);
          color: white;
          font-size: 11px;
          padding: 3px 7px;
          border-radius: 5px;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
          font-weight: 500;
          z-index: 1;
        }
        .my-impact .legend {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--ink-2);
        }
        .my-impact .legend-swatch {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .my-impact .legend-swatch i {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }

        .my-impact .cat-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .my-impact .cat-row {
          display: grid;
          grid-template-columns: 160px 1fr 90px;
          align-items: center;
          gap: 14px;
          font-size: 12.5px;
        }
        .my-impact .cat-name {
          color: var(--ink-2);
          font-weight: 500;
        }
        .my-impact .cat-bar {
          height: 8px;
          border-radius: 4px;
          background: var(--line-2);
          overflow: hidden;
        }
        .my-impact .cat-bar-fill {
          height: 100%;
          border-radius: 4px;
          background: var(--brand);
        }
        .my-impact .cat-val {
          text-align: right;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: var(--ink-1);
        }

        .my-impact .badges {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 800px) {
          .my-impact .badges {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .my-impact .badge {
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 18px 14px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
          background: var(--surface);
          position: relative;
          min-height: 160px;
        }
        .my-impact .badge-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--ink-1);
          line-height: 1.3;
        }
        .my-impact .badge-desc {
          font-size: 11px;
          color: var(--ink-3);
          line-height: 1.4;
          margin-top: -4px;
        }
        .my-impact .badge-earned-tag {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--avail);
          margin-top: auto;
        }
        .my-impact .badge.earned {
          border-color: var(--avail-100);
          background: linear-gradient(180deg, var(--avail-50) 0%, white 60%);
        }
        .my-impact .badge.locked {
          opacity: 0.55;
        }
        .my-impact .badge-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: var(--line-2);
          color: var(--ink-3);
        }
        .my-impact .badge.earned .badge-icon {
          background: var(--avail);
          color: white;
        }
        .my-impact .badge-icon .material-symbols-outlined {
          font-size: 22px;
        }

        .my-impact .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .my-impact .timeline-item {
          display: grid;
          grid-template-columns: 28px 1fr auto;
          gap: 12px;
          padding: 10px 0;
          align-items: center;
        }
        .my-impact .timeline-item + .timeline-item {
          border-top: 1px solid var(--line-2);
        }
        .my-impact .timeline-dot {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: var(--surface-2);
          color: var(--ink-3);
        }
        .my-impact .timeline-dot.post {
          background: var(--brand-50);
          color: var(--brand);
        }
        .my-impact .timeline-dot.claim {
          background: var(--avail-50);
          color: var(--avail);
        }
        .my-impact .timeline-dot .material-symbols-outlined {
          font-size: 16px;
        }
        .my-impact .timeline-body {
          font-size: 13px;
          color: var(--ink-2);
        }
        .my-impact .timeline-body b {
          color: var(--ink-1);
          font-weight: 600;
        }
        .my-impact .timeline-meta {
          font-size: 11.5px;
          color: var(--ink-3);
          margin-top: 1px;
        }
        .my-impact .timeline-val {
          font-size: 12px;
          color: var(--ink-2);
          font-variant-numeric: tabular-nums;
          font-weight: 500;
        }

        .my-impact .view-all {
          border: 1px solid var(--line);
          background: transparent;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: var(--ink-2);
          font-family: inherit;
          cursor: pointer;
        }

        .my-impact .empty {
          font-size: 13px;
          color: var(--ink-3);
          padding: 12px 0;
        }

        .my-impact .kpi-label .material-symbols-outlined,
        .my-impact .hero-badge .material-symbols-outlined {
          font-size: 14px;
        }
      `}</style>

      <div className="hero">
        <div className="hero-eyebrow">Your impact · Fiscal year to date</div>
        <div className="hero-title">
          You&apos;ve kept{" "}
          <b>${data.valueRehomed.toLocaleString()}</b> worth of equipment out of
          the landfill.
        </div>
        <div className="hero-sub">
          By posting {data.postedCount} item{data.postedCount === 1 ? "" : "s"}{" "}
          and claiming {data.claimedCount}, you&apos;ve diverted the equivalent
          of ~{data.kgDiverted} kg of waste and saved your department money
          that never had to be spent.
        </div>
        {data.rank && (
          <div className="hero-badge">
            <span className="rank-dot">{data.rank}</span>
            Rank {data.rank} of {data.rankTotal} contributors this quarter
          </div>
        )}
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">
            <span className="material-symbols-outlined">attach_money</span>
            Value rehomed
          </div>
          <div className="kpi-val">${data.valueRehomed.toLocaleString()}</div>
          <div className="kpi-sub">
            <span className="delta" style={{ color: deltaColor }}>
              {deltaSign} ${Math.abs(data.valueDeltaQuarter).toLocaleString()}
            </span>{" "}
            vs last quarter
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            <span className="material-symbols-outlined">
              volunteer_activism
            </span>
            Items posted
          </div>
          <div className="kpi-val">{data.postedCount}</div>
          <div className="kpi-sub">
            {data.postedClaimed + data.postedCompleted} claimed ·{" "}
            {data.postedAvailable} active · {data.postedExpired} expired
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            <span className="material-symbols-outlined">recycling</span>
            Items claimed
          </div>
          <div className="kpi-val">{data.claimedCount}</div>
          <div className="kpi-sub">
            {data.claimedMultiplier !== null && (
              <>
                <span className="delta" style={{ color: "var(--avail)" }}>
                  {data.claimedMultiplier.toFixed(1)}×
                </span>{" "}
                department average
              </>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h2>Your activity over time</h2>
            <p>
              Items you&apos;ve posted vs. items you&apos;ve claimed, month by
              month.
            </p>
          </div>
          <div className="toggle-group" role="tablist">
            {(["3m", "6m", "12m", "all"] as Range[]).map((r) => (
              <button
                key={r}
                className={range === r ? "active" : ""}
                onClick={() => setRange(r)}
              >
                {r === "all" ? "All" : r}
              </button>
            ))}
          </div>
        </div>
        <div
          className="bars"
          style={{
            gridTemplateColumns: `repeat(${months.length}, 1fr)`,
          }}
        >
          {months.map((m) => (
            <div key={m.label} className="bar-col">
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  alignItems: "end",
                  width: "100%",
                  height: 130,
                }}
              >
                <div
                  className="bar posted"
                  data-val={`${m.posted} posted`}
                  style={{
                    height: `${(m.posted / maxBar) * 100}%`,
                    flex: 1,
                  }}
                />
                <div
                  className="bar claimed"
                  data-val={`${m.claimed} claimed`}
                  style={{
                    height: `${(m.claimed / maxBar) * 100}%`,
                    flex: 1,
                  }}
                />
              </div>
              <div className="bar-label">{m.label}</div>
            </div>
          ))}
        </div>
        <div
          className="legend"
          style={{ marginTop: 16, justifyContent: "center" }}
        >
          <span className="legend-swatch">
            <i
              style={{
                background: "linear-gradient(180deg,var(--brand),#5c6df0)",
              }}
            />
            Posted
          </span>
          <span className="legend-swatch">
            <i
              style={{
                background: "linear-gradient(180deg,var(--avail),#37b792)",
              }}
            />
            Claimed
          </span>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h2>Where your value went</h2>
            <p>Breakdown by category of $ you&apos;ve diverted.</p>
          </div>
        </div>
        {data.categories.length === 0 ? (
          <div className="empty">
            No diverted items yet. Once you post or claim items, the categories
            will appear here.
          </div>
        ) : (
          <div className="cat-list">
            {data.categories.map((c) => (
              <div key={c.name} className="cat-row">
                <div className="cat-name">{c.name}</div>
                <div className="cat-bar">
                  <div
                    className="cat-bar-fill"
                    style={{ width: `${(c.pct / maxCat) * 100}%` }}
                  />
                </div>
                <div className="cat-val">${c.amt.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h2>Milestones</h2>
            <p>Earn badges as you contribute to the circular economy.</p>
          </div>
        </div>
        <div className="badges">
          {data.badges.map((b) => (
            <div
              key={b.key}
              className={`badge ${b.earned ? "earned" : "locked"}`}
            >
              <div className="badge-icon">
                <span className="material-symbols-outlined">{b.icon}</span>
              </div>
              <div className="badge-name">{b.name}</div>
              <div className="badge-desc">{b.desc}</div>
              {b.earned && b.earnedLabel && (
                <div className="badge-earned-tag">Earned {b.earnedLabel}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <h2>Recent activity</h2>
            <p>Every post and claim you&apos;ve made, newest first.</p>
          </div>
          <Link href="/my-offers" className="view-all">
            View all
          </Link>
        </div>
        {data.timeline.length === 0 ? (
          <div className="empty">
            No activity yet — post or claim an item to get started.
          </div>
        ) : (
          <div className="timeline">
            {data.timeline.map((a, i) => (
              <div key={i} className="timeline-item">
                <div className={`timeline-dot ${a.type}`}>
                  <span className="material-symbols-outlined">
                    {a.type === "post" ? "volunteer_activism" : "recycling"}
                  </span>
                </div>
                <div>
                  <div className="timeline-body">{a.title}</div>
                  <div className="timeline-meta">
                    {a.from} · {a.when}
                  </div>
                </div>
                <div className="timeline-val">{a.val}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
