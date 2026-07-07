import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedPlans() {
  const existing = await prisma.subscriptionPlan.count();
  if (existing > 0) {
    console.log("SubscriptionPlan already seeded, skipping.");
    return;
  }

  await prisma.subscriptionPlan.createMany({
    data: [
      { name: "1 Week", durationInDays: 7, basePrice: 5, sortOrder: 0 },
      { name: "1 Month", durationInDays: 30, basePrice: 15, sortOrder: 1 },
      { name: "3 Months", durationInDays: 90, basePrice: 30, sortOrder: 2 },
    ],
  });
  console.log("Seeded SubscriptionPlan rows.");
}

async function seedDeviceTiers() {
  const existing = await prisma.devicePricingTier.count();
  if (existing > 0) {
    console.log("DevicePricingTier already seeded, skipping.");
    return;
  }

  await prisma.devicePricingTier.createMany({
    data: [
      { deviceCount: 2, additionalPrice: 5 },
      { deviceCount: 3, additionalPrice: 10 },
    ],
  });
  console.log("Seeded DevicePricingTier rows.");
}

async function seedPricingSettings() {
  await prisma.subscriptionPricingSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      currency: "EUR",
      multiDeviceDiscountEnabled: true,
      multiDeviceDiscountPercent: 10,
      maxDevicesPerPurchase: 10,
    },
    update: {},
  });
  console.log("Ensured SubscriptionPricingSettings singleton exists.");
}

const DEFAULT_PAGES: {
  key: string;
  category: "INFO_PAGE" | "LEGAL";
  icon: string;
  sortOrder: number;
  title: { en: string; es: string; fr: string };
}[] = [
  {
    key: "about",
    category: "INFO_PAGE",
    icon: "information-circle-outline",
    sortOrder: 0,
    title: { en: "About", es: "Acerca de", fr: "À propos" },
  },
  {
    key: "contact-us",
    category: "INFO_PAGE",
    icon: "mail-outline",
    sortOrder: 1,
    title: { en: "Contact Us", es: "Contáctanos", fr: "Nous contacter" },
  },
  {
    key: "help-support",
    category: "INFO_PAGE",
    icon: "help-buoy-outline",
    sortOrder: 2,
    title: {
      en: "Help & Support",
      es: "Ayuda y soporte",
      fr: "Aide et assistance",
    },
  },
  {
    key: "privacy-policy",
    category: "LEGAL",
    icon: "shield-checkmark-outline",
    sortOrder: 3,
    title: {
      en: "Privacy Policy",
      es: "Política de privacidad",
      fr: "Politique de confidentialité",
    },
  },
  {
    key: "terms-conditions",
    category: "LEGAL",
    icon: "document-text-outline",
    sortOrder: 4,
    title: {
      en: "Terms & Conditions",
      es: "Términos y condiciones",
      fr: "Conditions générales",
    },
  },
  {
    key: "cookie-policy",
    category: "LEGAL",
    icon: "settings-outline",
    sortOrder: 5,
    title: {
      en: "Cookie Policy",
      es: "Política de cookies",
      fr: "Politique de cookies",
    },
  },
  {
    key: "licenses",
    category: "LEGAL",
    icon: "code-slash-outline",
    sortOrder: 6,
    title: {
      en: "Licenses",
      es: "Licencias",
      fr: "Licences",
    },
  },
];

async function seedKnowledgePages() {
  for (const page of DEFAULT_PAGES) {
    const existing = await prisma.knowledgeArticle.findUnique({
      where: { key: page.key },
    });
    if (existing) {
      continue;
    }

    const placeholder = (title: string) =>
      `<p>${title} content goes here. Edit this page in the Admin Panel.</p>`;

    await prisma.knowledgeArticle.create({
      data: {
        key: page.key,
        category: page.category,
        includeInAssistant: false,
        icon: page.icon,
        sortOrder: page.sortOrder,
        translations: {
          create: (["en", "es", "fr"] as const).map((language) => ({
            language,
            title: page.title[language],
            bodyHtml: placeholder(page.title[language]),
            bodyText: `${page.title[language]} content goes here. Edit this page in the Admin Panel.`,
          })),
        },
      },
    });
  }
  console.log("Ensured default info/legal pages exist.");
}

async function main() {
  await seedPlans();
  await seedDeviceTiers();
  await seedPricingSettings();
  await seedKnowledgePages();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
