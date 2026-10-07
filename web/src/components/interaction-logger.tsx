"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { reportInteraction } from "@/lib/interactionLog";

function describe(node: EventTarget | null): string {
  if (!(node instanceof Element)) return "page";
  const interactive = node.closest(
    'button, a[href], [role="button"], [role="link"], [role="tab"], [role="menuitem"], input, select, textarea, summary, label, [onclick]'
  );
  const el = (interactive ?? node) as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (tag === "canvas") return "map canvas";
  if (tag === "a") return `link "${text}" -> ${el.getAttribute("href") ?? "?"}`;
  if (tag === "input") {
    const input = el as HTMLInputElement;
    const id = input.name || input.id || "";
    if (input.type === "submit" || input.type === "button") {
      return `button "${input.value || id}"`;
    }
    if (input.type === "checkbox" || input.type === "radio") {
      return `${input.type} "${id}" ${input.checked ? "checked" : "unchecked"}`;
    }
    return `input ${input.type} "${id}"`;
  }
  if (tag === "select") return `select "${el.getAttribute("name") ?? el.id}"`;
  if (tag === "label") return `label "${text}"`;
  return `${tag} "${text || "(no text)"}"`;
}

export function InteractionLogger() {
  const pathname = usePathname();

  useEffect(() => {
    reportInteraction(`nav ${pathname}`);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      // clicking a <label> forwards a synthetic click (detail 0) to its input
      if (target instanceof HTMLInputElement && event.detail === 0) return;
      reportInteraction(`click ${describe(target)}`);
    };
    const onSubmit = (event: SubmitEvent) => {
      reportInteraction(`submit ${describe(event.submitter ?? event.target)}`);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return null;
}
