import { prisma } from "./prisma";

export interface BrandConfig {
  name: string;
  nameTh: string;
  tagline: string;
  phone: string;
  address: string;
  logo: string;
  favicon: string;
  colors: {
    dark: string;
    teal: string;
    mint: string;
    accent: string;
    white: string;
    bg: string;
  };
}

const defaults: BrandConfig = {
  name: "MorMac",
  nameTh: "หมอแมค",
  tagline: "Apple Device Specialist",
  phone: "",
  address: "",
  logo: "/brand/logo.png",
  favicon: "/favicon.ico",
  colors: {
    dark: "#0F1720",
    teal: "#4A7A8A",
    mint: "#85C1B2",
    accent: "#28EF33",
    white: "#FFFFFF",
    bg: "#f8fafb",
  },
};

export const brand = defaults;

export async function getBrand(): Promise<BrandConfig> {
  try {
    const rows = await prisma.config.findMany({
      where: { key: { startsWith: "brand." } },
    });

    if (rows.length === 0) return defaults;

    const cfg = { ...defaults, colors: { ...defaults.colors } };

    for (const row of rows) {
      const field = row.key.replace("brand.", "");
      switch (field) {
        case "name": cfg.name = row.value; break;
        case "nameTh": cfg.nameTh = row.value; break;
        case "tagline": cfg.tagline = row.value; break;
        case "phone": cfg.phone = row.value; break;
        case "address": cfg.address = row.value; break;
        case "logo": cfg.logo = row.value; break;
        case "colors.dark": cfg.colors.dark = row.value; break;
        case "colors.teal": cfg.colors.teal = row.value; break;
        case "colors.mint": cfg.colors.mint = row.value; break;
        case "colors.accent": cfg.colors.accent = row.value; break;
        case "colors.bg": cfg.colors.bg = row.value; break;
      }
    }

    return cfg;
  } catch {
    return defaults;
  }
}

export async function saveBrand(config: Partial<BrandConfig>): Promise<void> {
  const entries: { key: string; value: string }[] = [];

  if (config.name !== undefined) entries.push({ key: "brand.name", value: config.name });
  if (config.nameTh !== undefined) entries.push({ key: "brand.nameTh", value: config.nameTh });
  if (config.tagline !== undefined) entries.push({ key: "brand.tagline", value: config.tagline });
  if (config.phone !== undefined) entries.push({ key: "brand.phone", value: config.phone });
  if (config.address !== undefined) entries.push({ key: "brand.address", value: config.address });
  if (config.logo !== undefined) entries.push({ key: "brand.logo", value: config.logo });
  if (config.colors) {
    const c = config.colors;
    if (c.dark) entries.push({ key: "brand.colors.dark", value: c.dark });
    if (c.teal) entries.push({ key: "brand.colors.teal", value: c.teal });
    if (c.mint) entries.push({ key: "brand.colors.mint", value: c.mint });
    if (c.accent) entries.push({ key: "brand.colors.accent", value: c.accent });
    if (c.bg) entries.push({ key: "brand.colors.bg", value: c.bg });
  }

  for (const { key, value } of entries) {
    await prisma.config.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
