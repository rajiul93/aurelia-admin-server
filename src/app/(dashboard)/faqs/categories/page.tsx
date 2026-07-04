import { CategoryList } from "./categoryList";

export default function FaqCategoriesPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">
        FAQ Category Management
      </h1>
      <p className="text-muted-foreground text-sm">
        Create, update, and delete FAQ categories with title, slug, and image.
      </p>
      <CategoryList />
    </div>
  );
}
