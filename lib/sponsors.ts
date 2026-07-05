export interface Sponsor {
  name: string;
  href: string;
  logo?: string;
  logoLight?: string;
  logoDark?: string;
}

const BRIGHT_DATA: Sponsor = {
  href: "https://get.brightdata.com/zdgqtwgnmhkw",
  logoDark: "/sponsors/brightdata-dark.svg",
  logoLight: "/sponsors/brightdata-light.svg",
  name: "Bright Data",
};

export const tiers = [
  {
    colors: {
      bg: "var(--sponsor-gold-bg)",
      border: "var(--sponsor-gold-border)",
      slotBg: "var(--sponsor-gold-slot-bg)",
      slotBorder: "var(--sponsor-gold-slot-border)",
      text: "var(--sponsor-gold-text)",
    },
    name: "Gold",
    slots: 3,
    sponsors: [BRIGHT_DATA] as Sponsor[],
  },
  {
    colors: {
      bg: "var(--sponsor-silver-bg)",
      border: "var(--sponsor-silver-border)",
      slotBg: "var(--sponsor-silver-slot-bg)",
      slotBorder: "var(--sponsor-silver-slot-border)",
      text: "var(--sponsor-silver-text)",
    },
    name: "Silver",
    slots: 3,
    sponsors: [] as Sponsor[],
  },
  {
    colors: {
      bg: "var(--sponsor-bronze-bg)",
      border: "var(--sponsor-bronze-border)",
      slotBg: "var(--sponsor-bronze-slot-bg)",
      slotBorder: "var(--sponsor-bronze-slot-border)",
      text: "var(--sponsor-bronze-text)",
    },
    name: "Bronze",
    slots: 3,
    sponsors: [] as Sponsor[],
  },
];
