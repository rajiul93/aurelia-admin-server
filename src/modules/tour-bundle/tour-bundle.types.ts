export type BundleManifestFile = {
  path: string;
  checksum: string;
  size: number;
};

export type BundleManifest = {
  version: string;
  bundleId: string;
  tourId: string;
  checksum: string;
  signature: string;
  signatureAlgorithm: string;
  createdAt: string;
  languages: string[];
  tourBundleVersion: number;
  mediaVersion: number;
  aiKnowledgeVersion: number;
  routeVersion: number;
  sqliteVersion: string;
  files: BundleManifestFile[];
};

export type SearchDocument = {
  id: string;
  language: string;
  audience: string;
  type: "tour" | "spot" | "spot_faq" | "ai_knowledge";
  tourId: string;
  spotId: string | null;
  title: string;
  body: string;
  keywords: string;
};

export type TourBundleDto = {
  id: string;
  tourId: string;
  bundleId: string;
  tourBundleVersion: number;
  mediaVersion: number;
  aiKnowledgeVersion: number;
  routeVersion: number;
  languages: string[];
  manifest: BundleManifest;
  checksum: string;
  signature: string;
  signatureAlgorithm: string;
  fileCount: number;
  createdAt: string;
};

export type TourBundleDetailDto = TourBundleDto & {
  content: unknown;
  searchDocuments: SearchDocument[];
};
