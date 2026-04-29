export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const TUNISIAN_CITIES: City[] = [
  // 24 Gouvernorats
  { id: '1', name: 'Ariana', lat: 36.8625, lng: 10.1956 },
  { id: '2', name: 'Béja', lat: 36.7256, lng: 9.1817 },
  { id: '3', name: 'Ben Arous', lat: 36.7531, lng: 10.2189 },
  { id: '4', name: 'Bizerte', lat: 37.2744, lng: 9.8739 },
  { id: '5', name: 'Gabès', lat: 33.8815, lng: 10.0982 },
  { id: '6', name: 'Gafsa', lat: 34.4250, lng: 8.7842 },
  { id: '7', name: 'Jendouba', lat: 36.5011, lng: 8.7802 },
  { id: '8', name: 'Kairouan', lat: 35.6781, lng: 10.0963 },
  { id: '9', name: 'Kasserine', lat: 35.1676, lng: 8.8365 },
  { id: '10', name: 'Kébili', lat: 33.7044, lng: 8.9690 },
  { id: '11', name: 'Le Kef', lat: 36.1826, lng: 8.7148 },
  { id: '12', name: 'Mahdia', lat: 35.5047, lng: 11.0622 },
  { id: '13', name: 'La Manouba', lat: 36.8078, lng: 10.0956 },
  { id: '14', name: 'Médenine', lat: 33.3549, lng: 10.5055 },
  { id: '15', name: 'Monastir', lat: 35.7780, lng: 10.8262 },
  { id: '16', name: 'Nabeul', lat: 36.4561, lng: 10.7376 },
  { id: '17', name: 'Sfax', lat: 34.7406, lng: 10.7603 },
  { id: '18', name: 'Sidi Bouzid', lat: 35.0382, lng: 9.4849 },
  { id: '19', name: 'Siliana', lat: 36.0818, lng: 9.3708 },
  { id: '20', name: 'Sousse', lat: 35.8256, lng: 10.6369 },
  { id: '21', name: 'Tataouine', lat: 32.9297, lng: 10.4518 },
  { id: '22', name: 'Tozeur', lat: 33.9197, lng: 8.1335 },
  { id: '23', name: 'Tunis', lat: 36.8065, lng: 10.1815 },
  { id: '24', name: 'Zaghouan', lat: 36.4011, lng: 10.1423 },

  // Autres grandes villes importantes (optionnel, pour l'autocomplete)
  { id: '25', name: 'Hammamet', lat: 36.4000, lng: 10.6167 },
  { id: '26', name: 'Djerba', lat: 33.8075, lng: 10.8451 },
  { id: '27', name: 'Zarzis', lat: 33.5040, lng: 11.1122 },
  { id: '28', name: 'Ksar Hellal', lat: 35.6450, lng: 10.8872 },
  { id: '29', name: 'Kelibia', lat: 36.8476, lng: 11.0939 },
];

export const getCityCoordinates = (cityName: string): [number, number] | null => {
  const city = TUNISIAN_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  return city ? [city.lat, city.lng] : null;
};
