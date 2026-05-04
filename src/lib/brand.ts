export const brand = {
  name: "MorMac",
  nameTh: "หมอแมค",
  tagline: "Apple Device Specialist",
  phone: "",
  address: "",

  colors: {
    dark: "#0F1720",
    teal: "#4A7A8A",
    mint: "#85C1B2",
    accent: "#28EF33",
    white: "#FFFFFF",
    bg: "#f8fafb",
  },

  logo: "/brand/logo.png",
  favicon: "/favicon.ico",
} as const;

export type Brand = typeof brand;
