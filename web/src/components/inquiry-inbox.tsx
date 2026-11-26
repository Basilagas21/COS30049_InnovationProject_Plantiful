"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInquiryStatus } from "@/app/admin/inquiries/actions";
import type { Inquiry, InquiryStatus } from "@/lib/inquiries";
import {
  InquiryArchiveButton,
  InquiryStatusButtons,
} from "@/components/inquiry-status-buttons";

type InboxFilter = "active" | "archived" | "all";

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
];

const STATUS_BADGE: Record<InquiryStatus, string> = {
  new: "bg-chartreuse text-pine",
  read: "bg-sprout text-emerald",
  archived: "bg-sand text-moss",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type Props = {
  inquiries: Inquiry[];
};

export function InquiryInbox({ inquiries }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<InboxFilter>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMarking, startMarking] = useTransition();
  const [readError, setReadError] = useState<string | null>(null);
  const markedRef = useRef<Set<string>>(new Set());
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const selected = inquiries.find((inquiry) => inquiry.id === selectedId) ?? null;
  const selectedStatus = selected?.status;
  const activeCount = inquiries.filter((item) => item.status !== "archived").length;
  const archivedCount = inquiries.filter((item) => item.status === "archived").length;

  const visible = inquiries.filter((inquiry) => {
    if (filter === "active") return inquiry.status !== "archived";
    if (filter === "archived") return inquiry.status === "archived";
    return true;
  });

  const close = useCallback(() => setSelectedId(null), []);

  function open(inquiry: Inquiry) {
    setReadError(null);
    setSelectedId(inquiry.id);
  }

  useEffect(() => {
    if (selectedId) closeButtonRef.current?.focus();
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, close]);

  useEffect(() => {
    if (!selectedId) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || selectedStatus !== "new") return;
    if (markedRef.current.has(selectedId)) return;
    markedRef.current.add(selectedId);
    setReadError(null);
    startMarking(async () => {
      const result = await setInquiryStatus(selectedId, "read");
      if (!result.ok) {
        markedRef.current.delete(selectedId);
        setReadError(result.error ?? "Could not mark this inquiry as read.");
        return;
      }
      router.refresh();
    });
  }, [selectedId, selectedStatus, router]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter inquiries"
          className="inline-flex rounded-full border border-pine/10 bg-white p-1"
        >
          {FILTERS.map(({ key, label }) => {
            const isActive = filter === key;
            const count =
              key === "active"
                ? activeCount
                : key === "archived"
                  ? archivedCount
                  : inquiries.length;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(key)}
                className={`min-h-11 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:min-h-0 ${
                  isActive
                    ? "bg-pine text-cream"
                    : "text-moss hover:bg-sprout hover:text-emerald"
                }`}
              >
                {label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-moss">Showing {visible.length} on this page</p>
      </div>

      <p className="mt-3 rounded-xl bg-sand/60 px-4 py-3 text-xs leading-5 text-moss">
        Archive hides an inquiry from the Active view. The message is kept in the
        database and can be restored from the Archived view. Use Archive for
        messages that are handled, not for messages that should be deleted.
      </p>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-pine/15 bg-sand/60 px-6 py-10 text-center text-sm text-moss">
          {filter === "archived"
            ? "No archived inquiries on this page."
            : filter === "active"
              ? "No active inquiries on this page."
              : "No inquiries on this page."}
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((inquiry) => (
            <li
              key={inquiry.id}
              className="relative flex h-full flex-col rounded-2xl border border-pine/10 bg-white p-5 transition-colors hover:border-emerald/40 hover:bg-sprout/30"
            >
              <button
                type="button"
                onClick={() => open(inquiry)}
                aria-label={`Read inquiry: ${inquiry.subject}`}
                className="absolute inset-0 z-0 rounded-2xl"
              />
              <div className="pointer-events-none relative z-10 flex h-full flex-col">
                <p className="min-w-0 break-words font-semibold leading-snug text-pine">
                  {inquiry.subject}
                </p>
                <div className="mt-3 border-t border-pine/10 pt-3 text-sm">
                  <p className="font-medium text-pine">{inquiry.name}</p>
                  <p className="mt-0.5 break-all text-xs text-moss">
                    {inquiry.email}
                  </p>
                </div>
                <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                  <p className="text-xs text-moss/70">{formatDate(inquiry.createdAt)}</p>
                  <div className="pointer-events-auto">
                    <InquiryArchiveButton inquiryId={inquiry.id} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            role="presentation"
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-forest-night/60"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-detail-title"
            className="relative z-50 flex h-full w-full max-w-lg flex-col border-l border-pine/10 bg-surface shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-pine/10 px-6 py-5">
              <div className="min-w-0">
                <p className="eyebrow text-emerald">Inquiry detail</p>
                <h2
                  id="inquiry-detail-title"
                  className="mt-1 break-words text-xl font-bold text-pine"
                >
                  {selected.subject}
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="Close inquiry"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-moss transition-colors hover:bg-sand hover:text-pine"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <dl className="space-y-5">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-moss/70">
                    From
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-pine">{selected.name}</dd>
                  <dd className="mt-0.5 text-sm">
                    <a
                      href={`mailto:${selected.email}`}
                      className="break-all text-emerald hover:underline"
                    >
                      {selected.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-moss/70">
                    Received
                  </dt>
                  <dd className="mt-1 text-sm text-moss">
                    {formatDate(selected.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-moss/70">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[selected.status] ?? "bg-sand text-moss"
                      }`}
                    >
                      {selected.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-moss/70">
                    Message
                  </dt>
                  <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-pine">
                    {selected.message}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-pine/10 px-6 py-5">
              {readError && (
                <p role="alert" className="mb-3 text-xs text-danger">
                  {readError}
                </p>
              )}
              {isMarking && (
                <p className="mb-3 text-xs text-moss">Marking as read…</p>
              )}
              <InquiryStatusButtons inquiryId={selected.id} status={selected.status} />
              <p className="mt-3 text-xs leading-5 text-moss/70">
                Archiving hides this inquiry from the active inbox but keeps the
                record. You can restore it at any time from the Archived filter.
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
