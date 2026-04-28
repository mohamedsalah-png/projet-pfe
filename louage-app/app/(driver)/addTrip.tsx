import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addTrajet } from '../../services/api';

export default function AddTrip() {
  const router = useRouter();
  const [depart, setDepart] = useState('');
  const [arrivee, setArrivee] = useState('');
  const [heure, setHeure] = useState('');
  const [places, setPlaces] = useState('');
  const [prix, setPrix] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handlePublish = async () => {
    const newErrors: { [key: string]: string } = {};

    // Validation de tous les champs
    if (!depart.trim()) newErrors.depart = 'Ville de départ obligatoire';
    if (!arrivee.trim()) newErrors.arrivee = 'Ville d\'arrivée obligatoire';
    if (!heure.trim()) newErrors.heure = 'Heure de départ obligatoire';
    if (!places.trim()) newErrors.places = 'Nombre de places obligatoire';
    if (!prix.trim()) newErrors.prix = 'Prix obligatoire';

    const placesNum = Number(places);
    if (places && (placesNum <= 0 || placesNum > 8)) {
      newErrors.places = '1 à 8 places requis';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        router.replace('/(auth)/login');
        return;
      }
      await addTrajet({ depart, arrivee, heure, places: placesNum, prix: Number(prix) }, token);
      setErrors({});
      router.back();
    } catch (error: any) {
      console.error('[AddTrip] Error publishing trajet:', error.response?.data || error.message);
      setErrors({ server: error.response?.data?.message || 'Impossible de publier le trajet !' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Nouveau trajet</Text>
        <Text style={styles.title}>Publiez un trajet clair et attractif</Text>
        <Text style={styles.subtitle}>Choisissez vos villes, votre heure, vos places et votre prix.</Text>
      </View>

      <View style={styles.form}>
        {errors.server && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errors.server}</Text>
          </View>
        )}

        <Text style={styles.label}>Ville de depart</Text>
        <TextInput 
          style={[styles.input, errors.depart && styles.inputError]} 
          placeholder="Ex: Jendouba" 
          placeholderTextColor="#94A3B8" 
          value={depart} 
          onChangeText={(text) => { setDepart(text); if (errors.depart) setErrors({ ...errors, depart: '' }); }}
        />
        {errors.depart && <Text style={styles.errorMessage}>{errors.depart}</Text>}

        <Text style={styles.label}>Ville d&apos;arrivée</Text>
        <TextInput 
          style={[styles.input, errors.arrivee && styles.inputError]} 
          placeholder="Ex: Tunis" 
          placeholderTextColor="#94A3B8" 
          value={arrivee} 
          onChangeText={(text) => { setArrivee(text); if (errors.arrivee) setErrors({ ...errors, arrivee: '' }); }}
        />
        {errors.arrivee && <Text style={styles.errorMessage}>{errors.arrivee}</Text>}

        <Text style={styles.label}>Heure de départ</Text>
        <TextInput 
          style={[styles.input, errors.heure && styles.inputError]} 
          placeholder="Ex: 08:00" 
          placeholderTextColor="#94A3B8" 
          value={heure} 
          onChangeText={(text) => { setHeure(text); if (errors.heure) setErrors({ ...errors, heure: '' }); }}
        />
        {errors.heure && <Text style={styles.errorMessage}>{errors.heure}</Text>}

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Places (Max 8)</Text>
            <TextInput 
              style={[styles.input, errors.places && styles.inputError]} 
              placeholder="1-8" 
              placeholderTextColor="#94A3B8" 
              value={places} 
              onChangeText={(text) => {
                const num = text.replace(/[^0-9]/g, '');
                if (num === '' || Number(num) <= 8) {
                  setPlaces(num);
                  if (errors.places) setErrors({ ...errors, places: '' });
                }
              }} 
              keyboardType="numeric"
              maxLength={1}
            />
            {errors.places && <Text style={styles.errorMessage}>{errors.places}</Text>}
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Prix</Text>
            <TextInput 
              style={[styles.input, errors.prix && styles.inputError]} 
              placeholder="15" 
              placeholderTextColor="#94A3B8" 
              value={prix} 
              onChangeText={(text) => { setPrix(text); if (errors.prix) setErrors({ ...errors, prix: '' }); }}
              keyboardType="numeric" 
            />
            {errors.prix && <Text style={styles.errorMessage}>{errors.prix}</Text>}
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handlePublish} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Publier le trajet</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#EEF4FF',
    padding: 20,
  },
  hero: {
    backgroundColor: '#1E3A8A',
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
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
    fontSize: 28,
    lineHeight: 34,
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
    borderRadius: 22,
    padding: 18,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  button: {
    backgroundColor: '#2563EB',
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
  cancelText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 15,
  },
});
