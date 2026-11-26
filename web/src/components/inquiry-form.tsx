"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  name: string;
  email: string;
};

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function InquiryForm({ name, email }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!subject.trim() || !message.trim() || !EMAIL_PATTERN.test(email)) {
      setError("Please add a subject, a message and a valid account email.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("inquiries").insert({
        name: name || email.split("@")[0],
        email,
        subject: subject.trim(),
        message: message.trim(),
        status: "new",
      });

      if (error) {
        setError("We could not save your inquiry. Please try again shortly.");
        return;
      }

      setSubject("");
      setMessage("");
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-pine/10 bg-white p-6">
      <h2 className="text-lg font-semibold text-pine">New inquiry</h2>
      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-pine">Subject</span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={200}
            required
            className="field-input"
            placeholder="Question about Niah National Park"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-pine">Message</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={4000}
            required
            rows={7}
            className="field-input min-h-40"
            placeholder="Tell us what you would like to know."
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-4 text-sm font-semibold text-emerald">
          Inquiry sent. A conservation officer will review it.
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn--primary mt-5">
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
