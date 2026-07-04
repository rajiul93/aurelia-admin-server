import { FaqList } from "./faqList";

export default function FaqsPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Faq Management</h1>
      <p className="text-muted-foreground text-sm">
        Manage frequently asked questions and answers for staff-managed content.
      </p>
      <FaqList />
    </div>
  );
}
