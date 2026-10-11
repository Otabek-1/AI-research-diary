"use client";

import { useEffect, useRef, useState } from "react";

/** Thin progress bar pinned to the top of the viewport while reading a note. */
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = document.documentElement;
      const max = element.scrollHeight - element.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, element.scrollTop / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div className="reading-progress" aria-hidden="true">
      <div ref={bar} className="reading-progress-bar" />
    </div>
  );
}

/** Table of contents that highlights the heading currently in view. */
export function Toc({ headings, title }: { headings: { id: string; text: string; level: number }[]; title: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!headings.length) return;
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;
  return (
    <nav className="toc" aria-label={title}>
      <span className="toc-title">{title}</span>
      {headings.map((heading) => (
        <a
          href={`#${heading.id}`}
          key={heading.id}
          className={`${active === heading.id ? "is-active " : ""}${heading.level > 2 ? "is-sub" : ""}`.trim() || undefined}
          aria-current={active === heading.id ? "location" : undefined}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
