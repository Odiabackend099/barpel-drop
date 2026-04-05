/**
 * USSD call forwarding codes by country and carrier.
 *
 * These are standardized GSM supplementary service codes.
 * `{AI_NUMBER}` is replaced at runtime with the merchant's Barpel AI phone number.
 */

interface CarrierCodes {
  forwardAll: string;
  forwardNoAnswer: string;
  forwardBusy: string;
  forwardUnreachable: string;
  cancel: string;
  verify: string;
}

export const CALL_FORWARDING_CODES: Record<
  string,
  Record<string, CarrierCodes>
> = {
  NG: {
    MTN: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    Airtel: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    Glo: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    "9mobile": {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
  },
  GH: {
    MTN: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    Vodafone: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    AirtelTigo: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
  },
  KE: {
    Safaricom: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    Airtel: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
  },
  GB: {
    EE: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    Vodafone: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    O2: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    Three: {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
  },
  US: {
    "AT&T": {
      forwardAll: "*21*{AI_NUMBER}#",
      forwardNoAnswer: "*61*{AI_NUMBER}*11*30#",
      forwardBusy: "*67*{AI_NUMBER}#",
      forwardUnreachable: "*62*{AI_NUMBER}#",
      cancel: "#21#",
      verify: "*#21#",
    },
    "T-Mobile": {
      forwardAll: "**21*{AI_NUMBER}#",
      forwardNoAnswer: "**61*{AI_NUMBER}*11*30#",
      forwardBusy: "**67*{AI_NUMBER}#",
      forwardUnreachable: "**62*{AI_NUMBER}#",
      cancel: "##21#",
      verify: "*#21#",
    },
    Verizon: {
      forwardAll: "*72{AI_NUMBER}",
      forwardNoAnswer: "*71{AI_NUMBER}",
      forwardBusy: "*90{AI_NUMBER}",
      forwardUnreachable: "*68{AI_NUMBER}",
      cancel: "*73",
      verify: "Contact carrier",
    },
  },
  CA: {
    Rogers: {
      forwardAll: "*72{AI_NUMBER}",
      forwardNoAnswer: "*92{AI_NUMBER}",
      forwardBusy: "*90{AI_NUMBER}",
      forwardUnreachable: "*72{AI_NUMBER}",
      cancel: "*73",
      verify: "Contact carrier",
    },
    Bell: {
      forwardAll: "*72{AI_NUMBER}",
      forwardNoAnswer: "*92{AI_NUMBER}",
      forwardBusy: "*90{AI_NUMBER}",
      forwardUnreachable: "*72{AI_NUMBER}",
      cancel: "*73",
      verify: "Contact carrier",
    },
    Telus: {
      forwardAll: "*72{AI_NUMBER}",
      forwardNoAnswer: "*92{AI_NUMBER}",
      forwardBusy: "*90{AI_NUMBER}",
      forwardUnreachable: "*72{AI_NUMBER}",
      cancel: "*73",
      verify: "Contact carrier",
    },
  },
};

export const COUNTRY_NAMES: Record<string, string> = {
  NG: "Nigeria",
  GH: "Ghana",
  KE: "Kenya",
  GB: "United Kingdom",
  US: "United States",
  CA: "Canada",
};

export function getCarriersForCountry(countryCode: string): string[] {
  return Object.keys(CALL_FORWARDING_CODES[countryCode] ?? {});
}

export function getUssdCode(
  countryCode: string,
  carrier: string,
  type: keyof CarrierCodes,
  aiNumber: string
): string {
  const code = CALL_FORWARDING_CODES[countryCode]?.[carrier]?.[type] ?? "";
  return code.replace("{AI_NUMBER}", aiNumber);
}

export function getCancelCode(
  countryCode: string,
  carrier: string
): string {
  return CALL_FORWARDING_CODES[countryCode]?.[carrier]?.cancel ?? "##21#";
}
