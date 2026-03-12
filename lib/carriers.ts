export interface CarrierInfo {
  name: string;
  region: "NG" | "GB" | "US";
  type: "ussd" | "app";
  getInstructions: (barpelNumber: string) => string;
}

export const CARRIERS: CarrierInfo[] = [
  // Nigeria
  {
    name: "MTN Nigeria",
    region: "NG",
    type: "ussd",
    getInstructions: (n) => `Dial *21*${n}# then press call`,
  },
  {
    name: "Airtel Nigeria",
    region: "NG",
    type: "ussd",
    getInstructions: (n) => `Dial **21*${n}# then press call`,
  },
  {
    name: "Glo Nigeria",
    region: "NG",
    type: "ussd",
    getInstructions: (n) => `Dial *21*${n}# then press call`,
  },
  // UK
  {
    name: "EE UK",
    region: "GB",
    type: "ussd",
    getInstructions: (n) => `Dial 1407${n} then press call`,
  },
  {
    name: "Vodafone UK",
    region: "GB",
    type: "ussd",
    getInstructions: (n) => `Dial *21*${n}# then press call`,
  },
  {
    name: "O2 UK",
    region: "GB",
    type: "ussd",
    getInstructions: (n) => `Dial **21*${n}# then press call`,
  },
  // US
  {
    name: "AT&T US",
    region: "US",
    type: "app",
    getInstructions: (n) => `Go to myAT&T app → Phone → Call Forwarding → enter ${n}`,
  },
  {
    name: "T-Mobile US",
    region: "US",
    type: "ussd",
    getInstructions: (n) => `Dial **21*${n}# then press call`,
  },
];

const COUNTRY_TO_REGION: Record<string, CarrierInfo["region"][]> = {
  NG: ["NG"],
  GH: ["NG", "GB"], // Ghana merchants may use NG or GB carriers
  KE: ["NG", "GB"], // Kenya merchants may use NG or GB carriers
  GB: ["GB"],
  US: ["US"],
  CA: ["US"], // Canada merchants use US carriers
};

export function getCarriersForCountry(country?: string): CarrierInfo[] {
  if (!country) return CARRIERS;
  const regions = COUNTRY_TO_REGION[country];
  if (!regions) return CARRIERS;
  return CARRIERS.filter((c) => regions.includes(c.region));
}
