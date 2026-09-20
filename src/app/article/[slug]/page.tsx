import { redirect } from "next/navigation";

export default async function ArticleAlias({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/en/research/${slug}`);
}
