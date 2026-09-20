import { notFound } from "next/navigation";
import LocalizedHome from "@/components/LocalizedHome";
import { isLocale, locales } from "@/lib/content";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LocalizedHome locale={locale} />;
}
