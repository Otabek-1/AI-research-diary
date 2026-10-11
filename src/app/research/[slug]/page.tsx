import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock3, GitBranch } from "lucide-react";
import { notFound } from "next/navigation";
import { formatDate, getUi, readingTime } from "@/lib/content";
import MarkdownContent from "@/components/MarkdownContent";
import { ReadingProgress, Toc } from "@/components/DocumentChrome";
import { SiteFooter } from "@/components/SiteHeader";
import { getDriveContent, getDriveDocument, getDriveDocuments, getDriveSectionLabel } from "@/lib/drive-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let document;
  try {
    document = getDriveDocument(await getDriveContent(), slug);
  } catch {
    return {};
  }
  if (!document) return {};
  const title = document.seo?.title || document.title;
  const description = document.seo?.description || document.description;
  const url = `${siteOrigin()}/research/${encodeURIComponent(document.slug)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", siteName: "AI Field Notes" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ResearchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const driveContent = await getDriveContent();
  const document = getDriveDocument(driveContent, slug);
  if (!document) notFound();

  const ui = getUi().ui;
  const documents = getDriveDocuments(driveContent);
  const position = documents.findIndex((item) => item.id === document.id);
  const previous = position > 0 ? documents[position - 1] : undefined;
  const next = position >= 0 && position < documents.length - 1 ? documents[position + 1] : undefined;
  const headings = document.content
    .filter((block): block is Extract<typeof block, { type: "heading" }> => block.type === "heading")
    .map((block) => ({ id: block.id, text: block.text, level: block.level }));
  const related = document.related
    .map((id) => documents.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const references = document.references ?? [];
  const presentation = document.presentation ?? {};
  const background = assetUrl(presentation.backgroundImage);

  const shellStyle = {
    backgroundColor: presentation.backgroundColor,
    color: presentation.textColor,
    backgroundImage: background ? `url("${background}")` : undefined,
    "--document-accent": presentation.accentColor,
    "--doc-bg": presentation.backgroundColor,
  } as CSSProperties;
  const articleStyle: CSSProperties = {
    maxWidth: presentation.contentWidth ? `${presentation.contentWidth}px` : undefined,
    fontSize: presentation.fontScale ? `${presentation.fontScale}em` : undefined,
  };

  return (
    <div className={`site document-shell${background ? " has-background" : ""}`} style={shellStyle}>
      <ReadingProgress />
      <header className="site-header is-document">
        <div className="site-header-inner">
          <Link className="wordmark" href="/">
            <span className="wordmark-mark" aria-hidden="true" />
            FIELD / NOTES<span className="wordmark-tag">01</span>
          </Link>
          <div className="document-tools">
            <Link className="back-link" href="/#archive">
              <ArrowLeft size={15} /> {ui.back}
            </Link>
            <span className="doc-counter">
              {String(position + 1).padStart(2, "0")} / {String(documents.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </header>

      <main className="container document-layout">
        <aside className="document-aside">
          <p className="eyebrow">{getDriveSectionLabel(driveContent, document.section)}</p>
          <Toc headings={headings} title={ui.onPage} />
          <div className="aside-bottom">
            <span>{ui.updated} {formatDate(document.updatedAt)}</span>
            <span><GitBranch size={14} /> {related.length} {ui.connected}</span>
          </div>
        </aside>

        <article className="research-document" style={articleStyle}>
          <div className="document-kicker">
            <span>{ui.researchNote}</span>
            <span className="status-dot" /> {document.status}
          </div>
          <h1>{document.title}</h1>
          {document.description && <p className="document-lede">{document.description}</p>}
          <div className="document-meta-line">
            <span><Clock3 size={15} /> {readingTime(document)} {ui.minutes}</span>
            {document.publishedAt && <span><CalendarDays size={15} /> {formatDate(document.publishedAt)}</span>}
            <span>{ui.edited} {formatDate(document.updatedAt)}</span>
          </div>
          {document.tags.length > 0 && (
            <ul className="tag-list" aria-label="Tags">
              {document.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}

          <div className="rich-content">
            {document.content.map((block, index) => {
              if (block.type === "heading") {
                const Tag = block.level >= 3 ? "h3" : "h2";
                return <Tag id={block.id} key={index}>{block.text}</Tag>;
              }
              if (block.type === "callout")
                return (
                  <aside className={`callout ${block.tone}`} key={index}>
                    <strong>{block.title}</strong>
                    <MarkdownContent source={block.text} />
                  </aside>
                );
              if (block.type === "code")
                return (
                  <figure className="code-block" key={index}>
                    {block.language && block.language !== "text" && <figcaption>{block.language}</figcaption>}
                    <pre><code>{block.text}</code></pre>
                  </figure>
                );
              if (block.type === "image")
                return (
                  <figure className="image-block" key={index}>
                    <Image
                      src={assetUrl(block.src) ?? "/images/missing-image.svg"}
                      alt={block.alt}
                      width={760}
                      height={480}
                      sizes="(max-width: 760px) 100vw, 760px"
                    />
                    {block.caption && <figcaption>{block.caption}</figcaption>}
                  </figure>
                );
              if (block.type === "divider") return <hr key={index} />;
              if (block.type === "quote")
                return (
                  <blockquote key={index}>
                    <MarkdownContent source={block.text} />
                  </blockquote>
                );
              return <MarkdownContent key={index} source={block.text} />;
            })}
          </div>

          {related.length > 0 && (
            <section className="related-block">
              <p className="eyebrow">{ui.continue}</p>
              <div className="related-grid">
                {related.map((item) => (
                  <Link href={`/research/${item.slug}`} key={item.id}>
                    <span>{getDriveSectionLabel(driveContent, item.section)}</span>
                    <strong>{item.title}</strong>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {references.length > 0 && (
            <section className="references">
              <p className="eyebrow">{ui.references}</p>
              {references.map((reference, index) => {
                const content = (
                  <>
                    <span>{reference.type}</span>
                    <strong>{reference.title}</strong>
                    {reference.author && <small>{reference.author}</small>}
                    {reference.url && <ArrowUpRight size={15} />}
                  </>
                );
                return reference.url ? (
                  <a href={reference.url} target="_blank" rel="noopener noreferrer" key={`${reference.title}-${index}`}>
                    {content}
                  </a>
                ) : (
                  <div className="reference-static" key={`${reference.title}-${index}`}>{content}</div>
                );
              })}
            </section>
          )}

          {(previous || next) && (
            <nav className="pager" aria-label="More notes">
              {previous ? (
                <Link href={`/research/${previous.slug}`} className="pager-prev">
                  <span><ArrowLeft size={14} /> {ui.previous}</span>
                  <strong>{previous.title}</strong>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={`/research/${next.slug}`} className="pager-next">
                  <span>{ui.next} <ArrowRight size={14} /></span>
                  <strong>{next.title}</strong>
                </Link>
              ) : <span />}
            </nav>
          )}
        </article>
      </main>
      <SiteFooter note={ui.archiveNote} />
    </div>
  );
}

function assetUrl(value?: string) {
  if (!value) return undefined;
  const clean = value.trim().replace(/^public\//, "").replace(/^\/+/, "");
  if (!clean || clean.includes("..") || !/^[a-zA-Z0-9/_\-.]+$/.test(clean)) return undefined;
  return `/${clean}`;
}

function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (configured) {
    const clean = configured.replace(/\/+$/, "");
    return clean.startsWith("http") ? clean : `https://${clean}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
