import Link from "next/link";
import { CategoryList } from "./categoryList";

export default function FaqCategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <Link href="/faqs" className="hover:underline">
            FAQ Management
          </Link>
          {" / Categories"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          FAQ Categories
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
          Categories store title and slug in English, Spanish, and French.
          Images are shared across languages.
        </p>
      </div>
      <CategoryList />
    </div>
  );
}
