"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "sent" | "error";

export function InquiryForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("Please fill in every field so we can get back to you.");
      return;
    }

    setError(null);
    setStatus("submitting");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const body: { ok: boolean; error?: string } = await res.json();

      if (!res.ok || !body.ok) {
        setStatus("error");
        setError(body.error || "We couldn't send your inquiry just now. Please try again shortly.");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setError("We couldn't reach the server. Please check your connection and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl bg-sprout p-6 text-center sm:p-8">
        <p className="text-lg font-semibold text-pine">Thanks, {name.split(" ")[0] || "there"}.</p>
        <p className="mt-2 text-sm leading-6 text-moss">
          We&apos;ve received your inquiry about &ldquo;{subject}&rdquo; and someone from the
          Plantiful team will get back to you at {email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-1">
        <span className="font-medium text-pine">Full name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          disabled={status === "submitting"}
          className="h-11 rounded-xl border border-pine/15 bg-cream px-4 text-sm outline-none transition-colors focus:border-emerald disabled:opacity-60"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-1">
        <span className="font-medium text-pine">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={status === "submitting"}
          className="h-11 rounded-xl border border-pine/15 bg-cream px-4 text-sm outline-none transition-colors focus:border-emerald disabled:opacity-60"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium text-pine">Subject</span>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="What's this about?"
          disabled={status === "submitting"}
          className="h-11 rounded-xl border border-pine/15 bg-cream px-4 text-sm outline-none transition-colors focus:border-emerald disabled:opacity-60"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium text-pine">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Tell us what you'd like to know or get involved with"
          disabled={status === "submitting"}
          className="rounded-xl border border-pine/15 bg-cream px-4 py-3 text-sm outline-none transition-colors focus:border-emerald disabled:opacity-60"
        />
      </label>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger sm:col-span-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="h-12 rounded-full bg-emerald px-8 font-semibold text-cream transition-colors hover:bg-pine disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2 sm:w-fit"
      >
        {status === "submitting" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
