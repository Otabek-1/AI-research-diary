"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  Anchor,
  Lock,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Crown,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import { Locale } from "@/lib/content";
import {
  RoadmapData,
  RoadmapDestination,
  TreasureItem,
  DestinationStatus,
  getRoadmapText,
} from "@/lib/roadmap";

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
  locale: Locale;
  isSaving?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"destinations" | "final">("destinations");
  const [expandedId, setExpandedId] = useState<string | null>(
    roadmap.destinations[0]?.id ?? null,
  );
  const [newTreasureTitle, setNewTreasureTitle] = useState("");

  function updateDestination(id: string, patch: Partial<RoadmapDestination>) {
    const nextDestinations = roadmap.destinations.map((d) => {
      if (d.id !== id) return d;
      return { ...d, ...patch };
    });
    onChange({ ...roadmap, destinations: nextDestinations, updatedAt: new Date().toISOString().slice(0, 10) });
  }

  function setDestinationStatus(id: string, status: DestinationStatus) {
    const nextDestinations = roadmap.destinations.map((d) => {
      if (d.id === id) {
        return { ...d, status };
      }
      // If setting this to current, other current destinations become upcoming or stay as is
      if (status === "current" && d.status === "current") {
        return { ...d, status: "completed" as DestinationStatus };
      }
      return d;
    });
    onChange({ ...roadmap, destinations: nextDestinations, updatedAt: new Date().toISOString().slice(0, 10) });
  }

  function addDestination() {
    const nextOrder = roadmap.destinations.length + 1;
    const newId = `destination-${Date.now()}`;
    const newDestination: RoadmapDestination = {
      id: newId,
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
      treasures: [
        {
          id: `t-${Date.now()}-1`,
          title: "Foundational Topic",
          type: "gem",
          completed: false,
        },
      ],
    };

    onChange({
      ...roadmap,
      destinations: [...roadmap.destinations, newDestination],
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setExpandedId(newId);
  }

  function removeDestination(id: string) {
    if (!window.confirm("Bu manzilni o'chirib tashlamoqchimisiz?")) return;
    const nextDestinations = roadmap.destinations
      .filter((d) => d.id !== id)
      .map((d, index) => ({ ...d, order: index + 1 }));
    onChange({
      ...roadmap,
      destinations: nextDestinations,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  }

  function addTreasureToDestination(destinationId: string) {
    if (!newTreasureTitle.trim()) return;
    const target = roadmap.destinations.find((d) => d.id === destinationId);
    if (!target) return;

    const newTreasure: TreasureItem = {
      id: `t-${Date.now()}`,
      title: newTreasureTitle.trim(),
      type: "gem",
      completed: false,
    };

    updateDestination(destinationId, {
      treasures: [...target.treasures, newTreasure],
    });
    setNewTreasureTitle("");
  }

  function toggleTreasure(destinationId: string, treasureId: string) {
    const target = roadmap.destinations.find((d) => d.id === destinationId);
    if (!target) return;

    const nextTreasures = target.treasures.map((t) =>
      t.id === treasureId ? { ...t, completed: !t.completed } : t,
    );
    updateDestination(destinationId, { treasures: nextTreasures });
  }

  function removeTreasure(destinationId: string, treasureId: string) {
    const target = roadmap.destinations.find((d) => d.id === destinationId);
    if (!target) return;

    const nextTreasures = target.treasures.filter((t) => t.id !== treasureId);
    updateDestination(destinationId, { treasures: nextTreasures });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111513] border border-[#2b302e] w-full max-w-4xl max-h-[90vh] flex flex-col rounded shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#2b302e] flex items-center justify-between bg-[#161c19]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#c7ed6b18] text-[#c7ed6b] flex items-center justify-center">
              <Compass size={20} />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-normal text-[#e9e7df] m-0">
                Treasure Map Roadmap Manager
              </h2>
              <p className="font-mono text-xs text-[#8e918d] m-0">
                Google Drive bilan ulangan progress boshqaruv paneli
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/treasure-map`}
              target="_blank"
              className="px-3 py-1.5 border border-[#2b302e] hover:border-[#c7ed6b] text-[#8e918d] hover:text-[#c7ed6b] font-mono text-xs rounded inline-flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink size={13} />
              <span>Live Map</span>
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8e918d] hover:text-[#e9e7df] rounded hover:bg-[#202723]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#2b302e] bg-[#0e1210] px-5">
          <button
            onClick={() => setActiveTab("destinations")}
            className={`py-3 px-4 font-mono text-xs uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "destinations"
                ? "border-[#c7ed6b] text-[#c7ed6b] font-bold"
                : "border-transparent text-[#8e918d] hover:text-[#e9e7df]"
            }`}
          >
            🗺️ Manzillar va Xazinalar ({roadmap.destinations.length})
          </button>
          <button
            onClick={() => setActiveTab("final")}
            className={`py-3 px-4 font-mono text-xs uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === "final"
                ? "border-[#e5a875] text-[#e5a875] font-bold"
                : "border-transparent text-[#8e918d] hover:text-[#e9e7df]"
            }`}
          >
            👑 Final Project (Yakuniy Xazina)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "destinations" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs text-[#8e918d]">
                  Har bir bo&apos;lim bitta manzil. Kema qaysi manzilda turgani yoki qaysi manzil done bo&apos;lganini belgilang:
                </span>
                <button
                  onClick={addDestination}
                  className="px-3 py-1.5 bg-[#1a231e] border border-[#2b302e] hover:border-[#c7ed6b] text-[#c7ed6b] font-mono text-xs rounded inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Manzil qo&apos;shish
                </button>
              </div>

              {roadmap.destinations.map((dest) => {
                const isExpanded = expandedId === dest.id;
                const destTitle = getRoadmapText(dest.title, locale);

                return (
                  <div
                    key={dest.id}
                    className={`border rounded transition-all ${
                      dest.status === "completed"
                        ? "border-[#29422f] bg-[#0f1612]"
                        : dest.status === "current"
                        ? "border-[#4a3b25] bg-[#171510]"
                        : "border-[#222825] bg-[#121614]"
                    }`}
                  >
                    {/* Destination Row Header */}
                    <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[#8e918d]">
                          0{dest.order}.
                        </span>
                        <div>
                          <h3 className="font-serif text-lg text-[#e9e7df] m-0">
                            {destTitle}
                          </h3>
                          <span className="font-mono text-[10px] text-[#8e918d]">
                            {dest.treasures.filter((t) => t.completed).length}/
                            {dest.treasures.length} xazinalar olindi
                          </span>
                        </div>
                      </div>

                      {/* Status Badges / Selectors */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDestinationStatus(dest.id, "completed")}
                          className={`px-2.5 py-1 rounded font-mono text-xs inline-flex items-center gap-1.5 border transition-all ${
                            dest.status === "completed"
                              ? "bg-[#c7ed6b22] border-[#c7ed6b] text-[#c7ed6b] font-bold"
                              : "border-[#2b302e] text-[#8e918d] hover:text-[#e9e7df]"
                          }`}
                          title="Done: Xazina olib bo'lingan"
                        >
                          <CheckCircle2 size={13} />
                          <span>Done</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDestinationStatus(dest.id, "current")}
                          className={`px-2.5 py-1 rounded font-mono text-xs inline-flex items-center gap-1.5 border transition-all ${
                            dest.status === "current"
                              ? "bg-[#e5a87522] border-[#e5a875] text-[#e5a875] font-bold"
                              : "border-[#2b302e] text-[#8e918d] hover:text-[#e9e7df]"
                          }`}
                          title="Current: Bizning kema shu manzilda turibdi"
                        >
                          <Anchor size={13} />
                          <span>Kema Shu Yerda</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDestinationStatus(dest.id, "upcoming")}
                          className={`px-2.5 py-1 rounded font-mono text-xs inline-flex items-center gap-1.5 border transition-all ${
                            dest.status === "upcoming"
                              ? "bg-[#8e918d22] border-[#8e918d] text-[#e9e7df] font-bold"
                              : "border-[#2b302e] text-[#8e918d] hover:text-[#e9e7df]"
                          }`}
                          title="Upcoming: Hali kelinmagan / Sirli tuman"
                        >
                          <Lock size={13} />
                          <span>Hali Kelmadim</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : dest.id)}
                          className="p-1.5 text-[#8e918d] hover:text-[#e9e7df] ml-1"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Destination Expanded Details */}
                    {isExpanded && (
                      <div className="p-4 border-t border-[#222825] bg-[#0c0f0d] space-y-4">
                        {/* Title & Description inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-mono text-[10px] uppercase text-[#8e918d] mb-1">
                              Manzil nomi ({locale})
                            </label>
                            <input
                              type="text"
                              value={getRoadmapText(dest.title, locale)}
                              onChange={(e) => {
                                const newTitle =
                                  typeof dest.title === "object"
                                    ? { ...dest.title, [locale]: e.target.value }
                                    : e.target.value;
                                updateDestination(dest.id, { title: newTitle });
                              }}
                              className="w-full bg-[#161c19] border border-[#2b302e] text-[#e9e7df] p-2 text-sm rounded outline-none focus:border-[#c7ed6b]"
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[10px] uppercase text-[#8e918d] mb-1">
                              Tavsif ({locale})
                            </label>
                            <input
                              type="text"
                              value={getRoadmapText(dest.description, locale)}
                              onChange={(e) => {
                                const newDesc =
                                  typeof dest.description === "object"
                                    ? { ...dest.description, [locale]: e.target.value }
                                    : e.target.value;
                                updateDestination(dest.id, { description: newDesc });
                              }}
                              className="w-full bg-[#161c19] border border-[#2b302e] text-[#e9e7df] p-2 text-sm rounded outline-none focus:border-[#c7ed6b]"
                            />
                          </div>
                        </div>

                        {/* Treasures List (Ichidagi mavzular) */}
                        <div>
                          <label className="block font-mono text-[10px] uppercase text-[#c7ed6b] mb-2">
                            💎 Manzilda topiladigan xazinalar (mavzular):
                          </label>

                          <div className="space-y-2 mb-3">
                            {dest.treasures.map((treasure) => (
                              <div
                                key={treasure.id}
                                className={`flex items-center justify-between gap-3 p-2.5 rounded border text-sm ${
                                  treasure.completed
                                    ? "bg-[#142017] border-[#29422f]"
                                    : "bg-[#141816] border-[#242c28]"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={treasure.completed}
                                    onChange={() => toggleTreasure(dest.id, treasure.id)}
                                    className="accent-[#c7ed6b] cursor-pointer w-4 h-4"
                                    id={`t-chk-${treasure.id}`}
                                  />
                                  <label
                                    htmlFor={`t-chk-${treasure.id}`}
                                    className={`cursor-pointer ${
                                      treasure.completed
                                        ? "text-[#c7ed6b] font-medium"
                                        : "text-[#e9e7df]"
                                    }`}
                                  >
                                    {treasure.title}
                                  </label>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-[#8e918d] uppercase">
                                    {treasure.completed ? "Olingan" : "Kutilmoqda"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeTreasure(dest.id, treasure.id)}
                                    className="p-1 text-[#8e918d] hover:text-red-400"
                                    title="O'chirish"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Add Treasure inline */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Yangi xazina (mavzu) nomi..."
                              value={newTreasureTitle}
                              onChange={(e) => setNewTreasureTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addTreasureToDestination(dest.id);
                                }
                              }}
                              className="flex-1 bg-[#161c19] border border-[#2b302e] text-[#e9e7df] px-3 py-1.5 text-xs rounded outline-none focus:border-[#c7ed6b]"
                            />
                            <button
                              type="button"
                              onClick={() => addTreasureToDestination(dest.id)}
                              className="px-3 py-1.5 bg-[#202923] border border-[#2b302e] hover:border-[#c7ed6b] text-[#c7ed6b] font-mono text-xs rounded"
                            >
                              + Qo&apos;shish
                            </button>
                          </div>
                        </div>

                        {/* Delete Destination button */}
                        <div className="pt-2 border-t border-[#1e2421] flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeDestination(dest.id)}
                            className="text-red-400 hover:text-red-300 font-mono text-xs inline-flex items-center gap-1.5 p-1"
                          >
                            <Trash2 size={13} /> Bu manzilni o&apos;chirish
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "final" && (
            <div className="space-y-4 bg-[#14120e] p-5 rounded border border-[#3f311c]">
              <div className="flex items-center gap-3">
                <Crown size={22} className="text-[#e5a875]" />
                <div>
                  <h3 className="font-serif text-xl text-[#e5a875] m-0">
                    Final Project: Yakuniy Xazina
                  </h3>
                  <span className="font-mono text-xs text-[#8e918d]">
                    Xaritaning oxiridagi eng oliy manzil va mukofot
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#8e918d] mb-1">
                  Final Project Nomi ({locale})
                </label>
                <input
                  type="text"
                  value={getRoadmapText(roadmap.finalProject.title, locale)}
                  onChange={(e) => {
                    const newTitle =
                      typeof roadmap.finalProject.title === "object"
                        ? { ...roadmap.finalProject.title, [locale]: e.target.value }
                        : e.target.value;
                    onChange({
                      ...roadmap,
                      finalProject: { ...roadmap.finalProject, title: newTitle },
                    });
                  }}
                  className="w-full bg-[#1c1813] border border-[#3f311c] text-[#e9e7df] p-2 text-sm rounded outline-none focus:border-[#e5a875]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#8e918d] mb-1">
                  Tavsif ({locale})
                </label>
                <textarea
                  value={getRoadmapText(roadmap.finalProject.description, locale)}
                  onChange={(e) => {
                    const newDesc =
                      typeof roadmap.finalProject.description === "object"
                        ? { ...roadmap.finalProject.description, [locale]: e.target.value }
                        : e.target.value;
                    onChange({
                      ...roadmap,
                      finalProject: { ...roadmap.finalProject, description: newDesc },
                    });
                  }}
                  rows={2}
                  className="w-full bg-[#1c1813] border border-[#3f311c] text-[#e9e7df] p-2 text-sm rounded outline-none focus:border-[#e5a875]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#8e918d] mb-1">
                  Oliy Mukofot (Reward label)
                </label>
                <input
                  type="text"
                  value={roadmap.finalProject.reward ?? ""}
                  onChange={(e) => {
                    onChange({
                      ...roadmap,
                      finalProject: { ...roadmap.finalProject, reward: e.target.value },
                    });
                  }}
                  className="w-full bg-[#1c1813] border border-[#3f311c] text-[#e9e7df] p-2 text-sm rounded outline-none focus:border-[#e5a875]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#8e918d] mb-1">
                  Final Project Holati
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...roadmap,
                        finalProject: { ...roadmap.finalProject, status: "upcoming" },
                      })
                    }
                    className={`px-3 py-1.5 rounded font-mono text-xs border ${
                      roadmap.finalProject.status === "upcoming"
                        ? "bg-[#8e918d22] border-[#8e918d] text-[#e9e7df] font-bold"
                        : "border-[#2b302e] text-[#8e918d]"
                    }`}
                  >
                    Kutilmoqda (Upcoming)
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...roadmap,
                        finalProject: { ...roadmap.finalProject, status: "current" },
                      })
                    }
                    className={`px-3 py-1.5 rounded font-mono text-xs border ${
                      roadmap.finalProject.status === "current"
                        ? "bg-[#e5a87522] border-[#e5a875] text-[#e5a875] font-bold"
                        : "border-[#2b302e] text-[#8e918d]"
                    }`}
                  >
                    Kema Yetib Keldi (Current)
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...roadmap,
                        finalProject: { ...roadmap.finalProject, status: "completed" },
                      })
                    }
                    className={`px-3 py-1.5 rounded font-mono text-xs border ${
                      roadmap.finalProject.status === "completed"
                        ? "bg-[#c7ed6b22] border-[#c7ed6b] text-[#c7ed6b] font-bold"
                        : "border-[#2b302e] text-[#8e918d]"
                    }`}
                  >
                    Zabt Etildi (Done)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2b302e] bg-[#161c19] flex items-center justify-between flex-wrap gap-3">
          <span className="font-mono text-xs text-[#8e918d]">
            Oxirgi yangilanish: {roadmap.updatedAt}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#2b302e] hover:border-[#8e918d] text-[#e9e7df] font-mono text-xs rounded"
            >
              Yopish
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onSaveToDrive}
              className="px-5 py-2 bg-[#c7ed6b] hover:bg-[#ddfa91] text-[#161a16] font-mono text-xs font-bold rounded inline-flex items-center gap-2 transition-all shadow-lg shadow-[#c7ed6b22]"
            >
              <Upload size={15} />
              <span>{isSaving ? "Saqlanmoqda..." : "Google Drive'ga Saqlash"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
