import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { isAxiosError } from 'axios';
import { register } from '../../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('passager');
  const [carteGriseUri, setCarteGriseUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const pickImage = async () => {
    // Demander les permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de l\'accès à votre galerie pour sélectionner la photo de votre carte grise.');
      return;
    }

    // Ouvrir le sélecteur d'images
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCarteGriseUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Demander les permissions pour la caméra
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de l\'accès à votre caméra pour prendre une photo de votre carte grise.');
      return;
    }

    // Ouvrir la caméra
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCarteGriseUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    const newErrors: { [key: string]: string } = {};

    // Validation complète
    if (!nom.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire';
    if (!telephone.trim()) newErrors.telephone = 'Le téléphone est obligatoire';
    if (!/^[0-9]{8}$/.test(telephone)) newErrors.telephone = '8 chiffres requis';
    if (!email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!email.includes('@')) {
      newErrors.email = 'L\'email doit contenir un @';
    }
    if (!password.trim()) newErrors.password = 'Le mot de passe est obligatoire';
    if (role === 'chauffeur' && !carteGriseUri) newErrors.carteGrise = 'Photo de carte grise obligatoire';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();
      console.log(`[DEBUG] Formulaire d'inscription - Email envoyé: '${normalizedEmail}'`);
      const response = await register({ nom, prenom, telephone, email: normalizedEmail, password, role, carteGriseUri });
      
      setSuccessMessage('✅ Ton compte est créé avec succès !');
      
      setTimeout(async () => {
        if (role === 'chauffeur') {
          // Pour les chauffeurs, sauvegarder et aller directement à la page d'accueil
          await AsyncStorage.setItem('token', response.data.token);
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          router.replace('/(driver)/home');
        } else {
          // Pour les passagers, aller à la connexion
          router.replace('/(auth)/login');
        }
      }, 1000);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.log('[DEBUG] Erreur inscription:', JSON.stringify(error.response?.data || error.message));
        
        let errorMessage: string;
        if (error.response) {
          // Le serveur a répondu avec un code d'erreur
          const serverMsg = error.response.data?.message;
          if (error.response.status === 400 && serverMsg) {
            errorMessage = serverMsg; // Ex: "Email déjà utilisé"
          } else {
            errorMessage = serverMsg || `Erreur serveur (${error.response.status})`;
          }
        } else if (error.request) {
          // Pas de réponse du serveur (problème réseau)
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion réseau et que le serveur est démarré.';
        } else {
          errorMessage = error.message || 'Une erreur inconnue est survenue.';
        }
        
        setErrors({ server: errorMessage });
      } else {
        console.log('[DEBUG] Erreur inscription:', error);
        setErrors({ server: 'Une erreur inconnue est survenue.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>LOUAGE.TN</Text>
        <Text style={styles.title}>Rejoignez-nous aujourd'hui</Text>
        <Text style={styles.subtitle}>Creez votre compte pour commencer a voyager ou a conduire en toute simplicite.</Text>
      </View>

      <View style={styles.form}>
        {successMessage && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {errors.server && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errors.server}</Text>
          </View>
        )}

        <Text style={styles.label}>Nom</Text>
        <TextInput 
          style={[styles.input, errors.nom && styles.inputError]} 
          placeholder="Votre nom" 
          placeholderTextColor="#94A3B8" 
          value={nom} 
          onChangeText={(text) => { setNom(text); if (errors.nom) setErrors({ ...errors, nom: '' }); }}
        />
        {errors.nom && <Text style={styles.errorMessage}>{errors.nom}</Text>}

        <Text style={styles.label}>Prenom</Text>
        <TextInput 
          style={[styles.input, errors.prenom && styles.inputError]} 
          placeholder="Votre prenom" 
          placeholderTextColor="#94A3B8" 
          value={prenom} 
          onChangeText={(text) => { setPrenom(text); if (errors.prenom) setErrors({ ...errors, prenom: '' }); }}
        />
        {errors.prenom && <Text style={styles.errorMessage}>{errors.prenom}</Text>}

        <Text style={styles.label}>Telephone</Text>
        <TextInput
          style={[styles.input, errors.telephone && styles.inputError]}
          placeholder="Votre numero"
          placeholderTextColor="#94A3B8"
          value={telephone}
          onChangeText={(text) => { setTelephone(text.replace(/[^0-9]/g, '').slice(0, 8)); if (errors.telephone) setErrors({ ...errors, telephone: '' }); }}
          keyboardType="phone-pad"
          maxLength={8}
        />
        {errors.telephone && <Text style={styles.errorMessage}>{errors.telephone}</Text>}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="votre email"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={(text) => { setEmail(text); if (errors.email) setErrors({ ...errors, email: '' }); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorMessage}>{errors.email}</Text>}

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput 
          style={[styles.input, errors.password && styles.inputError]} 
          placeholder="Choisissez un mot de passe" 
          placeholderTextColor="#94A3B8" 
          value={password} 
          onChangeText={(text) => { setPassword(text); if (errors.password) setErrors({ ...errors, password: '' }); }}
          secureTextEntry 
        />
        {errors.password && <Text style={styles.errorMessage}>{errors.password}</Text>}

        <Text style={styles.label}>Je suis</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity style={[styles.roleButton, role === 'passager' && styles.rolePassenger]} onPress={() => setRole('passager')}>
            <Text style={[styles.roleText, role === 'passager' && styles.roleTextActive]}>Passager</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleButton, role === 'chauffeur' && styles.roleDriver]} onPress={() => setRole('chauffeur')}>
            <Text style={[styles.roleText, role === 'chauffeur' && styles.roleTextActive]}>Chauffeur</Text>
          </TouchableOpacity>
        </View>

        {role === 'chauffeur' && (
          <View style={[styles.driverSection, errors.carteGrise && { borderColor: '#DC2626', backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.label}>Photo de la carte grise</Text>
            <Text style={styles.helperText}>Requis pour les chauffeurs - Sélectionnez ou prenez une photo claire de votre carte grise</Text>

            {carteGriseUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: carteGriseUri }} style={styles.imagePreview} />
                <View style={styles.imageActions}>
                  <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
                    <Text style={styles.changeButtonText}>Changer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeButton} onPress={() => { setCarteGriseUri(null); setErrors({ ...errors, carteGrise: '' }); }}>
                    <Text style={styles.removeButtonText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={() => { pickImage(); if (errors.carteGrise) setErrors({ ...errors, carteGrise: '' }); }}>
                  <Text style={styles.photoButtonText}>📁 Sélectionner depuis la galerie</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={() => { takePhoto(); if (errors.carteGrise) setErrors({ ...errors, carteGrise: '' }); }}>
                  <Text style={styles.photoButtonText}>📷 Prendre une photo</Text>
                </TouchableOpacity>
              </View>
            )}
            {errors.carteGrise && <Text style={styles.errorMessage}>{errors.carteGrise}</Text>}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Creer mon compte</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>J ai deja un compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#EEF4FF',
    padding: 0,
  },
  hero: {
    backgroundColor: '#1E3A8A',
    borderRadius: 0,
    paddingHorizontal: 22,
    paddingTop: 40,
    paddingBottom: 30,
    marginBottom: 0,
  },
  eyebrow: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#DBEAFE',
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    margin: 20,
    marginTop: -20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D7E3F4',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 14,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  errorMessage: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '700',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D7E3F4',
    borderRadius: 16,
    marginBottom: 14,
    paddingRight: 12,
  },
  emailInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  gmailDomain: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  rolePassenger: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  roleDriver: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  roleText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  roleTextActive: {
    color: '#0F172A',
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  linkText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 15,
  },
  driverSection: {
    marginTop: 10,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  photoButtons: {
    gap: 12,
  },
  photoButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  changeButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
