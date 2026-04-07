
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
    getInstructions: (n) => `Dial **21*${n}# then press call`,
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
    getInstructions: (n) => `Dial **21*${n}# then press call`,
  },
  {
    name: "9mobile Nigeria",
    region: "NG",
    type: "ussd",
    getInstructions: (n) => `Dial **21*${n}# then press call`,
  },
  // UK — USSD codes are carrier-specific; codes below are verified for each network
  {
    name: "EE UK",
    region: "GB",
    type: "ussd",
    getInstructions: (n) => `Dial 1407${n} then press call (forward all calls)`,
  },
  {
    name: "Vodafone UK",
    region: "GB",
    type: "ussd",
    getInstructions: (n) => `Dial **21*${n}# then press call`,
  },
  {
    name: "O2 UK",
    region: "GB",
    type: "ussd",
    getInstructions: (n) => `Dial **21*${n}# then press call`,
  },
  {
    name: "Three UK",
    region: "GB",
    type: "ussd",
    getInstructions: (n) => `Dial **21*${n}# then press call`,
  },
  // US — T-Mobile and Verizon use feature codes (*72); AT&T uses app
  {
    name: "AT&T",
    region: "US",
    type: "ussd",
    getInstructions: (n) => `Dial *21*${n}# then press call`,
  },
  {
    name: "T-Mobile",
    region: "US",
    type: "ussd",
    getInstructions: (n) => `Dial **21*${n}# then press call`,
  },
  {
    name: "Verizon",
    region: "US",
    type: "ussd",
    getInstructions: (n) => `Dial *72${n} then press call`,
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
  if (!country) return [];
  const regions = COUNTRY_TO_REGION[country];
  if (!regions) return [];
  return CARRIERS.filter((c) => regions.includes(c.region));
}
