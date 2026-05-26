export interface CountryData {
  name: string;
  states: string[];
}

export const COUNTRIES: CountryData[] = [
  {
    name: "Iraq",
    states: [
      "Baghdad",
      "Erbil",
      "Basra",
      "Mosul",
      "Sulaymaniyah",
      "Kirkuk",
      "Najaf",
      "Karbala",
      "Dahuk",
      "Anbar",
      "Babil",
      "Al-Qadisiyyah",
      "Diyala",
      "Dhi Qar",
      "Maysan",
      "Muthanna",
      "Salah al-Din",
      "Wasit"
    ]
  },
  {
    name: "France",
    states: [
      "Paris",
      "Marseille",
      "Lyon",
      "Toulouse",
      "Nice",
      "Nantes",
      "Strasbourg",
      "Montpellier",
      "Bordeaux",
      "Lille"
    ]
  },
  {
    name: "United Kingdom",
    states: [
      "London",
      "Birmingham",
      "Manchester",
      "Glasgow",
      "Liverpool",
      "Leeds",
      "Edinburgh",
      "Bristol",
      "Belfast",
      "Cardiff"
    ]
  },
  {
    name: "United States",
    states: [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose"
    ]
  }
];

export const COUNTRY_OPTIONS = COUNTRIES.map(c => ({
  value: c.name,
  label: c.name
}));
