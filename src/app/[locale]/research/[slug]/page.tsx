import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Clock3, GitBranch } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getUi, readingTime, Locale } from "@/lib/content";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import MarkdownContent from "@/components/MarkdownContent";
import { getDriveContent, getDriveDocument, getDriveDocuments, getDriveSectionLabel } from "@/lib/drive-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> { const { locale: rawLocale, slug } = await params; const locale = getLocale(rawLocale) as Locale; const content = await getDriveContent(); const document = getDriveDocument(content, slug, locale); if (!document) return {}; return { title: document.seo.title, description: document.seo.description }; }

export default async function ResearchPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = getLocale(rawLocale) as Locale;
  const ui = getUi(locale).ui;
  const driveContent = await getDriveContent();
  const document = getDriveDocument(driveContent, slug, locale);
  if (!document) notFound();
  const documents = getDriveDocuments(driveContent, locale);
  const headings = document.content.filter((block) => block.type === "heading");
  const presentation = document.presentation ?? {};
  const shellStyle = {
    backgroundColor: presentation.backgroundColor,
    color: presentation.textColor,
    backgroundImage: assetUrl(presentation.backgroundImage)
      ? `url("${assetUrl(presentation.backgroundImage)}")`
      : undefined,
    "--document-accent": presentation.accentColor,
  } as CSSProperties;
  const articleStyle: CSSProperties = {
    maxWidth: presentation.contentWidth ? `${presentation.contentWidth}px` : undefined,
    fontSize: presentation.fontScale ? `${presentation.fontScale}em` : undefined,
  };
  return <main className="site-shell document-shell" style={shellStyle}><header className="topbar"><Link className="wordmark" href={`/${locale}`}>FIELD / NOTES<span>01</span></Link><div className="document-tools"><LanguageSwitcher locale={locale} slug={document.slug} /><Link className="back-link" href={`/${locale}`}><ArrowLeft size={15} /> {ui.back}</Link><span className="doc-counter">{String(documents.findIndex((item) => item.id === document.id) + 1).padStart(2, "0")} / {String(documents.length).padStart(2, "0")}</span></div></header><div className="document-layout"><aside className="document-aside"><p className="eyebrow">{getDriveSectionLabel(driveContent, document.section, locale)}</p><nav className="toc" aria-label={ui.onPage}><span className="toc-title">{ui.onPage}</span>{headings.map((heading) => <a href={`#${heading.id}`} key={heading.id}>{heading.text}</a>)}</nav><div className="aside-bottom"><span>{ui.updated} {document.updatedAt}</span><span><GitBranch size={14} /> {document.related.length} {ui.connected}</span></div></aside><article className="research-document" style={articleStyle}><div className="document-kicker"><span>{ui.researchNote}</span><span className="status-dot" /> {document.status}</div><h1>{document.title}</h1><p className="document-lede">{document.description}</p><div className="document-meta-line"><span><Clock3 size={15} /> {readingTime(document)} {ui.minutes}</span><span>{document.publishedAt}</span><span>{ui.edited} {document.updatedAt}</span></div><div className="rich-content">{document.content.map((block, index) => { if (block.type === "heading") return <h2 id={block.id} key={index}>{block.text}</h2>; if (block.type === "callout") return <aside className={`callout ${block.tone}`} key={index}><strong>{block.title}</strong><MarkdownContent source={block.text} /></aside>; if (block.type === "code") return <pre key={index}><code>{block.text}</code></pre>; if (block.type === "image") return <figure key={index}><Image src={assetUrl(block.src) ?? "/images/missing-image.svg"} alt={block.alt} width={760} height={480} sizes="(max-width: 760px) 100vw, 760px" /><figcaption>{block.caption}</figcaption></figure>; if (block.type === "divider") return <hr key={index} />; if (block.type === "quote") return <blockquote key={index}><MarkdownContent source={block.text} /></blockquote>; return <MarkdownContent key={index} source={block.text} />; })}</div><section className="related-block"><p className="eyebrow">{ui.continue}</p><div className="related-grid">{document.related.map((id) => { const related = documents.find((item) => item.id === id); return related ? <Link href={`/${locale}/research/${related.slug}`} key={id}><span>{getDriveSectionLabel(driveContent, related.section, locale)}</span><strong>{related.title}</strong><ArrowUpRight size={16} /></Link> : null; })}</div></section><section className="references"><p className="eyebrow">{ui.references}</p>{document.references.map((reference) => <a href={reference.url} target="_blank" rel="noreferrer" key={reference.title}><span>{reference.type}</span><strong>{reference.title}</strong><small>{reference.author}</small><ArrowUpRight size={15} /></a>)}</section></article></div></main>;
}

function assetUrl(value?: string) {
  if (!value) return undefined;
  const clean = value.trim().replace(/^public\//, "").replace(/^\/+/, "");
  if (!clean || clean.includes("..") || !/^[a-zA-Z0-9/_\-.]+$/.test(clean)) return undefined;
  return `/${clean}`;
}
