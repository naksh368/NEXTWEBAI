/**
 * Curated Indian departure-city dataset (server-side only — never shipped whole
 * to the browser). Searched via /api/cities with debounced client input, so it
 * scales as rows are added. A city is a valid departure location even if the
 * actual flight airport is nearby; `airport` names the applicable airport where
 * one exists. Extend this list (or swap for a DB table) without any UI change.
 */

export type CityRecord = {
  city: string;
  state: string;
  country: "India";
  airport?: { name: string; code: string };
  popular?: boolean;
  aliases?: string[];
};

export const INDIAN_CITIES: CityRecord[] = [
  { city: "New Delhi", state: "Delhi", country: "India", airport: { name: "Indira Gandhi International", code: "DEL" }, popular: true, aliases: ["delhi", "ncr"] },
  { city: "Mumbai", state: "Maharashtra", country: "India", airport: { name: "Chhatrapati Shivaji Maharaj Intl", code: "BOM" }, popular: true, aliases: ["bombay"] },
  { city: "Bengaluru", state: "Karnataka", country: "India", airport: { name: "Kempegowda International", code: "BLR" }, popular: true, aliases: ["bangalore"] },
  { city: "Chennai", state: "Tamil Nadu", country: "India", airport: { name: "Chennai International", code: "MAA" }, popular: true, aliases: ["madras"] },
  { city: "Hyderabad", state: "Telangana", country: "India", airport: { name: "Rajiv Gandhi International", code: "HYD" }, popular: true },
  { city: "Kolkata", state: "West Bengal", country: "India", airport: { name: "Netaji Subhas Chandra Bose Intl", code: "CCU" }, popular: true, aliases: ["calcutta"] },
  { city: "Pune", state: "Maharashtra", country: "India", airport: { name: "Pune Airport", code: "PNQ" }, popular: true },
  { city: "Ahmedabad", state: "Gujarat", country: "India", airport: { name: "Sardar Vallabhbhai Patel Intl", code: "AMD" }, popular: true },
  { city: "Jaipur", state: "Rajasthan", country: "India", airport: { name: "Jaipur International", code: "JAI" }, popular: true },
  { city: "Kochi", state: "Kerala", country: "India", airport: { name: "Cochin International", code: "COK" }, popular: true, aliases: ["cochin"] },
  { city: "Goa", state: "Goa", country: "India", airport: { name: "Dabolim / Manohar Intl", code: "GOI" }, popular: true, aliases: ["panaji", "dabolim", "mopa"] },
  { city: "Lucknow", state: "Uttar Pradesh", country: "India", airport: { name: "Chaudhary Charan Singh Intl", code: "LKO" }, popular: true },
  { city: "Chandigarh", state: "Chandigarh", country: "India", airport: { name: "Chandigarh International", code: "IXC" }, popular: true },
  { city: "Trivandrum", state: "Kerala", country: "India", airport: { name: "Trivandrum International", code: "TRV" }, aliases: ["thiruvananthapuram"] },
  { city: "Coimbatore", state: "Tamil Nadu", country: "India", airport: { name: "Coimbatore International", code: "CJB" } },
  { city: "Indore", state: "Madhya Pradesh", country: "India", airport: { name: "Devi Ahilyabai Holkar", code: "IDR" } },
  { city: "Nagpur", state: "Maharashtra", country: "India", airport: { name: "Dr. Babasaheb Ambedkar Intl", code: "NAG" } },
  { city: "Guwahati", state: "Assam", country: "India", airport: { name: "Lokpriya Gopinath Bordoloi Intl", code: "GAU" } },
  { city: "Bhubaneswar", state: "Odisha", country: "India", airport: { name: "Biju Patnaik International", code: "BBI" } },
  { city: "Amritsar", state: "Punjab", country: "India", airport: { name: "Sri Guru Ram Dass Jee Intl", code: "ATQ" } },
  { city: "Varanasi", state: "Uttar Pradesh", country: "India", airport: { name: "Lal Bahadur Shastri Intl", code: "VNS" }, aliases: ["banaras", "kashi"] },
  { city: "Surat", state: "Gujarat", country: "India", airport: { name: "Surat Airport", code: "STV" } },
  { city: "Vadodara", state: "Gujarat", country: "India", airport: { name: "Vadodara Airport", code: "BDQ" }, aliases: ["baroda"] },
  { city: "Rajkot", state: "Gujarat", country: "India", airport: { name: "Rajkot (Hirasar) Intl", code: "HSR" } },
  { city: "Nashik", state: "Maharashtra", country: "India", airport: { name: "Nashik Airport", code: "ISK" } },
  { city: "Raipur", state: "Chhattisgarh", country: "India", airport: { name: "Swami Vivekananda", code: "RPR" } },
  { city: "Ranchi", state: "Jharkhand", country: "India", airport: { name: "Birsa Munda", code: "IXR" } },
  { city: "Patna", state: "Bihar", country: "India", airport: { name: "Jay Prakash Narayan Intl", code: "PAT" } },
  { city: "Bhopal", state: "Madhya Pradesh", country: "India", airport: { name: "Raja Bhoj", code: "BHO" } },
  { city: "Visakhapatnam", state: "Andhra Pradesh", country: "India", airport: { name: "Visakhapatnam Intl", code: "VTZ" }, aliases: ["vizag"] },
  { city: "Vijayawada", state: "Andhra Pradesh", country: "India", airport: { name: "Vijayawada", code: "VGA" } },
  { city: "Madurai", state: "Tamil Nadu", country: "India", airport: { name: "Madurai", code: "IXM" } },
  { city: "Tiruchirappalli", state: "Tamil Nadu", country: "India", airport: { name: "Tiruchirappalli Intl", code: "TRZ" }, aliases: ["trichy"] },
  { city: "Mangaluru", state: "Karnataka", country: "India", airport: { name: "Mangaluru Intl", code: "IXE" }, aliases: ["mangalore"] },
  { city: "Calicut", state: "Kerala", country: "India", airport: { name: "Kozhikode / Calicut Intl", code: "CCJ" }, aliases: ["kozhikode"] },
  { city: "Dehradun", state: "Uttarakhand", country: "India", airport: { name: "Jolly Grant", code: "DED" } },
  { city: "Srinagar", state: "Jammu & Kashmir", country: "India", airport: { name: "Srinagar Intl", code: "SXR" } },
  { city: "Jammu", state: "Jammu & Kashmir", country: "India", airport: { name: "Jammu Airport", code: "IXJ" } },
  { city: "Leh", state: "Ladakh", country: "India", airport: { name: "Kushok Bakula Rimpochee", code: "IXL" } },
  { city: "Udaipur", state: "Rajasthan", country: "India", airport: { name: "Maharana Pratap", code: "UDR" } },
  { city: "Jodhpur", state: "Rajasthan", country: "India", airport: { name: "Jodhpur Airport", code: "JDH" } },
  { city: "Agra", state: "Uttar Pradesh", country: "India", airport: { name: "Agra Airport", code: "AGR" } },
  { city: "Kanpur", state: "Uttar Pradesh", country: "India", airport: { name: "Kanpur Airport", code: "KNU" } },
  { city: "Prayagraj", state: "Uttar Pradesh", country: "India", airport: { name: "Prayagraj Airport", code: "IXD" }, aliases: ["allahabad"] },
  { city: "Gorakhpur", state: "Uttar Pradesh", country: "India", airport: { name: "Gorakhpur Airport", code: "GOP" } },
  { city: "Jabalpur", state: "Madhya Pradesh", country: "India", airport: { name: "Jabalpur Airport", code: "JLR" } },
  { city: "Gwalior", state: "Madhya Pradesh", country: "India", airport: { name: "Gwalior Airport", code: "GWL" } },
  { city: "Aurangabad", state: "Maharashtra", country: "India", airport: { name: "Aurangabad Airport", code: "IXU" } },
  { city: "Kolhapur", state: "Maharashtra", country: "India", airport: { name: "Kolhapur Airport", code: "KLH" } },
  { city: "Hubli", state: "Karnataka", country: "India", airport: { name: "Hubli Airport", code: "HBX" } },
  { city: "Mysuru", state: "Karnataka", country: "India", airport: { name: "Mysuru Airport", code: "MYQ" }, aliases: ["mysore"] },
  { city: "Tirupati", state: "Andhra Pradesh", country: "India", airport: { name: "Tirupati Airport", code: "TIR" } },
  { city: "Rajahmundry", state: "Andhra Pradesh", country: "India", airport: { name: "Rajahmundry Airport", code: "RJA" } },
  { city: "Hubballi", state: "Karnataka", country: "India", aliases: ["hubli-dharwad"] },
  { city: "Salem", state: "Tamil Nadu", country: "India", airport: { name: "Salem Airport", code: "SXV" } },
  { city: "Puducherry", state: "Puducherry", country: "India", airport: { name: "Puducherry Airport", code: "PNY" }, aliases: ["pondicherry"] },
  { city: "Port Blair", state: "Andaman & Nicobar", country: "India", airport: { name: "Veer Savarkar Intl", code: "IXZ" } },
  { city: "Shirdi", state: "Maharashtra", country: "India", airport: { name: "Shirdi Airport", code: "SAG" } },
  { city: "Belagavi", state: "Karnataka", country: "India", airport: { name: "Belagavi Airport", code: "IXG" }, aliases: ["belgaum"] },
  { city: "Kannur", state: "Kerala", country: "India", airport: { name: "Kannur International", code: "CNN" } },
  { city: "Dibrugarh", state: "Assam", country: "India", airport: { name: "Dibrugarh Airport", code: "DIB" } },
  { city: "Silchar", state: "Assam", country: "India", airport: { name: "Silchar Airport", code: "IXS" } },
  { city: "Imphal", state: "Manipur", country: "India", airport: { name: "Imphal Intl", code: "IMF" } },
  { city: "Agartala", state: "Tripura", country: "India", airport: { name: "Maharaja Bir Bikram", code: "IXA" } },
  { city: "Aizawl", state: "Mizoram", country: "India", airport: { name: "Lengpui Airport", code: "AJL" } },
  { city: "Shillong", state: "Meghalaya", country: "India", airport: { name: "Shillong Airport", code: "SHL" } },
  { city: "Dimapur", state: "Nagaland", country: "India", airport: { name: "Dimapur Airport", code: "DMU" } },
  { city: "Bagdogra", state: "West Bengal", country: "India", airport: { name: "Bagdogra Airport", code: "IXB" }, aliases: ["siliguri", "darjeeling"] },
  { city: "Durgapur", state: "West Bengal", country: "India", airport: { name: "Kazi Nazrul Islam", code: "RDP" } },
  { city: "Jharsuguda", state: "Odisha", country: "India", airport: { name: "Veer Surendra Sai", code: "JRG" } },
  { city: "Dehri", state: "Bihar", country: "India" },
  { city: "Gaya", state: "Bihar", country: "India", airport: { name: "Gaya Airport", code: "GAY" } },
  { city: "Deoghar", state: "Jharkhand", country: "India", airport: { name: "Deoghar Airport", code: "DGH" } },
  { city: "Jamshedpur", state: "Jharkhand", country: "India" },
  { city: "Bilaspur", state: "Chhattisgarh", country: "India", airport: { name: "Bilasa Devi Kevat", code: "PAB" } },
  { city: "Jaisalmer", state: "Rajasthan", country: "India", airport: { name: "Jaisalmer Airport", code: "JSA" } },
  { city: "Bikaner", state: "Rajasthan", country: "India", airport: { name: "Nal Airport", code: "BKB" } },
  { city: "Ajmer", state: "Rajasthan", country: "India" },
  { city: "Kota", state: "Rajasthan", country: "India" },
  { city: "Shimla", state: "Himachal Pradesh", country: "India", airport: { name: "Shimla Airport", code: "SLV" } },
  { city: "Dharamshala", state: "Himachal Pradesh", country: "India", airport: { name: "Kangra (Gaggal)", code: "DHM" }, aliases: ["mcleodganj", "kangra"] },
  { city: "Kullu", state: "Himachal Pradesh", country: "India", airport: { name: "Bhuntar Airport", code: "KUU" }, aliases: ["manali", "bhuntar"] },
  { city: "Pantnagar", state: "Uttarakhand", country: "India", airport: { name: "Pantnagar Airport", code: "PGH" }, aliases: ["nainital"] },
  { city: "Jamnagar", state: "Gujarat", country: "India", airport: { name: "Jamnagar Airport", code: "JGA" } },
  { city: "Bhavnagar", state: "Gujarat", country: "India", airport: { name: "Bhavnagar Airport", code: "BHU" } },
  { city: "Bhuj", state: "Gujarat", country: "India", airport: { name: "Bhuj Airport", code: "BHJ" }, aliases: ["kutch"] },
  { city: "Diu", state: "Daman & Diu", country: "India", airport: { name: "Diu Airport", code: "DIU" } },
  { city: "Solapur", state: "Maharashtra", country: "India" },
  { city: "Warangal", state: "Telangana", country: "India" },
  { city: "Guntur", state: "Andhra Pradesh", country: "India" },
  { city: "Nellore", state: "Andhra Pradesh", country: "India" },
  { city: "Vellore", state: "Tamil Nadu", country: "India" },
  { city: "Tirunelveli", state: "Tamil Nadu", country: "India" },
  { city: "Thoothukudi", state: "Tamil Nadu", country: "India", airport: { name: "Tuticorin Airport", code: "TCR" }, aliases: ["tuticorin"] },
  { city: "Thrissur", state: "Kerala", country: "India" },
  { city: "Kollam", state: "Kerala", country: "India" },
  { city: "Kottayam", state: "Kerala", country: "India" },
  { city: "Alappuzha", state: "Kerala", country: "India", aliases: ["alleppey"] },
  { city: "Meerut", state: "Uttar Pradesh", country: "India" },
  { city: "Ghaziabad", state: "Uttar Pradesh", country: "India" },
  { city: "Noida", state: "Uttar Pradesh", country: "India" },
  { city: "Gurugram", state: "Haryana", country: "India", aliases: ["gurgaon"] },
  { city: "Faridabad", state: "Haryana", country: "India" },
  { city: "Hisar", state: "Haryana", country: "India", airport: { name: "Hisar Airport", code: "HSS" } },
  { city: "Ludhiana", state: "Punjab", country: "India", airport: { name: "Ludhiana (Halwara)", code: "LUH" } },
  { city: "Jalandhar", state: "Punjab", country: "India" },
  { city: "Pathankot", state: "Punjab", country: "India", airport: { name: "Pathankot Airport", code: "IXP" } },
  { city: "Bathinda", state: "Punjab", country: "India", airport: { name: "Bathinda Airport", code: "BUP" } },
  { city: "Moradabad", state: "Uttar Pradesh", country: "India" },
  { city: "Bareilly", state: "Uttar Pradesh", country: "India", airport: { name: "Bareilly Airport", code: "BEK" } },
  { city: "Aligarh", state: "Uttar Pradesh", country: "India" },
  { city: "Jhansi", state: "Uttar Pradesh", country: "India" },
  { city: "Ujjain", state: "Madhya Pradesh", country: "India" },
  { city: "Sagar", state: "Madhya Pradesh", country: "India" },
  { city: "Rewa", state: "Madhya Pradesh", country: "India", airport: { name: "Rewa Airport", code: "REW" } },
  { city: "Cuttack", state: "Odisha", country: "India" },
  { city: "Rourkela", state: "Odisha", country: "India" },
  { city: "Sambalpur", state: "Odisha", country: "India" },
  { city: "Panaji", state: "Goa", country: "India", aliases: ["panjim"] },
];

/** Rank cities by query — exact/prefix/alias/airport-code/substring. Server-side. */
export function searchCities(query: string, limit = 12): CityRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return INDIAN_CITIES.filter((c) => c.popular).slice(0, limit);
  const scored = INDIAN_CITIES.map((c) => {
    const city = c.city.toLowerCase();
    const code = c.airport?.code.toLowerCase() ?? "";
    const aliases = c.aliases ?? [];
    const hay = [city, c.state.toLowerCase(), code, ...aliases];
    let score = -1;
    if (city === q) score = 100;
    else if (code && code === q) score = 95;
    else if (city.startsWith(q)) score = 80;
    else if (aliases.some((a) => a.startsWith(q))) score = 70;
    else if (hay.some((h) => h.includes(q))) score = 40;
    if (score >= 0 && c.popular) score += 5;
    return { c, score };
  })
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score || a.c.city.localeCompare(b.c.city));
  return scored.slice(0, limit).map((s) => s.c);
}
