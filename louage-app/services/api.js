import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // FORCE HARDCODED IP
  return 'http://192.168.0.140:5000/api';
};

const API_URL = getApiUrl();
console.log('[API] URL du serveur:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 5000, // 5 secondes de timeout
});

api.interceptors.request.use(async (config) => {
  if (!config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
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

export const getApiErrorMessage = (error, defaultMessage = 'Une erreur est survenue.') => {
  if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
    return "Le serveur met trop de temps à répondre (Timeout). Vérifiez votre connexion et l'adresse IP.";
  }
  if (error.message === 'Network Error') {
    return "Impossible de joindre le serveur. Le pare-feu bloque peut-être la connexion.";
  }
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return defaultMessage;
};

import { Platform } from 'react-native';

export const register = async (data) => {
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

  // Envoyer seulement les champs nécessaires (sans carteGriseUri)
  const { carteGriseUri: _, ...registerData } = data;
  return api.post('/auth/register', registerData);
};
export const login = (data) => api.post('/auth/login', data);

export const getTrajets = (depart, arrivee, includeInactive = false) =>
  api.get('/trajets', { params: { depart, arrivee, includeInactive } });

export const addTrajet = (data, token) =>
  api.post('/trajets', data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const submitReservationRequest = (id, token) =>
  api.post(
    `/trajets/${id}/demander`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

export const decideReservationRequest = (trajetId, passagerId, decision, token) =>
  api.patch(
    `/trajets/${trajetId}/demandes/${passagerId}`,
    { decision },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

export const updatePlaces = (trajetId, action, token) =>
  api.patch(
    `/trajets/${trajetId}/places`,
    { action },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

export const deleteTrajet = (id, token) =>
  api.delete(`/trajets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const sendCode = (email) => api.post('/reset/send-code', { email });
export const verifyCode = (email, code) => api.post('/reset/verify-code', { email, code });
export const changePassword = (email, code, newPassword) =>
  api.post('/reset/change-password', { email, code, newPassword });

export const addAvis = (data, token) =>
  api.post('/avis', data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getAvis = (chauffeurId) => api.get(`/avis/${chauffeurId}`);

// ── Ajout manuel d'un passager ──
export const addManualPassenger = (trajetId, token) => {
  console.log(`[API] Appel de addManualPassenger pour le trajet ${trajetId}`);
  return api.post(`/trajets/${trajetId}/manual-passenger`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ── Admin API ──
export const adminLogin = (data) => api.post('/admin/login', data);

export const getAdminStats = (token) =>
  api.get('/admin/stats', { headers: { Authorization: `Bearer ${token}` } });

export const getAdminUsers = (token) =>
  api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } });

export const updateAdminUser = (id, data, token) =>
  api.patch(`/admin/users/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });

export const deleteAdminUser = (id, token) =>
  api.delete(`/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const getAdminTrajets = (token) =>
  api.get('/admin/trajets', { headers: { Authorization: `Bearer ${token}` } });

export const updateAdminTrajetStatus = (id, statut, token) =>
  api.patch(`/admin/trajets/${id}/status`, { statut }, { headers: { Authorization: `Bearer ${token}` } });

export const deleteAdminTrajet = (id, token) =>
  api.delete(`/admin/trajets/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const getAdminAvis = (token) =>
  api.get('/admin/avis', { headers: { Authorization: `Bearer ${token}` } });

export const deleteAdminAvis = (id, token) =>
  api.delete(`/admin/avis/${id}`, { headers: { Authorization: `Bearer ${token}` } });