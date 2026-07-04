import { createProductAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { CatalogProductForm } from "@/components/catalog-product-form";
import { Surface } from "@/components/surface";
import { getCategories, getCollections } from "@/lib/data";

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([getCategories(), getCollections()]);

  return (
    <AppShell
      title="Add catalog product"
      description="Create a storefront-ready product with pricing, category placement, collection assignments, image URLs, colours, and opening stock."
    >
      <Surface
        title="New product"
        description="This creates the inventory record and the richer storefront catalog fields in one flow."
      >
        <CatalogProductForm
          action={createProductAction}
          categories={categories}
          collections={collections}
          submitLabel="Create product"
          pendingLabel="Creating product..."
        />
      </Surface>
    </AppShell>
  );
}
