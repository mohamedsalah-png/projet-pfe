import axios, { InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = (): string => {
  // 1. Essayer de récupérer l'IP depuis Expo hostUri (développement avec Expo Go)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    // Si on est sur un émulateur Android, hostUri peut être 'localhost' ou '127.0.0.1'
    if (ip === 'localhost' || ip === '127.0.0.1') {
      return 'http://10.0.2.2:5000/api';
    }
    return `http://${ip}:5000/api`;
  }

  // 2. Fallback pour développement (quand hostUri n'est pas disponible)
  // Utilise l'adresse IP de votre machine (192.168.0.140)
  // Sauf sur émulateur Android où 10.0.2.2 est requis
  if (Platform.OS === 'android') {
    // Si vous testez sur un émulatateur Android, utilisez 10.0.2.2
    // Si vous testez sur un téléphone physique, utilisez 192.168.0.140
    // Par défaut, on met l'IP physique car c'est ce que vous avez confirmé
    return 'http://192.168.0.140:5000/api';
  }

  return 'http://192.168.0.140:5000/api';
};

const API_URL = getApiUrl();
console.log('[API] URL du serveur:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (config.url && !config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
    // Ne pas écraser le token s'il est déjà défini (ex: pour les routes admin)
    if (!config.headers.Authorization) {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  console.log(`[AXIOS] ${config.method?.toUpperCase()} vers ${config.url}`);
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const getApiErrorMessage = (error: any, defaultMessage = 'Une erreur est survenue.'): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return defaultMessage;
};

// ── Types ──
export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: 'passager' | 'chauffeur' | 'admin';
  suspended?: boolean;
  createdAt: string;
}

export interface Trajet {
  _id: string;
  depart: string;
  arrivee: string;
  heure: string;
  prix: number;
  places: number;
  placesInitiales?: number;
  statut: 'actif' | 'complet' | 'annule';
  chauffeur?: User;
  demandes?: any[];
  reservations?: any[];
  createdAt: string;
}

export interface Avis {
  _id: string;
  passager: User;
  chauffeur: User;
  note: number;
  commentaire: string;
  createdAt: string;
}

// ── Auth ──
export const register = async (data: any) => {
  if (data.carteGriseUri) {
    const formData = new FormData();
    formData.append('nom', data.nom);
    formData.append('prenom', data.prenom);
    formData.append('telephone', data.telephone);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('role', data.role);

    if (Platform.OS === 'web') {
      const response = await fetch(data.carteGriseUri);
      const blob = await response.blob();
      formData.append('carteGrise', blob, 'cartegrise.jpg');
    } else {
      const filename = data.carteGriseUri.split('/').pop() || 'cartegrise.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // @ts-ignore
      formData.append('carteGrise', {
        uri: data.carteGriseUri,
        name: filename,
        type
      });
    }

    return api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  const { carteGriseUri: _, ...registerData } = data;
  return api.post('/auth/register', registerData);
};

export const login = (data: any) => api.post('/auth/login', data);

// ── Trajets ──
export const getTrajets = (depart?: string, arrivee?: string, includeInactive = false) =>
  api.get('/trajets', { params: { depart, arrivee, includeInactive } });

export const addTrajet = (data: any, token: string | null) =>
  api.post('/trajets', data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

export const submitReservationRequest = (id: string, token: string | null) =>
  api.post(
    `/trajets/${id}/demander`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

export const decideReservationRequest = (trajetId: string, passagerId: string, decision: string, token: string | null) =>
  api.patch(
    `/trajets/${trajetId}/demandes/${passagerId}`,
    { decision },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

export const updatePlaces = (trajetId: string, action: string, token: string | null) =>
  api.patch(
    `/trajets/${trajetId}/places`,
    { action },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

export const deleteTrajet = (id: string, token: string | null) =>
  api.delete(`/trajets/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

// ── Passwords ──
export const sendCode = (email: string) => api.post('/reset/send-code', { email });
export const verifyCode = (email: string, code: string) => api.post('/reset/verify-code', { email, code });
export const changePassword = (email: string, code: string, newPassword: string) =>
  api.post('/reset/change-password', { email, code, newPassword });

// ── Avis ──
export const addAvis = (data: any, token: string | null) =>
  api.post('/avis', data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

export const getAvis = (chauffeurId: string) => api.get(`/avis/${chauffeurId}`);

export const addManualPassenger = (trajetId: string, token: string | null) => {
  return api.post(`/trajets/${trajetId}/manual-passenger`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// ── Admin API ──
export const adminLogin = (data: any) => api.post('/admin/login', data);

export const getAdminStats = (token: string | null) =>
  api.get('/admin/stats', { headers: token ? { Authorization: `Bearer ${token}` } : {} });

export const getAdminUsers = (token: string | null) =>
  api.get('/admin/users', { headers: token ? { Authorization: `Bearer ${token}` } : {} });

export const updateAdminUser = (id: string, data: any, token: string | null) =>
  api.patch(`/admin/users/${id}`, data, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

export const deleteAdminUser = (id: string, token: string | null) =>
  api.delete(`/admin/users/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

export const getAdminTrajets = (token: string | null) =>
  api.get('/admin/trajets', { headers: token ? { Authorization: `Bearer ${token}` } : {} });

export const updateAdminTrajetStatus = (id: string, statut: string, token: string | null) =>
  api.patch(`/admin/trajets/${id}/status`, { statut }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

export const deleteAdminTrajet = (id: string, token: string | null) =>
  api.delete(`/admin/trajets/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

export const getAdminAvis = (token: string | null) =>
  api.get('/admin/avis', { headers: token ? { Authorization: `Bearer ${token}` } : {} });

export const deleteAdminAvis = (id: string, token: string | null) =>
  api.delete(`/admin/avis/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
