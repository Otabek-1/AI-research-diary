import Link from "next/link";
import { Locale, locales } from "@/lib/content";

export function LanguageSwitcher({ locale, slug }: { locale: Locale; slug?: string }) {
  return <div className="language-switcher" aria-label="Language"><span>LANG</span>{locales.map((code) => <Link className={code === locale ? "active" : ""} href={slug ? `/${code}/research/${slug}` : `/${code}`} key={code}>{code.toUpperCase()}</Link>)}</div>;
}
