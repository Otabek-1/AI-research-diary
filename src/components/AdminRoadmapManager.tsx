"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Anchor,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Crown,
  ExternalLink,
  Link2,
  Lock,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  DestinationStatus,
  RoadmapData,
  RoadmapDestination,
  TreasureItem,
  getRoadmapText,
  resolveTreasureLink,
} from "@/lib/roadmap";

const today = () => new Date().toISOString().slice(0, 10);

const statusOptions: { value: DestinationStatus; label: string; hint: string; icon: typeof Lock }[] = [
  { value: "completed", label: "Done", hint: "Done: xazina olib bo'lingan", icon: CheckCircle2 },
  { value: "current", label: "Kema shu yerda", hint: "Current: kema shu manzilda turibdi", icon: Anchor },
  { value: "upcoming", label: "Hali kelmadim", hint: "Upcoming: hali kelinmagan / sirli tuman", icon: Lock },
];

export function AdminRoadmapManager({
  roadmap,
  onChange,
  onSaveToDrive,
  onClose,
  locale,
  isSaving = false,
}: {
  roadmap: RoadmapData;
  onChange: (updated: RoadmapData) => void;
  onSaveToDrive: () => Promise<void>;
  onClose: () => void;
  locale: string;
  isSaving?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"destinations" | "final">("destinations");
  const [expandedId, setExpandedId] = useState<string | null>(roadmap.destinations[0]?.id ?? null);
  const [drafts, setDrafts] = useState<Record<string, { title: string; link: string }>>({});
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape closes the dialog, focus moves into it, and the page behind it stops scrolling.
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [onClose]);

  const commit = (next: Partial<RoadmapData>) => onChange({ ...roadmap, ...next, updatedAt: today() });

  function updateDestination(id: string, patch: Partial<RoadmapDestination>) {
    commit({ destinations: roadmap.destinations.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  function setDestinationStatus(id: string, status: DestinationStatus) {
    commit({
      destinations: roadmap.destinations.map((item) => {
        if (item.id === id) return { ...item, status };
        // Only one island can hold the ship: the previous one counts as visited.
        if (status === "current" && item.status === "current") return { ...item, status: "completed" as DestinationStatus };
        return item;
      }),
    });
  }

  function addDestination() {
    const nextOrder = roadmap.destinations.length + 1;
    const id = `destination-${Date.now()}`;
    const destination: RoadmapDestination = {
      id,
      order: nextOrder,
      title: {
        en: `Expedition Stage ${nextOrder}`,
        uz: `${nextOrder}-Bosqich Manzili`,
        ru: `Этап экспедиции ${nextOrder}`,
      },
      description: {
        en: "Research frontier and key topics to explore.",
        uz: "Tadqiqot yo'nalishi va o'rganiladigan asosiy mavzular.",
        ru: "Исследовательский рубеж и ключевые темы.",
      },
      status: "upcoming",
      coordinates: { x: Math.min(85, 15 * nextOrder), y: 50 },
      treasures: [{ id: `t-${Date.now()}-1`, title: "Foundational Topic", type: "gem", completed: false }],
    };
    commit({ destinations: [...roadmap.destinations, destination] });
    setExpandedId(id);
  }

  function removeDestination(id: string) {
    if (!window.confirm("Bu manzilni o'chirib tashlamoqchimisiz?")) return;
    commit({
      destinations: roadmap.destinations.filter((item) => item.id !== id).map((item, index) => ({ ...item, order: index + 1 })),
    });
  }

  function moveDestination(id: string, direction: -1 | 1) {
    const sorted = [...roadmap.destinations].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    commit({ destinations: sorted.map((item, position) => ({ ...item, order: position + 1 })) });
  }

  function addTreasure(destinationId: string) {
    const draft = drafts[destinationId];
    const title = draft?.title.trim();
    if (!title) return;
    const target = roadmap.destinations.find((item) => item.id === destinationId);
    if (!target) return;
    const link = draft.link.trim();
    const treasure: TreasureItem = {
      id: `t-${Date.now()}`,
      title,
      linkUrl: link || undefined,
      type: "gem",
      completed: Boolean(link),
    };
    updateDestination(destinationId, { treasures: [...target.treasures, treasure] });
    setDrafts((current) => ({ ...current, [destinationId]: { title: "", link: "" } }));
  }

  function updateTreasure(destinationId: string, treasureId: string, patch: Partial<TreasureItem>) {
    const target = roadmap.destinations.find((item) => item.id === destinationId);
    if (!target) return;
    updateDestination(destinationId, {
      treasures: target.treasures.map((item) => (item.id === treasureId ? { ...item, ...patch } : item)),
    });
  }

  function removeTreasure(destinationId: string, treasureId: string) {
    const target = roadmap.destinations.find((item) => item.id === destinationId);
    if (!target) return;
    updateDestination(destinationId, { treasures: target.treasures.filter((item) => item.id !== treasureId) });
  }

  const sorted = [...roadmap.destinations].sort((a, b) => a.order - b.order);
  const final = roadmap.finalProject;
  const setFinal = (patch: Partial<RoadmapData["finalProject"]>) => commit({ finalProject: { ...final, ...patch } });
  const localized = (value: string | Record<string, string>, next: string) =>
    typeof value === "object" ? { ...value, [locale]: next } : next;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className="modal rm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rm-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="modal-head">
          <span className="modal-icon"><Compass size={20} /></span>
          <div className="modal-titles">
            <h2 id="rm-title">Treasure Map Roadmap Manager</h2>
            <p>Google Drive bilan ulangan progress boshqaruv paneli</p>
          </div>
          <div className="modal-head-actions">
            <Link href="/treasure-map" target="_blank" className="ghost-button">
              <ExternalLink size={13} /> Live Map
            </Link>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Yopish">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "destinations"}
            className={activeTab === "destinations" ? "is-active" : ""}
            onClick={() => setActiveTab("destinations")}
          >
            Manzillar va xazinalar <span>{roadmap.destinations.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "final"}
            className={`${activeTab === "final" ? "is-active " : ""}is-warm`}
            onClick={() => setActiveTab("final")}
          >
            <Crown size={13} /> Final Project (Yakuniy xazina)
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "destinations" && (
            <div className="rm-list">
              <div className="rm-toolbar">
                <p>Har bir bo&apos;lim bitta manzil. Kema qaysi manzilda turgani yoki qaysi manzil done bo&apos;lganini belgilang.</p>
                <button type="button" className="ghost-button is-accent" onClick={addDestination}>
                  <Plus size={14} /> Manzil qo&apos;shish
                </button>
              </div>

              {sorted.map((dest, index) => {
                const open = expandedId === dest.id;
                const claimed = dest.treasures.filter((item) => item.completed).length;
                const draft = drafts[dest.id] ?? { title: "", link: "" };
                const setDraft = (patch: Partial<{ title: string; link: string }>) =>
                  setDrafts((current) => ({ ...current, [dest.id]: { ...draft, ...patch } }));
                return (
                  <section key={dest.id} className={`rm-item is-${dest.status}`}>
                    <div className="rm-item-head">
                      <span className="rm-order">{String(dest.order).padStart(2, "0")}</span>
                      <div className="rm-item-title">
                        <h3>{getRoadmapText(dest.title, locale)}</h3>
                        <span>{claimed}/{dest.treasures.length} xazinalar olindi</span>
                      </div>
                      <div className="segmented" role="group" aria-label="Manzil holati">
                        {statusOptions.map((option) => (
                          <button
                            type="button"
                            key={option.value}
                            title={option.hint}
                            aria-pressed={dest.status === option.value}
                            className={`seg-${option.value}${dest.status === option.value ? " is-active" : ""}`}
                            onClick={() => setDestinationStatus(dest.id, option.value)}
                          >
                            <option.icon size={13} /> <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="rm-item-tools">
                        <button type="button" className="icon-button" aria-label="Yuqoriga" disabled={index === 0} onClick={() => moveDestination(dest.id, -1)}>
                          <ArrowUp size={14} />
                        </button>
                        <button type="button" className="icon-button" aria-label="Pastga" disabled={index === sorted.length - 1} onClick={() => moveDestination(dest.id, 1)}>
                          <ArrowDown size={14} />
                        </button>
                        <button type="button" className="icon-button" aria-expanded={open} aria-label={open ? "Yopish" : "Ochish"} onClick={() => setExpandedId(open ? null : dest.id)}>
                          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="rm-item-body">
                        <div className="form-grid">
                          <label className="field">
                            <span>Manzil nomi ({locale})</span>
                            <input
                              type="text"
                              value={getRoadmapText(dest.title, locale)}
                              onChange={(event) => updateDestination(dest.id, { title: localized(dest.title, event.target.value) })}
                            />
                          </label>
                          <label className="field">
                            <span>Tavsif ({locale})</span>
                            <input
                              type="text"
                              value={getRoadmapText(dest.description, locale)}
                              onChange={(event) => updateDestination(dest.id, { description: localized(dest.description, event.target.value) })}
                            />
                          </label>
                        </div>

                        <p className="field-label">Manzilda topiladigan xazinalar (mavzular)</p>
                        <div className="rm-treasures">
                          {dest.treasures.map((treasure) => {
                            const link = resolveTreasureLink(treasure);
                            return (
                              <div key={treasure.id} className={`rm-treasure${treasure.completed ? " is-done" : ""}`}>
                                <div className="rm-treasure-row">
                                  <input
                                    type="checkbox"
                                    checked={treasure.completed}
                                    aria-label={`${treasure.title} — olingan`}
                                    onChange={() => updateTreasure(dest.id, treasure.id, { completed: !treasure.completed })}
                                  />
                                  <input
                                    type="text"
                                    className="rm-treasure-title"
                                    value={treasure.title}
                                    placeholder="Mavzu nomi..."
                                    onChange={(event) => updateTreasure(dest.id, treasure.id, { title: event.target.value })}
                                  />
                                  <span className="rm-treasure-state">{treasure.completed ? "Olingan" : "Kutilmoqda"}</span>
                                  <button type="button" className="icon-button is-danger" title="O'chirish" aria-label="O'chirish" onClick={() => removeTreasure(dest.id, treasure.id)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="rm-treasure-link">
                                  <Link2 size={13} />
                                  <input
                                    type="text"
                                    placeholder="Masalan: neural-networks yoki /research/neural-networks"
                                    value={treasure.linkUrl ?? treasure.docSlug ?? ""}
                                    // Editing the link replaces the legacy docSlug, otherwise a cleared field would silently keep pointing at it.
                                    onChange={(event) => updateTreasure(dest.id, treasure.id, { linkUrl: event.target.value, docSlug: undefined })}
                                  />
                                  {link && (
                                    <a href={link} target="_blank" rel="noreferrer" title="Havolani ochib tekshirish" aria-label="Havolani ochish">
                                      <ExternalLink size={13} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="rm-add">
                          <input
                            type="text"
                            placeholder="Yangi xazina (mavzu) nomi..."
                            value={draft.title}
                            onChange={(event) => setDraft({ title: event.target.value })}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                addTreasure(dest.id);
                              }
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Research link (ixtiyoriy)..."
                            value={draft.link}
                            onChange={(event) => setDraft({ link: event.target.value })}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                addTreasure(dest.id);
                              }
                            }}
                          />
                          <button type="button" className="ghost-button is-accent" disabled={!draft.title.trim()} onClick={() => addTreasure(dest.id)}>
                            <Plus size={14} /> Qo&apos;shish
                          </button>
                        </div>

                        <div className="rm-danger">
                          <button type="button" className="text-danger" onClick={() => removeDestination(dest.id)}>
                            <Trash2 size={13} /> Bu manzilni o&apos;chirish
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
              {!sorted.length && <p className="empty-note">Hali manzillar yo&apos;q. «Manzil qo&apos;shish» tugmasini bosing.</p>}
            </div>
          )}

          {activeTab === "final" && (
            <div className="rm-final">
              <div className="rm-final-head">
                <Crown size={24} />
                <div>
                  <h3>Final Project: Yakuniy xazina</h3>
                  <span>Xaritaning oxiridagi eng oliy manzil va mukofot</span>
                </div>
              </div>
              <label className="field">
                <span>Final Project nomi ({locale})</span>
                <input type="text" value={getRoadmapText(final.title, locale)} onChange={(event) => setFinal({ title: localized(final.title, event.target.value) })} />
              </label>
              <label className="field">
                <span>Tavsif ({locale})</span>
                <textarea rows={3} value={getRoadmapText(final.description, locale)} onChange={(event) => setFinal({ description: localized(final.description, event.target.value) })} />
              </label>
              <label className="field">
                <span>Oliy mukofot (reward label)</span>
                <input type="text" value={final.reward ?? ""} onChange={(event) => setFinal({ reward: event.target.value })} />
              </label>
              <div className="field">
                <span>Final Project holati</span>
                <div className="segmented is-wide" role="group" aria-label="Final project holati">
                  {([
                    ["upcoming", "Kutilmoqda"],
                    ["current", "Kema yetib keldi"],
                    ["completed", "Zabt etildi"],
                  ] as const).map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={final.status === value}
                      className={`seg-${value}${final.status === value ? " is-active" : ""}`}
                      onClick={() => setFinal({ status: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="modal-foot">
          <span>Oxirgi yangilanish: {roadmap.updatedAt}</span>
          <div>
            <button type="button" className="ghost-button" onClick={onClose}>Yopish</button>
            <button type="button" className="primary-button" disabled={isSaving} onClick={() => void onSaveToDrive()}>
              <Upload size={15} /> {isSaving ? "Saqlanmoqda..." : "Google Drive'ga saqlash"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
