import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/content";

export default async function LocalizedArticleAlias({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}/research/${slug}`);
}
