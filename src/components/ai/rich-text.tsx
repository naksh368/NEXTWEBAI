import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * Renders the planner's replies: **bold**, [links](/relative), bullet and
 * numbered lists, and paragraphs. Nothing is ever passed through as HTML, and
 * only same-site relative links become clickable — a model can never slip a
 * script, an image or an outside link into the page.
 */

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function isSafeHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={`${keyBase}-b${i}`} className="font-bold text-brand-navy">{m[1]}</strong>);
    } else {
      const label = m[2];
      // Models sometimes write the path itself as the label; tidy it up.
      const href = m[3].startsWith("packages/") ? `/${m[3]}` : m[3];
      const shown = label.startsWith("/") ? "View package" : label;
      out.push(
        isSafeHref(href) ? (
          <Link key={`${keyBase}-l${i}`} href={href} className="font-bold text-brand-blue underline underline-offset-2 hover:text-brand-blueDark">
            {shown}
          </Link>
        ) : (
          <Fragment key={`${keyBase}-t${i}`}>{label}</Fragment>
        )
      );
    }
    last = m.index! + m[0].length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={`list-${blocks.length}`} className={list.ordered ? "ml-4 list-decimal space-y-1" : "ml-4 list-disc space-y-1"}>
        {list.items.map((item, j) => (
          <li key={j}>{inline(item, `li-${blocks.length}-${j}`)}</li>
        ))}
      </Tag>
    );
    list = null;
  };

  lines.forEach((raw, n) => {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
      return;
    }
    // An indented continuation line belongs to the previous list item.
    if (list && raw.startsWith("  ") && line) {
      list.items[list.items.length - 1] += ` ${line}`;
      return;
    }
    flush();
    if (!line) return;
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      <p key={`p-${n}`} className={heading ? "font-extrabold text-brand-navy" : undefined}>
        {inline(heading ? heading[1] : line, `p-${n}`)}
      </p>
    );
  });
  flush();

  return <div className="space-y-2">{blocks}</div>;
}
