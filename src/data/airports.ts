import type { Airport, Airline } from "@/lib/types";

export const AIRPORTS: Airport[] = [
  { code: "DEL", city: "Delhi", name: "Indira Gandhi Intl", country: "India" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Intl", country: "India" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda Intl", country: "India" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi Intl", country: "India" },
  { code: "MAA", city: "Chennai", name: "Chennai Intl", country: "India" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose Intl", country: "India" },
  { code: "GOI", city: "Goa", name: "Dabolim", country: "India" },
  { code: "COK", city: "Kochi", name: "Cochin Intl", country: "India" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel Intl", country: "India" },
  { code: "PNQ", city: "Pune", name: "Pune", country: "India" },
  { code: "JAI", city: "Jaipur", name: "Jaipur Intl", country: "India" },
  { code: "LKO", city: "Lucknow", name: "Chaudhary Charan Singh Intl", country: "India" },
  { code: "DXB", city: "Dubai", name: "Dubai Intl", country: "UAE" },
  { code: "AUH", city: "Abu Dhabi", name: "Zayed Intl", country: "UAE" },
  { code: "SIN", city: "Singapore", name: "Changi", country: "Singapore" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi", country: "Thailand" },
  { code: "KUL", city: "Kuala Lumpur", name: "Kuala Lumpur Intl", country: "Malaysia" },
  { code: "DOH", city: "Doha", name: "Hamad Intl", country: "Qatar" },
  { code: "LHR", city: "London", name: "Heathrow", country: "United Kingdom" },
  { code: "CMB", city: "Colombo", name: "Bandaranaike Intl", country: "Sri Lanka" },
  { code: "KTM", city: "Kathmandu", name: "Tribhuvan Intl", country: "Nepal" },
  { code: "MLE", city: "Malé", name: "Velana Intl", country: "Maldives" },
];

export const AIRLINES: Airline[] = [
  { code: "AI", name: "Air India" },
  { code: "6E", name: "IndiGo" },
  { code: "UK", name: "Vistara" },
  { code: "SG", name: "SpiceJet" },
  { code: "QP", name: "Akasa Air" },
  { code: "EK", name: "Emirates" },
  { code: "EY", name: "Etihad Airways" },
];

export function airportByCode(code: string): Airport {
  return AIRPORTS.find((a) => a.code === code) ?? AIRPORTS[0];
}
