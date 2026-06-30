
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopCategory } from "../types/analytics.types";

/* -------------------------------------------------------------------------- */
/* Types                                                                     */
/* -------------------------------------------------------------------------- */

interface TopCategoriesCardProps {
  categories?: TopCategory[];
}

/* -------------------------------------------------------------------------- */
/* Component                                                                */
/* -------------------------------------------------------------------------- */

export default function TopCategoriesCard({
  categories = [],
}: TopCategoriesCardProps) {
  const isEmpty = categories.length === 0;

  return (
    <Card className="rounded-2xl border border-border/50 bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Top Categories
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {isEmpty ? (
          <EmptyState />
        ) : (
          categories.map((category) => (
            <CategoryRow key={category.name} category={category} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty State                                                             */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground py-6 text-center">
      No category data available
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Row Component                                                           */
/* -------------------------------------------------------------------------- */

function CategoryRow({ category }: { category: TopCategory }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3 hover:bg-muted/30 transition">
      <span className="font-medium text-sm">{category.name}</span>

      <span className="text-xs font-medium text-muted-foreground">
        {category.count.toLocaleString()} tickets
      </span>
    </div>
  );
}