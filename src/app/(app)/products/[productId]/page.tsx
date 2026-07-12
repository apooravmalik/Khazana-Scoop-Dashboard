import { redirect } from "next/navigation";

type ProductRedirectPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductRedirectPage({ params }: ProductRedirectPageProps) {
  const { productId } = await params;
  redirect(`/stock/${productId}`);
}
