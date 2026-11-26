import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { InquiryForm } from "@/components/inquiry-form";

export default async function InquiryPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <div className="rounded-3xl border border-pine/10 bg-white p-8 text-sm text-moss">
          Inquiries need a database connection. This environment does not have one configured.
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "visitor";
  if (role !== "visitor") redirect("/profile");

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("inquiry_id, subject, status, created_at")
    .eq("email", user.email ?? "")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="max-w-2xl">
        <p className="eyebrow text-emerald">Visitor enquiries</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-pine sm:text-4xl">
          Send an inquiry
        </h1>
        <p className="mt-3 text-sm leading-7 text-moss">
          Ask about Niah National Park, volunteering, student placements or
          partnerships. Conservation officers review every message.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <InquiryForm
          name={profile?.name ?? user.user_metadata?.name ?? ""}
          email={user.email ?? ""}
        />

        <section className="rounded-3xl border border-pine/10 bg-white p-6">
          <h2 className="text-xl font-semibold text-pine">Your recent inquiries</h2>
          {!inquiries || inquiries.length === 0 ? (
            <p className="mt-4 text-sm text-moss">
              You have not sent any inquiries yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {inquiries.map((inquiry) => (
                <li
                  key={inquiry.inquiry_id}
                  className="rounded-2xl border border-pine/10 bg-cream/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-pine">{inquiry.subject}</p>
                    <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-moss">
                      {inquiry.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-moss">
                    {new Date(inquiry.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
