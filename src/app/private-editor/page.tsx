"use client";

import JSZip from "jszip";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Download,
  FilePlus2,
  GripVertical,
  Heading2,
  ImagePlus,
  Link2,
  ListPlus,
  PanelRight,
  Plus,
  Quote,
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ContentBlock,
  Document,
  getDocuments,
  getSectionLabels,
  getTranslationStatus,
  getTree,
  Locale,
  locales,
  Tree,
  TreeNode,
} from "@/lib/content";

type ImageBlock = {
  type: "image";
  src: string;
  alt: string;
  caption: string;
  assetPath?: string;
};
type EditableBlock =
  | ContentBlock
  | { type: "quote"; text: string }
  | { type: "divider"; text: string }
  | ImageBlock;
const today = new Date().toISOString().slice(0, 10);
const visibleStatuses: Document["status"][] = ["published", "in-progress"];
type PublishFile = { path: string; content: string; encoding: "utf8" | "base64" };
const starter: Document = {
  schemaVersion: 1,
  id: "new-research-note",
  slug: "new-research-note",
  title: "Untitled research",
  description: "",
  status: "draft",
  createdAt: today,
  updatedAt: today,
  section: "field-notes",
  tags: [],
  content: [{ type: "paragraph", text: "Start writing your research note..." }],
  related: [],
  references: [],
  seo: { title: "", description: "" },
};

