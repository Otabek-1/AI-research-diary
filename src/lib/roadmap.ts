import defaultRoadmapData from "../../content/roadmap.json";

export type DestinationStatus = "completed" | "current" | "upcoming";

export type TreasureType = "gem" | "scroll" | "artifact" | "key";

export type TreasureItem = {
  id: string;
  title: string;
  type?: TreasureType;
  completed: boolean;
  docSlug?: string;
  linkUrl?: string;
};

export type RoadmapDestination = {
  id: string;
  order: number;
  title: string | Record<string, string>;
  description: string | Record<string, string>;
  status: DestinationStatus;
  coordinates: { x: number; y: number };
  treasures: TreasureItem[];
};

export type RoadmapFinalProject = {
  id: string;
  title: string | Record<string, string>;
  description: string | Record<string, string>;
  status: DestinationStatus;
  reward?: string;
  coordinates?: { x: number; y: number };
};

export type RoadmapData = {
  schemaVersion: number;
  updatedAt: string;
  title: string | Record<string, string>;
  subtitle: string | Record<string, string>;
  finalProject: RoadmapFinalProject;
  destinations: RoadmapDestination[];
};

export const defaultRoadmap = defaultRoadmapData as RoadmapData;

export function getRoadmapText(
  value: string | Record<string, string> | undefined,
  locale: string,
  fallback = "",
): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value[locale] ?? value.en ?? Object.values(value)[0] ?? fallback;
}

export function resolveTreasureLink(treasure: TreasureItem): string | null {
  if (treasure.linkUrl && treasure.linkUrl.trim()) {
    const raw = treasure.linkUrl.trim();
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return raw;
    }
    if (raw.startsWith("/")) {
      return raw;
    }
    return `/research/${raw}`;
  }
  if (treasure.docSlug && treasure.docSlug.trim()) {
    return `/research/${treasure.docSlug.trim()}`;
  }
  return null;
}

export function computeRoadmapProgress(roadmap: RoadmapData) {
  const totalDestinations = roadmap.destinations.length;
  const completedDestinations = roadmap.destinations.filter(
    (d) => d.status === "completed",
  ).length;
  const currentDestination = roadmap.destinations.find(
    (d) => d.status === "current",
  );

  const allTreasures = roadmap.destinations.flatMap((d) => d.treasures);
  const totalTreasures = allTreasures.length;
  const collectedTreasures = allTreasures.filter((t) => t.completed).length;

  const percentage =
    totalDestinations > 0
      ? Math.round(
          ((completedDestinations +
            (roadmap.finalProject.status === "completed" ? 1 : 0)) /
            (totalDestinations + 1)) *
            100,
        )
      : 0;

  return {
    totalDestinations,
    completedDestinations,
    currentDestination,
    totalTreasures,
    collectedTreasures,
    percentage,
    isFinalReached:
      roadmap.finalProject.status === "completed" ||
      roadmap.finalProject.status === "current",
  };
}

export function parseRoadmapFromFiles(
  files: { path: string; content: string }[],
): RoadmapData | null {
  const roadmapFile = files.find(
    (f) => f.path === "content/roadmap.json" || f.path === "roadmap.json",
  );
  if (!roadmapFile) return null;
  try {
    const raw = Buffer.from(roadmapFile.content, "base64").toString("utf8");
    return JSON.parse(raw) as RoadmapData;
  } catch {
    return null;
  }
}
