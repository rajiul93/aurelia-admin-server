"use client";

import Link from "next/link";
import { FaqList } from "./faqList";

export default function FaqsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">FAQ Management</span>
          {" / "}
          <Link href="/faqs/categories" className="hover:underline">
            Categories
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          FAQs are stored in English, Spanish, and French. End users see the
          language they select in the app.
        </p>
      </div>
      <FaqList />
    </div>
  );
}
