import type { StaffRole } from "@/types/auth";

export type HandbookSection = {
  id: string;
  title: string;
  roles: StaffRole[];
  items: HandbookItem[];
};

export type HandbookItem = {
  type: "paragraph" | "steps" | "table" | "checklist" | "tip";
  content: string | string[];
  columns?: string[];
  rows?: string[][];
};

export const handbookSections: HandbookSection[] = [
  {
    id: "platform-overview",
    title: "Platform Overview",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    items: [
      {
        type: "paragraph",
        content:
          "Aurelia Admin is the staff portal for authoring tours, granting mobile access, and managing remote app content for the offline-first walking-tour mobile app.",
      },
      {
        type: "paragraph",
        content:
          "Content model: Tour → Floors → Spots & Route. Each piece of content supports translations for English, Spanish, and French, and can be tailored for different audiences (Children, Adults, Students, Professors).",
      },
      {
        type: "paragraph",
        content:
          "Mobile unlock: Admin sets a phone number and 4-digit PIN for each buyer, then shares these credentials manually. Each grant has device seats and an expiry date.",
      },
    ],
  },
  {
    id: "roles-permissions",
    title: "Roles & Permissions",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    items: [
      {
        type: "table",
        content: "Staff role capabilities",
        columns: ["Role", "Can Access", "Cannot Access"],
        rows: [
          [
            "MANAGER",
            "Tours, FAQs, Knowledge, App Content, Profile",
            "Access Mgmt, Audit Log, Subscriptions",
          ],
          [
            "ADMIN",
            "Everything MANAGER can + Access Mgmt, Audit Log, Subscriptions",
            "—",
          ],
          ["SUPERADMIN", "Full system access", "—"],
        ],
      },
      {
        type: "tip",
        content:
          "If you cannot open a page, check with your administrator about your role assignment.",
      },
    ],
  },
  {
    id: "grant-access",
    title: "How to Grant Tour Access",
    roles: ["SUPERADMIN", "ADMIN"],
    items: [
      {
        type: "paragraph",
        content:
          "This is the primary workflow for giving buyers access to tours on the mobile app.",
      },
      {
        type: "steps",
        content: [
          "Open Access Mgmt and click Create Grant.",
          "Enter the buyer's phone number (format it as they would type it, e.g. +1234567890).",
          "Set a 4-digit PIN, activation date, expiry date, and maximum devices.",
          "Select which tours they can access. Optionally set a visit date and start time for reminders.",
          "Send the phone and PIN to the buyer via SMS or WhatsApp. Do not email the PIN from this system.",
          "The buyer unlocks once per device. Device removal is admin-only — signing out on the app does not free a seat.",
        ],
      },
      {
        type: "tip",
        content:
          "Security note: 5 wrong PIN attempts lock the account for 15 minutes. Unknown phone and wrong PIN return the same error message to prevent guessing.",
      },
    ],
  },
  {
    id: "author-tour",
    title: "How to Author & Publish a Tour",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    items: [
      {
        type: "steps",
        content: [
          "Create or edit a tour in Tour Management: set cover image, slug, translations, and lifecycle status.",
          "Add Floors for multi-level venues, then add Spots to each floor.",
          "Generate the route for each floor from its spots.",
          "Add media, AI knowledge entries, and hosts as needed.",
          "Move the lifecycle status toward PUBLISHED when content is ready.",
          "After publishing, the mobile app will download a signed offline bundle with the latest content.",
        ],
      },
      {
        type: "checklist",
        content: [
          "Translations complete for required languages?",
          "Route generated for each floor?",
          "Cover images set for tour and floors?",
        ],
      },
    ],
  },
  {
    id: "release-config",
    title: "Mobile Sync & Release Config",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    items: [
      {
        type: "paragraph",
        content:
          "App Content controls UI strings and assets. Changes bump appContentVersion so the mobile app syncs the latest content.",
      },
      {
        type: "paragraph",
        content:
          "The release config panel controls API version, maintenance mode, feature flags, venue timezone, and tour reminder cadence.",
      },
      {
        type: "tip",
        content:
          "Venue timezone affects when hosts show as 'Available now'. Use an IANA timezone like Europe/Rome, not UTC offsets.",
      },
      {
        type: "tip",
        content:
          "If the mobile app shows errors after a release, escalate to engineering immediately — migrations may be required.",
      },
    ],
  },
  {
    id: "support-content",
    title: "Support Content Overview",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    items: [
      {
        type: "table",
        content: "Content types and their purposes",
        columns: ["Area", "Route", "Use For"],
        rows: [
          [
            "FAQ Categories + FAQs",
            "/faqs/categories, /faqs",
            "In-app help Q&A, localized per language",
          ],
          [
            "Knowledge Base",
            "/knowledge",
            "AI assistant knowledge pack, info pages, legal pages",
          ],
          [
            "App UI Strings",
            "/app-content/strings",
            "Buttons, labels, error messages in the app shell",
          ],
        ],
      },
      {
        type: "tip",
        content:
          "Category images are shared across languages. FAQ questions and answers are translated per locale.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    roles: ["SUPERADMIN", "ADMIN", "MANAGER"],
    items: [
      {
        type: "table",
        content: "Common issues and solutions",
        columns: ["Symptom", "Action"],
        rows: [
          [
            "Buyer cannot unlock",
            "Verify phone format, check activation/expiry dates, confirm PIN, check device limit, ensure grant is not revoked. Wait 15 min if locked out.",
          ],
          [
            "Host always shows offline",
            "Check venue timezone in release config. Verify host hours are in HH:mm format.",
          ],
          [
            "Tour not in app catalog",
            "Check tour publish status and lifecycle. Confirm the grant includes that tour.",
          ],
          [
            "Admin shows loading errors",
            "Retry the page. Frequent 503 errors may indicate a database cold start — escalate if persistent.",
          ],
        ],
      },
    ],
  },
];

export function getSectionsForRole(role: StaffRole): HandbookSection[] {
  return handbookSections.filter((section) => section.roles.includes(role));
}
