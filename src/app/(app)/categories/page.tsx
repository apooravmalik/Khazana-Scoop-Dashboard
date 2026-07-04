import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Surface } from "@/components/surface";
import { getCategories, getCatalogProducts } from "@/lib/data";

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([getCategories(), getCatalogProducts()]);

  return (
    <AppShell
      title="Categories"
      description="Control the homepage product groupings that the storefront will use for category-led merchandising."
    >
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Surface
          title="Add category"
          description="Create a new category so products can be grouped into a dedicated storefront section."
        >
          <form action={createCategoryAction} className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Category name</span>
              <input
                type="text"
                name="name"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Slug</span>
              <input
                type="text"
                name="slug"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                placeholder="leave blank to auto-generate"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Sort order</span>
              <input
                type="number"
                name="sort_order"
                min="0"
                defaultValue="0"
                className="w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950"
              />
            </label>
            <label className="flex items-center gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 px-4 py-4 text-sm text-stone-700">
              <input type="hidden" name="active" value="false" />
              <input type="checkbox" name="active" value="true" defaultChecked className="h-4 w-4 rounded border-stone-300 text-stone-950" />
              Category is active
            </label>
            <SubmitButton
              pendingLabel="Creating category..."
              className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            >
              Create category
            </SubmitButton>
          </form>
        </Surface>

        <Surface
          title="Existing categories"
          description="Update names, ordering, and active state without leaving the catalog management flow."
        >
          <div className="space-y-4">
            {categories.length > 0 ? (
              categories.map((category) => {
                const linkedProducts = products.filter((product) => product.category_record?.id === category.id).length;
                return (
                  <div key={category.id} className="rounded-[1.4rem] border border-stone-200 bg-stone-50/70 p-4">
                    <form action={updateCategoryAction} className="grid gap-4">
                      <input type="hidden" name="category_id" value={category.id} />
                      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_120px]">
                        <input
                          type="text"
                          name="name"
                          defaultValue={category.name}
                          className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                          required
                        />
                        <input
                          type="text"
                          name="slug"
                          defaultValue={category.slug}
                          className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                        />
                        <input
                          type="number"
                          name="sort_order"
                          min="0"
                          defaultValue={String(category.sort_order)}
                          className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-3 text-sm text-stone-700">
                          <input type="hidden" name="active" value="false" />
                          <input type="checkbox" name="active" value="true" defaultChecked={category.active} className="h-4 w-4 rounded border-stone-300 text-stone-950" />
                          Active · {linkedProducts} linked product{linkedProducts === 1 ? "" : "s"}
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <SubmitButton
                            pendingLabel="Saving..."
                            className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                          >
                            Save
                          </SubmitButton>
                          <button
                            type="submit"
                            formAction={deleteCategoryAction}
                            className="inline-flex rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-600 hover:bg-rose-600 hover:text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-stone-500">No categories yet.</p>
            )}
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}
