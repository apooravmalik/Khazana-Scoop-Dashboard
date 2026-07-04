import {
  createCollectionAction,
  deleteCollectionAction,
  updateCollectionAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { Surface } from "@/components/surface";
import { getCatalogProducts, getCollections } from "@/lib/data";

export default async function CollectionsPage() {
  const [collections, products] = await Promise.all([getCollections(), getCatalogProducts()]);

  return (
    <AppShell
      title="Collections"
      description="Create and maintain curated product groupings for the storefront collections surfaces."
    >
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Surface
          title="Add collection"
          description="Collections power themed storefront sections and can overlap with categories."
        >
          <form action={createCollectionAction} className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Collection name</span>
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
              Collection is active
            </label>
            <SubmitButton
              pendingLabel="Creating collection..."
              className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            >
              Create collection
            </SubmitButton>
          </form>
        </Surface>

        <Surface
          title="Existing collections"
          description="Collections can be reused across multiple products, so each row shows how many current catalog items are linked."
        >
          <div className="space-y-4">
            {collections.length > 0 ? (
              collections.map((collection) => {
                const linkedProducts = products.filter((product) =>
                  product.collections.some((item) => item.id === collection.id),
                ).length;
                return (
                  <div key={collection.id} className="rounded-[1.4rem] border border-stone-200 bg-stone-50/70 p-4">
                    <form action={updateCollectionAction} className="grid gap-4">
                      <input type="hidden" name="collection_id" value={collection.id} />
                      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_120px]">
                        <input
                          type="text"
                          name="name"
                          defaultValue={collection.name}
                          className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                          required
                        />
                        <input
                          type="text"
                          name="slug"
                          defaultValue={collection.slug}
                          className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                        />
                        <input
                          type="number"
                          name="sort_order"
                          min="0"
                          defaultValue={String(collection.sort_order)}
                          className="w-full rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-950"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-3 text-sm text-stone-700">
                          <input type="hidden" name="active" value="false" />
                          <input type="checkbox" name="active" value="true" defaultChecked={collection.active} className="h-4 w-4 rounded border-stone-300 text-stone-950" />
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
                            formAction={deleteCollectionAction}
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
              <p className="text-sm text-stone-500">No collections yet.</p>
            )}
          </div>
        </Surface>
      </section>
    </AppShell>
  );
}
