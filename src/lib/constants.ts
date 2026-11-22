export const CATEGORIES = [
  "Textiles",
  "Pottery",
  "Woodcraft",
  "Paintings",
  "Metalcraft",
  "Home Decor",
  "Jewellery",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_TE: Record<string, string> = {
  Textiles: "వస్త్రాలు",
  Pottery: "కుండలు",
  Woodcraft: "చెక్క కళ",
  Paintings: "చిత్రకళ",
  Metalcraft: "లోహ కళ",
  "Home Decor": "గృహాలంకరణ",
  Jewellery: "ఆభరణాలు",
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Jammu & Kashmir", "Ladakh", "Delhi", "Puducherry",
];
