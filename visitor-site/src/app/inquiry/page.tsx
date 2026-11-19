import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/inquiry-form";

export const metadata: Metadata = {
  title: "Inquiry | Plantiful",
  description:
    "Send Sarawak Forestry Corporation's Plantiful team an inquiry — questions, volunteering, student placements, partnerships, or anything else.",
};

export default function InquiryPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="block text-sm font-medium text-emerald hover:underline">
        ← Back to home
      </Link>

      <p className="eyebrow mt-6 text-emerald">Get in touch</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pine">
        Send us an inquiry
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-moss">
        Questions about the park, interested in volunteering as a field
        botanist, a student placement, a partnership, or anything else —
        tell us about it below and someone from the Plantiful team will get
        back to you.
      </p>

      <InquiryForm />
    </div>
  );
}
