import { KnowledgeList } from "./knowledgeList";

export default function KnowledgePage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
      <p className="text-muted-foreground text-sm">
        Manage the Aurelia Assistant&apos;s knowledge and the app&apos;s
        informational and legal pages.
      </p>
      <KnowledgeList />
    </div>
  );
}