export default function PrivateEditor() {
  const [locale, setLocale] = useState<Locale>("en");
  const [documents, setDocuments] = useState<Document[]>(() =>
    getDocuments("en"),
  );
  const [selectedId, setSelectedId] = useState(starter.id);
  const [document, setDocument] = useState<Document>(() => starter);
  const [tree, setTree] = useState(() => getTree("en"));
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>(() =>
    getSectionLabels(),
  );
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const [draftTouched, setDraftTouched] = useState<Record<string, boolean>>({});
  const [imported, setImported] = useState<Document[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PublishFile[]>([]);
  const [deletedPaths, setDeletedPaths] = useState<string[]>([]);
  const [publishedRevision, setPublishedRevision] = useState(0);
  const [message, setMessage] = useState("Saved locally");
  const [treeFilter, setTreeFilter] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  const [leftWidth, setLeftWidth] = useState(255);
  const [rightWidth, setRightWidth] = useState(250);
  const status = getTranslationStatus(selectedId);
  const headings = document.content.filter((block) => block.type === "heading");
  const titleDraft = titleDrafts[locale];
  const library = useMemo(() => {
    const byId = new Map<string, Document>();
    [...documents, ...imported].forEach((item) => {
      if (item?.id && !byId.has(item.id)) byId.set(item.id, item);
    });
    // Documents the editor has re-opened, edited but not published yet stay reachable
    // through the library tree even after a reload.
    const locals = locales.flatMap((code) =>
      Object.keys(draftTouched).some((key) => key.startsWith(`${code}:`) && draftTouched[key])
        ? headersFor(code).flatMap((id) => [readLocalDraft(code, id)])
        : [],
    );
    [...locals, ...imported].forEach((item) => {
      if (item?.id && !byId.has(item.id)) byId.set(item.id, item);
    });
    return [...byId.values()];
  }, [documents, imported, draftTouched]);
  const visibleTree = useMemo(() => localizedTree(tree, sectionLabels), [tree, sectionLabels]);
  const visibleDocuments = useMemo(
    () => publishedLibrary(library, visibleTree),
    [library, visibleTree],
  );
  void publishedRevision;

  useEffect(() => {
    const saved = window.localStorage.getItem(
      `field-notes-draft-${locale}-${selectedId}`,
    );
    if (!saved) return;
    const timer = window.setTimeout(() => {
      try {
        setDocument(JSON.parse(saved));
        setMessage("Restored local draft");
      } catch {
        setMessage("Saved locally");
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // Only re-open a document when the document or language changes.
  }, [locale, selectedId]);
  useEffect(() => {
    window.localStorage.setItem(
      `field-notes-draft-${locale}-${selectedId}`,
      JSON.stringify(document),
    );
  }, [document, locale, selectedId]);
  useEffect(() => {
    const savedTree = window.localStorage.getItem("field-notes-tree-shared");
    const savedLabels = window.localStorage.getItem("field-notes-section-labels");
    const savedPending = window.localStorage.getItem("field-notes-pending-files");
    const savedDeletes = window.localStorage.getItem(`field-notes-deletes-${locale}`);
    const timer = window.setTimeout(() => {
      if (savedTree) { try { setTree(JSON.parse(savedTree)); } catch { /* Ignore an invalid local tree draft. */ } }
      if (savedLabels) { try { setSectionLabels(JSON.parse(savedLabels)); } catch { /* Ignore invalid section names. */ } }
      if (savedPending) { try { setPendingFiles(JSON.parse(savedPending)); } catch { /* Ignore an invalid publish queue. */ } }
      if (savedDeletes) { try { setDeletedPaths(JSON.parse(savedDeletes)); } catch { /* Ignore an invalid local delete draft. */ } }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [locale]);
  useEffect(() => { window.localStorage.setItem("field-notes-tree-shared", JSON.stringify(tree)); }, [tree]);
  useEffect(() => { window.localStorage.setItem("field-notes-section-labels", JSON.stringify(sectionLabels)); }, [sectionLabels]);
  useEffect(() => { window.localStorage.setItem(`field-notes-deletes-${locale}`, JSON.stringify(deletedPaths)); }, [locale, deletedPaths]);
  useEffect(() => { window.localStorage.setItem("field-notes-pending-files", JSON.stringify(pendingFiles)); }, [pendingFiles]);
  useEffect(() => { const saved = window.localStorage.getItem("field-notes-workspace-widths"); if (!saved) return; const timer = window.setTimeout(() => { try { const widths = JSON.parse(saved) as { left?: number; right?: number }; if (widths.left) setLeftWidth(widths.left); if (widths.right) setRightWidth(widths.right); } catch { /* Ignore invalid layout preferences. */ } }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { window.localStorage.setItem("field-notes-workspace-widths", JSON.stringify({ left: leftWidth, right: rightWidth })); }, [leftWidth, rightWidth]);

  async function uploadSoon(label: string, build: () => Promise<PublishFile[]>) {
    try {
      const files = await build();
      const stale = new Set(files.map((file) => file.path));
      setPendingFiles((current) => [...current.filter((file) => !stale.has(file.path)), ...files]);
      setMessage(`${label} queued — press Publish to GitHub to make it public.`);
    } catch {
      setMessage(`${label} could not be prepared locally.`);
    }
  }
  function openDocument(id: string) {
    const next = documents.find((item) => item.id === id) ?? readLocalDraft(locale, id);
    if (next) {
      setSelectedId(id);
      setDocument(next);
      setDocuments((current) =>
        current.some((item) => item.id === next.id) ? current : [...current, next],
      );
    }
  }
  function switchLocale(nextLocale: Locale) {
    const nextDocuments = getDocuments(nextLocale);
    const local = readLocalDraft(nextLocale, selectedId);
    setLocale(nextLocale);
    setDocuments(
      local && !nextDocuments.some((item) => item.id === local.id)
        ? [...nextDocuments, local]
        : nextDocuments,
    );
    const next = nextDocuments.find((item) => item.id === selectedId) ?? local;
    setDocument(
      next ?? {
        ...document,
        title: "",
        description: "",
        content: [{ type: "paragraph", text: "Translation not started yet." }],
      },
    );
    setMessage(next ? "Translation opened" : "New translation draft");
  }
  function updateDocument(patch: Partial<Document>) {
    setDocument((current) => ({ ...current, ...patch, updatedAt: today }));
    if (!patch.slug || patch.slug === document.slug) return;
    // Moving the slug moves the JSON file on GitHub, so the old path has to go too.
    const previous = `content/locales/${locale}/${document.slug}.json`;
    const moved = [...locales.map((code) => `content/locales/${code}/${document.slug}.json`), previous];
    setDeletedPaths((current) => [
      ...new Set([...current, ...moved].filter((path) => path !== `content/locales/${locale}/${patch.slug}.json`)),
    ]);
  }
  function updateDocumentTitle(title: string) {
    const fresh = !document.slug || document.slug === "new-research-note" || /^new-research-\d+$/.test(document.slug);
    updateDocument({
      title,
      ...(fresh ? { slug: slugFromTitle(title) } : {}),
      seo: { ...document.seo, title: document.seo.title || title },
    });
  }
  function renameSection(nodeId: string, title: string) {
    setSectionLabels((current) => ({ ...current, [nodeId]: title }));
    setTree((current) => ({ ...current, roots: updateTreeNode(current.roots, nodeId, { title }) }));
    uploadSoon(`Rename section to “${title}”`, async () => [
      await buildSectionFile(getLocaleTree(tree, { ...sectionLabels, [nodeId]: title }, {}), nodeId, { ...sectionLabels, [nodeId]: title }),
    ]);
  }
  function renameDocument(documentId: string, title: string, sectionId: string) {
    const clean = title.trim();
    if (!clean) return;
    setSectionLabels((current) => ({ ...current, [documentId]: clean }));
    setDocuments((current) => current.map((item) => (item.id === documentId ? { ...item, title: clean } : item)));
    if (documentId === selectedId) updateDocumentTitle(clean);
    uploadSoon(`Rename research to “${clean}”`, async () => {
      const files: PublishFile[] = [];
      for (const code of locales) {
        const local = documentId === selectedId
          ? { ...document, title: code === locale ? clean : document.title }
          : readLocalDraft(code, documentId);
        const fallback = getDocuments(code).find((item) => item.id === documentId);
        const source = local ?? fallback;
        if (!source) continue;
        const doc = code === locale ? { ...source, title: clean } : source;
        files.push(serializeDocument(doc).file(`content/locales/${code}/${source.slug}.json`));
      }
      files.push(await buildSectionFile(tree, sectionId, { ...sectionLabels, [sectionId]: clean }));
      return files;
    });
  }
  function updateBlock(index: number, patch: Partial<EditableBlock>) {
    setDocument((current) => ({
      ...current,
      content: current.content.map((block, blockIndex) =>
        blockIndex === index ? ({ ...block, ...patch } as ContentBlock) : block,
      ),
    }));
  }
  function addBlock(type: EditableBlock["type"]) {
    const block: EditableBlock =
      type === "heading"
        ? { type, level: 2, id: `heading-${Date.now()}`, text: "New section" }
        : type === "callout"
          ? { type, tone: "note", title: "Note", text: "Add a useful note..." }
          : type === "code"
            ? { type, language: "text", text: "" }
            : type === "quote"
              ? { type, text: "A thought worth keeping." }
              : type === "divider"
                ? { type, text: "" }
                : type === "image"
                  ? { type, src: "", alt: "", caption: "" }
                  : { type: "paragraph", text: "" };
    setDocument((current) => ({
      ...current,
      content: [...current.content, block as ContentBlock],
    }));
    setCommandOpen(false);
  }
  function removeBlock(index: number) {
    setDocument((current) => ({
      ...current,
      content: current.content.filter((_, blockIndex) => blockIndex !== index),
    }));
  }
  function moveTreeNode(dragId: string, targetId: string) {
    if (dragId === targetId) return;
    setTree((current) => ({
      ...current,
      roots: reorderTree(current.roots, dragId, targetId),
    }));
    setMessage("Tree order saved locally");
  }
  function addSection() {
    const title = window.prompt("New section name", "New section")?.trim();
    if (!title) return;
    const id = `section-${Date.now()}`;
    const nextLabels = { ...sectionLabels, [id]: title };
    setSectionLabels(nextLabels);
    const nextTree = { ...tree, roots: [...tree.roots, { id, title, children: [] }] };
    setTree(nextTree);
    // The public page reads section names from content/sections.json, so a section only
    // becomes visible after that file is published together with the tree.
    uploadSoon(`Add section “${title}”`, async () => [await buildSectionFile(nextTree, id, nextLabels)]);
  }
  function resizePanel(side: "left" | "right", event: React.PointerEvent<HTMLDivElement>) {
    const startX = event.clientX;
    const startWidth = side === "left" ? leftWidth : rightWidth;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent) => { const delta = moveEvent.clientX - startX; const next = Math.max(190, Math.min(420, startWidth + (side === "left" ? delta : -delta))); if (side === "left") setLeftWidth(next); else setRightWidth(next); };
    const stop = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", stop, { once: true });
  }
  function addSubsection(parentId: string) {
    const title = window.prompt("New subsection name", "New section")?.trim();
    if (!title) return;
    const id = `section-${Date.now()}`;
    const section = { id, title, children: [] as TreeNode[] };
    const nextLabels = { ...sectionLabels, [id]: title };
    setSectionLabels(nextLabels);
    const nextTree = { ...tree, roots: insertTreeChild(tree.roots, parentId, section) };
    setTree(nextTree);
    uploadSoon(`Add section “${title}”`, async () => [await buildSectionFile(nextTree, id, nextLabels)]);
  }
  function createDocumentInSection(sectionId: string) {
    const title = window.prompt("New research title", "Untitled research")?.trim() || "Untitled research";
    const id = `new-research-${Date.now()}`;
    const slug = createSlug(title, documents, imported);
    const nextDocument: Document = {
      ...starter,
      id,
      slug,
      title,
      section: sectionId,
      status: "published",
      publishedAt: today,
      createdAt: today,
      updatedAt: today,
      seo: { title, description: "" },
      content: [{ type: "paragraph", text: "Start writing your research note..." }],
    };
    setSelectedId(id);
    setDocument(nextDocument);
    setSectionLabels((current) => ({ ...current, [id]: title }));
    setDocuments((current) => [...current, nextDocument]);
    window.localStorage.setItem(`field-notes-draft-${locale}-${id}`, JSON.stringify(nextDocument));
    setTree((current) => ({ ...current, roots: addDocumentToTree(current.roots, sectionId, id) }));
    const ready = findTreeNode(tree.roots, sectionId)?.title ?? sectionLabels[sectionId] ?? "the selected section";
    setMessage(`Draft “${title}” created as /${slug} inside ${ready}. Press Publish to GitHub to make it public.`);
    // A section without any published document never reaches the public page, so the
    // section is queued here and committed together with the new research.
    const anchors = findTreePath(tree.roots, sectionId);
    if (anchors.length) uploadSoon(`Publish section “${ready}”`, async () => [await buildSectionFile(tree, sectionId, { ...sectionLabels, [sectionId]: ready })]);
  }
  function renameTreeNode(nodeId: string, title: string) {
    const nextTitle = window.prompt("Rename section", title)?.trim();
    if (!nextTitle || nextTitle === title) return;
    renameSection(nodeId, nextTitle);
    setMessage(`Renamed to “${nextTitle}”. Press Publish to GitHub to update the public page.`);
  }
  function deleteTreeNode(nodeId: string, title: string) {
    if (!window.confirm(`Delete section “${title}” and its nested sections?`)) return;
    const deletedIds = collectDocumentIds(tree.roots, nodeId);
    const nextTree = { ...tree, roots: removeTreeNode(tree.roots, nodeId) };
    const deletedSlugs = library.filter((item) => deletedIds.includes(item.id)).flatMap((item) => locales.map((language) => `content/locales/${language}/${item.slug}.json`));
    setDeletedPaths((current) => [...new Set([...current, ...deletedSlugs, "content/sections.json", "content/tree.json"])]);
    setTree(nextTree);
    uploadSoon(`Delete section “${title}”`, async () => [await fileFromText("content/tree.json", `${JSON.stringify(nextTree, null, 2)}\n`)]);
    setMessage(`Section “${title}” removed locally. Press Publish to GitHub to remove it from the public page.`);
  }
  function deleteDocument(documentId: string) {
    const target = library.find((item) => item.id === documentId);
    if (!target || !window.confirm(`Remove “${target.title}” from this editor tree?`)) return;
    const nextTree = { ...tree, roots: removeDocumentFromTree(tree.roots, documentId) };
    setDocuments((current) => current.filter((item) => item.id !== documentId));
    setTree(nextTree);
    setDeletedPaths((current) => [...new Set([...current, ...locales.map((language) => `content/locales/${language}/${target.slug}.json`)])]);
    if (selectedId === documentId) { setSelectedId("new-research-note"); setDocument(starter); }
    uploadSoon(`Remove research “${target.title}”`, async () => [await fileFromText("content/tree.json", `${JSON.stringify(nextTree, null, 2)}\n`)]);
    setMessage(`“${target.title}” removed locally. Press Publish to GitHub to remove it from the public page.`);
  }
  function renameHeading(id: string, currentText: string) {
    const nextText = window.prompt("Rename heading", currentText)?.trim();
    if (nextText) setDocument((current) => ({ ...current, content: current.content.map((block) => block.type === "heading" && block.id === id ? { ...block, text: nextText } : block) }));
  }
  function deleteHeading(id: string, text: string) {
    if (!window.confirm(`Delete heading “${text}” and its block?`)) return;
    setDocument((current) => ({ ...current, content: current.content.filter((block) => block.type !== "heading" || block.id !== id) }));
  }
  function formatBlock(index: number, marker: string) {
    const block = document.content[index];
    if (!block || !("text" in block)) return;
    updateBlock(index, { text: `${marker}${block.text}${marker}` });
    setMessage("Formatting applied");
  }
  function uploadImage(index: number, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      updateBlock(index, {
        src: String(reader.result),
        assetPath: `public/media/images/${document.section}/${document.slug}/${safeName}`,
      });
      setMessage("Image added; it will be included in ZIP export");
    };
    reader.readAsDataURL(file);
  }
  function validate() {
    const errors: string[] = [];
    if (!document.title.trim()) errors.push("Title is required");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(document.slug))
      errors.push("Filename must use lowercase letters and hyphens (letters, numbers and single hyphens only)");
    else if (/^new-research-\d+$/.test(document.slug))
      errors.push("Filename is still the generated placeholder — type a title or set a real filename");
    if (!document.id.trim()) errors.push("Stable document ID is required");
    return errors;
  }
  async function exportFiles(zipMode: boolean) {
    const errors = validate();
    if (errors.length) {
      setMessage(errors.join(" | "));
      return;
    }
    if (!findTreeNode(tree.roots, document.section)) {
      setMessage("Choose a section for this research first, then export.");
      return;
    }
    const { serialized, media } = serializeDocument(document);
    const path = `content/locales/${locale}/${document.slug}.json`;
    const json = JSON.stringify(serialized, null, 2) + "\n";
    if (!zipMode)
      download(
        new Blob([json], { type: "application/json" }),
        `${document.slug}.${locale}.json`,
      );
    else {
      const zip = new JSZip();
      zip.file(path, json);
      zip.file(
        "content/tree.json",
        `${JSON.stringify({ ...tree, roots: addDocumentToTree(tree.roots, document.section, document.id) }, null, 2)}\n`,
      );
      zip.file("content/sections.json", `${JSON.stringify(sectionLabelsFile(sectionLabels), null, 2)}\n`);
      media.forEach((asset) => zip.file(asset.path, asset.base64, { base64: true }));
      zip.file(
        "README.txt",
        `Field / Notes visual editor export\nLanguage: ${locale}\nDocument: ${document.id}\n\nReplace these files in the repository, then commit and push.\n`,
      );
      download(
        await zip.generateAsync({ type: "blob" }),
        `${document.slug}-${locale}-export.zip`,
      );
    }
    setMessage(
      `Ready to export: ${path}${media.length ? ` + ${media.length} media asset(s)` : ""}`,
    );
  }
  function collectPublishFiles(): { files: PublishFile[]; errors: string[] } {
    const files = new Map<string, PublishFile>();
    const errors: string[] = [];
    for (const file of pendingFiles) files.set(file.path, file);
    const visibleTree = localizedTree(tree, sectionLabels);
    files.set("content/tree.json", utf8File("content/tree.json", visibleTree));
    files.set("content/sections.json", utf8File("content/sections.json", sectionLabelsFile(sectionLabels)));
    if (document.id !== starter.id) {
      errors.push(...validate());
      if (!findTreeNode(tree.roots, document.section))
        errors.push(`Section “${document.section}” is missing from the tree — create it first`);
      if (!files.has(`content/locales/${locale}/${document.slug}.json`)) {
        const { serialized, media } = serializeDocument(document);
        files.set(`content/locales/${locale}/${document.slug}.json`, utf8File(`content/locales/${locale}/${document.slug}.json`, serialized));
        media.forEach((asset) => files.set(asset.path, { path: asset.path, content: asset.base64, encoding: "base64" }));
      }
    }
    return { files: [...files.values()], errors };
  }
  async function publishToGitHub() {
    const { files, errors } = collectPublishFiles();
    if (errors.length) { setMessage(errors.join(" | ")); return; }
    setMessage("Publishing to GitHub...");
    const response = await fetch("/api/admin/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files, deletes: deletedPaths, message: `Update research structure (${locale})` }) });
    const result = await response.json() as { ok?: boolean; error?: string; detail?: string };
    if (response.ok && result.ok) {
      setPendingFiles([]);
      setDeletedPaths([]);
      setPublishedRevision((revision) => revision + 1);
      setMessage(`Published to GitHub: ${files.length} file(s) committed. The public page shows them once Netlify finishes rebuilding.`);
    } else setMessage(result.error || result.detail || "GitHub publish failed.");
  }
  function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Document;
        if (!parsed.id || !parsed.title || !Array.isArray(parsed.content))
          throw new Error("This document is missing required fields.");
        setImported((current) => [...current.filter((item) => item.id !== parsed.id), parsed]);
        setSectionLabels((current) => ({ ...current, [parsed.id]: current[parsed.id] ?? parsed.title }));
        setSelectedId(parsed.id);
        setDocument(parsed);
        setMessage("Document imported. Pick a section in Metadata, then Publish to GitHub.");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Could not import document",
        );
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <Link className="wordmark" href="/">
          FIELD / NOTES<span>01</span>
        </Link>
        <div className="workspace-search">
          <Search size={15} />
          <input
            placeholder="Search documents..."
            value={treeFilter}
            onChange={(event) => setTreeFilter(event.target.value)}
          />
        </div>
        <div className="workspace-actions">
          <button
            className="workspace-button"
            onClick={() => setShowMetadata(true)}
          >
            <Settings2 size={15} /> Metadata
          </button>
          <Link
            className="workspace-button"
            href={`/en/research/${document.slug}`}
            target="_blank"
          >
            <Sparkles size={15} /> Preview
          </Link>
          <button
            className="workspace-button workspace-primary"
            onClick={() => exportFiles(true)}
          >
            <Download size={15} /> Finish & Export
          </button>
          <button className="workspace-button workspace-primary" onClick={publishToGitHub}>
            <Upload size={15} /> Publish to GitHub{pendingFiles.length ? ` (${pendingFiles.length})` : ""}
          </button>
        </div>
      </header>
      <div className="workspace-grid" style={{ gridTemplateColumns: `${leftWidth}px 6px minmax(480px, 1fr) 6px ${rightWidth}px` }}>
        <aside className="workspace-sidebar left-sidebar">
          <div className="workspace-sidebar-head">
            <div>
              <span className="eyebrow">Research</span>
              <h2>Library</h2>
            </div>
            <button
              className="small-icon"
              aria-label="New research"
              onClick={() => {
                setSelectedId("new-research-note");
                setDocument(starter);
              }}
            >
              <FilePlus2 size={16} />
            </button>
          </div>
          <TreeView
            nodes={visibleTree.roots}
            filter={treeFilter}
            selectedId={selectedId}
            labels={{ ...sectionLabels, ...Object.fromEntries(visibleDocuments.map((item) => [item.id, item.title])) }}
            onSelect={openDocument}
            onReorder={moveTreeNode}
            onRename={renameTreeNode}
            onRenameDocument={renameDocument}
            onDelete={deleteTreeNode}
            onDeleteDocument={deleteDocument}
            onAddSection={addSubsection}
            onAddDocument={createDocumentInSection}
          />
          <div className="sidebar-bottom">
            <label className="workspace-upload">
              <Upload size={14} /> Import existing
              <input
                type="file"
                accept="application/json"
                onChange={importFile}
              />
            </label>
            <button className="new-section" onClick={addSection}>
              <Plus size={14} /> New section
            </button>
          </div>
        </aside><div className="panel-resize-handle left-resize" onPointerDown={(event) => resizePanel("left", event)} role="separator" aria-label="Resize library panel" />
        <section className="visual-editor">
          <div className="editor-toolbar">
            <div>
              <span className="eyebrow">
                {locale.toUpperCase()} / Visual editor
              </span>
              <p className="save-state">
                <Save size={13} /> {message}
              </p>
            </div>
            <div className="language-tabs">
              {locales.map((code) => (
                <button
                  className={code === locale ? "selected" : ""}
                  key={code}
                  onClick={() => switchLocale(code)}
                >
                  {code.toUpperCase()} {status[code] ? "✓" : "◐"}
                </button>
              ))}
            </div>
          </div>
          <div className="editor-document">
            <input
              className="title-input"
              value={titleDraft ?? document.title}
              onFocus={() => setDraftTouched((current) => ({ ...current, [`${locale}:${selectedId}`]: true }))}
              onBlur={() => setTitleDrafts((current) => {
                const next = { ...current };
                delete next[locale];
                return next;
              })}
              onChange={(event) => {
                const title = event.target.value;
                setTitleDrafts((current) => ({ ...current, [locale]: title }));
                updateDocumentTitle(title);
              }}
              aria-label="Document title"
            />
            <textarea
              className="description-input"
              value={document.description}
              onChange={(event) =>
                updateDocument({ description: event.target.value })
              }
              placeholder="Add a short description..."
              aria-label="Document description"
            />
            {activeBlock !== null && (
              <div className="context-toolbar">
                <span>Format</span>
                <button onClick={() => formatBlock(activeBlock, "**")}>
                  <strong>B</strong>
                </button>
                <button onClick={() => formatBlock(activeBlock, "_")}>
                  <em>I</em>
                </button>
                <button onClick={() => formatBlock(activeBlock, "`")}>
                  <Code2 size={14} />
                </button>
                <button onClick={() => formatBlock(activeBlock, "[link]( )")}>
                  <Link2 size={14} />
                </button>
                <button onClick={() => setActiveBlock(null)}>
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="block-list">
              {document.content.map((block, index) => (
                <BlockEditor
                  block={block as EditableBlock}
                  index={index}
                  key={`${index}-${block.type}`}
                  active={activeBlock === index}
                  onFocus={() => setActiveBlock(index)}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  onUpload={uploadImage}
                />
              ))}
            </div>
            <div className="add-block-wrap">
              <button
                className="add-block"
                onClick={() => setCommandOpen((open) => !open)}
              >
                <Plus size={15} /> Add block
              </button>
              {commandOpen && (
                <div className="command-menu">
                  <strong>Add block</strong>
                  <button onClick={() => addBlock("paragraph")}>
                    <ListPlus size={15} /> Text
                  </button>
                  <button onClick={() => addBlock("heading")}>
                    <Heading2 size={15} /> Heading
                  </button>
                  <button onClick={() => addBlock("quote")}>
                    <Quote size={15} /> Quote
                  </button>
                  <button onClick={() => addBlock("callout")}>
                    <Sparkles size={15} /> Callout
                  </button>
                  <button onClick={() => addBlock("code")}>
                    <Code2 size={15} /> Code
                  </button>
                  <button onClick={() => addBlock("image")}>
                    <ImagePlus size={15} /> Image
                  </button>
                  <button onClick={() => addBlock("divider")}>
                    <PanelRight size={15} /> Divider
                  </button>
                </div>
              )}
            </div>
          </div>
        </section><div className="panel-resize-handle right-resize" onPointerDown={(event) => resizePanel("right", event)} role="separator" aria-label="Resize outline panel" />
        <aside className="workspace-sidebar right-sidebar">
          <div className="outline-head">
            <span className="eyebrow">On this page</span>
            <PanelRight size={16} />
          </div>
          <nav className="editor-outline">
            {headings.length ? (
              headings.map((heading) => (
                <div className="outline-item" key={heading.id}>
                  <a href={`#${heading.id}`}>{heading.text}</a>
                  <span><button onClick={() => renameHeading(heading.id, heading.text)} aria-label={`Rename ${heading.text}`}>Edit</button><button onClick={() => deleteHeading(heading.id, heading.text)} aria-label={`Delete ${heading.text}`}><Trash2 size={12} /></button></span>
                </div>
              ))
            ) : (
              <span className="muted-copy">
                Add headings to build the outline.
              </span>
            )}
          </nav>
          <div className="right-panel-section">
            <button
              className="panel-toggle"
              onClick={() => setShowMetadata((open) => !open)}
            >
              <span>Document</span>
              {showMetadata ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </button>
            {showMetadata && (
              <div className="metadata-fields">
                <label>
                  Section
                  <select
                    value={document.section}
                    onChange={(event) => {
                      const sectionId = event.target.value;
                      updateDocument({ section: sectionId });
                      setTree((current) => ({ ...current, roots: addDocumentToTree(current.roots, sectionId, document.id) }));
                      setMessage(` under ${sectionLabels[sectionId] ?? titleCase(sectionId)}. Press Publish to GitHub to store it there.`);
                    }}
                  >
                    {tree.roots.map((root) => [root, ...collectTreeNodes(root.children ?? [])].map((node) => (
                      <option key={`${root.id}-${node.id}`} value={node.id}>
                        {`${sectionLabelFrom(tree, sectionLabels, node.id)}${node.id === root.id ? "" : ` (${titleCase(root.title)})`}`}
                      </option>
                    )))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={document.status}
                    onChange={(event) =>
                      updateDocument({
                        status: event.target.value as Document["status"],
                      })
                    }
                  >
                    <option value="draft">Draft (hidden from the public page)</option>
                    <option value="in-progress">In progress (visible)</option>
                    <option value="published">Published (visible)</option>
                    <option value="archived">Archived (hidden)</option>
                  </select>
                </label>
                <label>
                  Filename (URL)
                  <input
                    value={document.slug}
                    onChange={(event) => updateDocument({ slug: event.target.value })}
                    placeholder="my-research-note"
                  />
                  <small className="field-hint">
                    Used in /{locale}/research/{document.slug || "..."} and as the JSON file name.
                  </small>
                </label>
                <label>
                  Tags
                  <input
                    value={document.tags.join(", ")}
                    onChange={(event) =>
                      updateDocument({
                        tags: event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
              </div>
            )}
          </div>
          <div className="right-panel-section">
            <button
              className="panel-toggle"
              onClick={() => setShowSeo((open) => !open)}
            >
              <span>SEO & social preview</span>
              {showSeo ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
            {showSeo && (
              <div className="metadata-fields">
                <label>
                  Meta title
                  <input
                    value={document.seo.title}
                    onChange={(event) =>
                      updateDocument({
                        seo: { ...document.seo, title: event.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Meta description
                  <textarea
                    value={document.seo.description}
                    onChange={(event) =>
                      updateDocument({
                        seo: {
                          ...document.seo,
                          description: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <div className="social-preview">
                  <strong>{document.seo.title || document.title}</strong>
                  <span>
                    {document.seo.description || document.description}
                  </span>
                  <small>
                    field-notes.local/{locale}/research/{document.slug}
                  </small>
                </div>
              </div>
            )}
          </div>
          <div className="right-panel-section">
            <div className="panel-toggle">
              <span>Related research</span>
              <Link2 size={15} />
            </div>
            <div className="related-editor">
              {document.related.map((id) => (
                <span key={id}>
                  {documents.find((item) => item.id === id)?.title ?? id}
                  <button
                    aria-label={`Remove ${id}`}
                    onClick={() =>
                      updateDocument({
                        related: document.related.filter(
                          (relatedId) => relatedId !== id,
                        ),
                      })
                    }
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                className="add-related"
                onClick={() => {
                  const candidate = documents.find(
                    (item) =>
                      item.id !== document.id &&
                      !document.related.includes(item.id),
                  );
                  if (candidate)
                    updateDocument({
                      related: [...document.related, candidate.id],
                    });
                }}
              >
                + Add related research
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function TreeView({
  nodes,
  filter,
  selectedId,
  labels,
  onSelect,
  onReorder,
  onRename,
  onRenameDocument,
  onDelete,
  onDeleteDocument,
  onAddSection,
  onAddDocument,
  depth = 0,
}: {
  nodes: TreeNode[];
  filter: string;
  selectedId: string;
  labels: Record<string, string>;
  onSelect: (id: string) => void;
  onReorder: (dragId: string, targetId: string) => void;
  onRename: (nodeId: string, title: string) => void;
  onRenameDocument: (documentId: string, title: string, sectionId: string) => void;
  onDelete: (nodeId: string, title: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onAddSection: (nodeId: string) => void;
  onAddDocument: (nodeId: string) => void;
  depth?: number;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  return (
    <div className="tree-view">
      {nodes.map((node) => {
        const visible =
          !filter || node.title.toLowerCase().includes(filter.toLowerCase());
        if (
          !visible &&
          !node.children?.some((child) =>
            child.title.toLowerCase().includes(filter.toLowerCase()),
          )
        )
          return null;
        const isCollapsed = collapsed[node.id];
        return (
          <div
            key={node.id}
            className="tree-node"
            style={{ paddingLeft: depth * 12 }}
            draggable
            onDragStart={(event) =>
              event.dataTransfer.setData("text/plain", node.id)
            }
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              onReorder(event.dataTransfer.getData("text/plain"), node.id);
            }}
          >
            <div className="tree-node-title">
              <button className="tree-toggle" aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${node.title}`} onClick={() => node.children?.length && setCollapsed((current) => ({ ...current, [node.id]: !current[node.id] }))}>
              {node.children?.length ? (
                isCollapsed ? (
                  <ChevronRight size={13} />
                ) : (
                  <ChevronDown size={13} />
                )
              ) : (
                <span className="tree-spacer" />
              )}
              </button>
              <span>{node.title}</span>
              <span className="tree-node-actions"><button onClick={(event) => { event.stopPropagation(); onAddSection(node.id); }} aria-label={`Add subsection inside ${node.title}`}>+ section</button><button onClick={(event) => { event.stopPropagation(); onAddDocument(node.id); }} aria-label={`Add research inside ${node.title}`}>+ research</button><button onClick={(event) => { event.stopPropagation(); onRename(node.id, node.title); }} aria-label={`Rename ${node.title}`}>Edit</button><button onClick={(event) => { event.stopPropagation(); onDelete(node.id, node.title); }} aria-label={`Delete ${node.title}`}><Trash2 size={12} /></button></span>
            </div>
            {!isCollapsed &&
              node.documentIds?.map((id) => (
                <div
                  className={`tree-document-item ${selectedId === id ? "selected" : ""}`}
                  key={id}
                  onClick={() => onSelect(id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(id); }}
                >
                  <GripVertical size={12} />
                  <span>{labels[id] ?? titleCase(id)}</span>
                  <span className="tree-document-actions">
                    <button aria-label={`Rename ${labels[id] ?? id}`} onClick={(event) => { event.stopPropagation(); const next = window.prompt("Rename research", labels[id] ?? titleCase(id))?.trim(); if (next) onRenameDocument(id, next, node.id); }}>Edit</button>
                    <button aria-label={`Delete ${labels[id] ?? id}`} onClick={(event) => { event.stopPropagation(); onDeleteDocument(id); }}><Trash2 size={12} /></button>
                  </span>
                </div>
              ))}
            {!isCollapsed && node.children && (
              <TreeView
                nodes={node.children}
                filter={filter}
                selectedId={selectedId}
                labels={labels}
                onSelect={onSelect}
                onReorder={onReorder}
                onRename={onRename}
                onRenameDocument={onRenameDocument}
                onDelete={onDelete}
                onDeleteDocument={onDeleteDocument}
                onAddSection={onAddSection}
                onAddDocument={onAddDocument}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BlockEditor({
  block,
  index,
  active,
  onFocus,
  onUpdate,
  onRemove,
  onUpload,
}: {
  block: EditableBlock;
  index: number;
  active: boolean;
  onFocus: () => void;
  onUpdate: (index: number, patch: Partial<EditableBlock>) => void;
  onRemove: (index: number) => void;
  onUpload: (index: number, file: File) => void;
}) {
  const text = "text" in block ? block.text : "";
  return (
    <div
      className={`editable-block block-${block.type} ${active ? "active" : ""}`}
      id={block.type === "heading" ? block.id : undefined}
    >
      <div className="block-handle">
        <GripVertical size={15} />
        <button onClick={() => onRemove(index)} aria-label="Delete block">
          <Trash2 size={13} />
        </button>
      </div>
      {block.type === "heading" ? (
        <input
          className="block-heading-input"
          value={block.text}
          onFocus={onFocus}
          onChange={(event) => onUpdate(index, { text: event.target.value })}
        />
      ) : block.type === "callout" ? (
        <div className="callout-editor">
          <input
            value={block.title}
            onFocus={onFocus}
            onChange={(event) => onUpdate(index, { title: event.target.value })}
          />
          <textarea
            value={block.text}
            onFocus={onFocus}
            onChange={(event) => onUpdate(index, { text: event.target.value })}
          />
        </div>
      ) : block.type === "code" ? (
        <div className="code-editor">
          <select
            value={block.language}
            onChange={(event) =>
              onUpdate(index, { language: event.target.value })
            }
          >
            <option>python</option>
            <option>javascript</option>
            <option>typescript</option>
            <option>text</option>
          </select>
          <textarea
            value={block.text}
            onFocus={onFocus}
            onChange={(event) => onUpdate(index, { text: event.target.value })}
          />
        </div>
      ) : block.type === "image" ? (
        <div className="image-editor">
          <label className="image-upload">
            <ImagePlus size={24} /> Upload image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(index, file);
              }}
            />
          </label>
          {block.src && (
            <Image src={block.src} alt={block.alt} width={760} height={260} unoptimized className="uploaded-image" />
          )}
          <input
            value={block.alt}
            onChange={(event) => onUpdate(index, { alt: event.target.value })}
            placeholder="Alt text"
          />
          <input
            value={block.caption}
            onChange={(event) =>
              onUpdate(index, { caption: event.target.value })
            }
            placeholder="Caption"
          />
        </div>
      ) : block.type === "divider" ? (
        <hr />
      ) : (
        <textarea
          className={
            block.type === "quote" ? "quote-editor" : "paragraph-editor"
          }
          value={text}
          onFocus={onFocus}
          onChange={(event) => onUpdate(index, { text: event.target.value })}
          placeholder="Write something..."
        />
      )}
    </div>
  );
}

function reorderTree(
  nodes: TreeNode[],
  dragId: string,
  targetId: string,
): TreeNode[] {
  const dragIndex = nodes.findIndex((node) => node.id === dragId);
  const targetIndex = nodes.findIndex((node) => node.id === targetId);
  if (dragIndex >= 0 && targetIndex >= 0) {
    const next = [...nodes];
    const [dragged] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, dragged);
    return next;
  }
  return nodes.map((node) =>
    node.children
      ? { ...node, children: reorderTree(node.children, dragId, targetId) }
      : node,
  );
}
function serializeDocument(document: Document) {
  const media: { path: string; base64: string }[] = [];
  const content = document.content.map((block) => {
    if (block.type !== "image" || !block.src.startsWith("data:")) return block;
    const match = block.src.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) return block;
    const path = block.assetPath ?? `public/media/images/${mediaSlug(document)}/image-${media.length + 1}.bin`;
    media.push({ path, base64: match[1] });
    return { ...block, src: `/${path.replace(/^public\//, "")}`, assetPath: path };
  });
  const serialized = { ...document, content, updatedAt: today };
  return {
    serialized,
    media,
    file: (path: string) => utf8File(path, serialized),
  };
}
function utf8File(path: string, value: unknown): PublishFile {
  return { path, content: `${JSON.stringify(value, null, 2)}\n`, encoding: "utf8" };
}
async function fileFromText(path: string, content: string): Promise<PublishFile> {
  return { path, content, encoding: "utf8" };
}
function mediaSlug(document: Document) {
  if (document.section) return `${document.section}/${document.slug}`.replace(/[^a-z0-9/]+/gi, "-").replace(/\/{2,}/g, "/");
  return document.slug;
}
function slugFromTitle(title: string) {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "untitled";
}
function createSlug(title: string, ...collections: Document[][]) {
  const taken = new Set(collections.flat().map((item) => item.slug));
  const base = slugFromTitle(title);
  let candidate = base;
  let index = 2;
  while (taken.has(candidate) || /^new-research-\d+$/.test(candidate)) candidate = `${base}-${index++}`;
  return candidate;
}
function titleCase(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function collectTreeNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((node) => [node, ...collectTreeNodes(node.children ?? [])]);
}
function sectionLabelFrom(tree: Tree, labels: Record<string, string>, nodeId: string) {
  const path = findTreePath(tree.roots, nodeId);
  if (!path.length) return titleCase(nodeId);
  return path.map((id) => labels[id] ?? titleCase(id)).join(" / ");
}
function headersFor(locale: Locale) {
  return getDocuments(locale).map((item) => item.id);
}
function publishedLibrary(documents: Document[], tree: Tree) {
  const visible = new Set(flattenTreeIds(tree));
  const allowed = new Set<Document["status"]>(visibleStatuses);
  return documents.filter((item) => visible.has(item.id) && allowed.has(item.status));
}
function flattenTreeIds(tree: Tree): string[] {
  const walk = (nodes: TreeNode[]): string[] =>
    nodes.flatMap((node) => [...(node.documentIds ?? []), ...walk(node.children ?? [])]);
  return walk(tree.roots);
}
function localizedTree(tree: Tree, labels: Record<string, string>): Tree {
  const localize = (nodes: TreeNode[]): TreeNode[] =>
    nodes.map((node) => ({
      ...node,
      title: labels[node.id] ?? node.title,
      children: node.children ? localize(node.children) : node.children,
    }));
  return { ...tree, roots: localize(tree.roots) };
}
function getLocaleTree(tree: Tree, labels: Record<string, string>, extra: Record<string, string>): Tree {
  return localizedTree(tree, { ...labels, ...extra });
}
function sectionLabelsFile(labels: Record<string, string>) {
  return {
    schemaVersion: 1,
    updatedAt: today,
    sections: Object.fromEntries(Object.entries(labels).map(([id, title]) => [id, { en: title, uz: title, ru: title }])),
  };
}
function buildSectionFile(tree: Tree, sectionId: string, labels: Record<string, string>): Promise<PublishFile> {
  return fileFromText("content/sections.json", `${JSON.stringify(sectionLabelsFile(labels), null, 2)}\n`);
}
function updateTreeNode(nodes: TreeNode[], nodeId: string, patch: Partial<TreeNode>): TreeNode[] {
  return nodes.map((node) => node.id === nodeId ? { ...node, ...patch } : node.children ? { ...node, children: updateTreeNode(node.children, nodeId, patch) } : node);
}
function removeTreeNode(nodes: TreeNode[], nodeId: string): TreeNode[] {
  return nodes.filter((node) => node.id !== nodeId).map((node) => node.children ? { ...node, children: removeTreeNode(node.children, nodeId) } : node);
}
function removeDocumentFromTree(nodes: TreeNode[], documentId: string): TreeNode[] {
  return nodes.map((node) => ({ ...node, documentIds: node.documentIds?.filter((id) => id !== documentId), children: node.children ? removeDocumentFromTree(node.children, documentId) : node.children }));
}
function collectDocumentIds(nodes: TreeNode[], targetId: string, inside = false): string[] {
  return nodes.flatMap((node) => { const isInside = inside || node.id === targetId; return [...(isInside ? node.documentIds ?? [] : []), ...(node.children ? collectDocumentIds(node.children, targetId, isInside) : [])]; });
}
function findTreeNode(nodes: TreeNode[], nodeId: string): TreeNode | undefined {
  for (const node of nodes) { if (node.id === nodeId) return node; const match = node.children && findTreeNode(node.children, nodeId); if (match) return match; }
  return undefined;
}
function findTreePath(nodes: TreeNode[], nodeId: string, parents: string[] = []): string[] {
  for (const node of nodes) { const next = [...parents, node.id]; if (node.id === nodeId) return next; if (node.children) { const match = findTreePath(node.children, nodeId, next); if (match.length) return match; } }
  return [];
}
function insertTreeChild(nodes: TreeNode[], parentId: string, child: TreeNode): TreeNode[] { return nodes.map((node) => node.id === parentId ? { ...node, children: [...(node.children ?? []), child] } : node.children ? { ...node, children: insertTreeChild(node.children, parentId, child) } : node); }
function addDocumentToTree(nodes: TreeNode[], sectionId: string, documentId: string): TreeNode[] { return nodes.map((node) => node.id === sectionId ? { ...node, documentIds: [...(node.documentIds ?? []), documentId] } : node.children ? { ...node, children: addDocumentToTree(node.children, sectionId, documentId) } : node); }
function readLocalDraft(locale: Locale, id: string): Document | undefined {
  try {
    const saved = window.localStorage.getItem(`field-notes-draft-${locale}-${id}`);
    return saved ? JSON.parse(saved) as Document : undefined;
  } catch {
    return undefined;
  }
}
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
