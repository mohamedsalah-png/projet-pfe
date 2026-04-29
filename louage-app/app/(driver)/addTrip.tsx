import { useState, useMemo, createElement, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Modal, 
  Platform,
  FlatList,
  Keyboard
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addTrajet } from '../../services/api';
import { TUNISIAN_CITIES } from '../../data/cities';
import { getMapHtml } from '../../components/MapHtml';

export default function AddTrip() {
  const router = useRouter();
  const [depart, setDepart] = useState('');
  const [arrivee, setArrivee] = useState('');
  const [heure, setHeure] = useState('');
  const [places, setPlaces] = useState('');
  const [prix, setPrix] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [mapVisible, setMapVisible] = useState(false);
  const [mapTarget, setMapTarget] = useState<'depart' | 'arrivee' | null>(null);

  const [activeInput, setActiveInput] = useState<'depart' | 'arrivee' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Generate Map HTML
  const mapHtmlContent = useMemo(() => getMapHtml(depart, arrivee), [depart, arrivee, mapVisible]);

  // Autocomplete Filtering
  const filteredCities = useMemo(() => {
    if (!searchQuery) return [];
    return TUNISIAN_CITIES.filter(city => 
      city.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectCity = (cityName: string) => {
    if (activeInput === 'depart') {
      setDepart(cityName);
      if (errors.depart) setErrors({ ...errors, depart: '' });
    } else if (activeInput === 'arrivee') {
      setArrivee(cityName);
      if (errors.arrivee) setErrors({ ...errors, arrivee: '' });
    }
    setActiveInput(null);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CITY_SELECTED') {
            if (mapTarget === 'depart') {
              setDepart(data.city);
              if (errors.depart) setErrors({ ...errors, depart: '' });
            } else if (mapTarget === 'arrivee') {
              setArrivee(data.city);
              if (errors.arrivee) setErrors({ ...errors, arrivee: '' });
            }
            setMapVisible(false);
          }
        } catch (e) {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [mapTarget, errors]);

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CITY_SELECTED') {
        if (mapTarget === 'depart') {
          setDepart(data.city);
          if (errors.depart) setErrors({ ...errors, depart: '' });
        } else if (mapTarget === 'arrivee') {
          setArrivee(data.city);
          if (errors.arrivee) setErrors({ ...errors, arrivee: '' });
        }
        setMapVisible(false);
      }
    } catch (e) {}
  };

  const handlePublish = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!depart.trim()) newErrors.depart = "Ville de depart obligatoire";
    if (!arrivee.trim()) newErrors.arrivee = "Ville d'arrivee obligatoire";
    if (!heure.trim()) newErrors.heure = "Heure de depart obligatoire";
    if (!places.trim()) newErrors.places = "Nombre de places obligatoire";
    if (!prix.trim()) newErrors.prix = "Prix obligatoire";

    const placesNum = Number(places);
    if (places && (placesNum <= 0 || placesNum > 8)) {
      newErrors.places = '1 a 8 places requis';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        router.replace('/(auth)/login');
        return;
      }
      await addTrajet({ depart, arrivee, heure, places: placesNum, prix: Number(prix) }, token);
      router.back();
    } catch (error: any) {
      console.error('[AddTrip] Error publishing trajet:', error.response?.data || error.message);
      setErrors({ server: error.response?.data?.message || 'Impossible de publier le trajet !' });
    } finally {
      setLoading(false);
    }
  };

  const renderAutocomplete = (type: 'depart' | 'arrivee') => {
    if (activeInput === type && filteredCities.length > 0) {
      return (
        <View style={styles.autocompleteContainer}>
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectCity(item.name)}>
                <Ionicons name="location-outline" size={18} color="#EA580C" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>LOUAGE.TN</Text>
        <Text style={styles.title}>Publiez votre trajet</Text>
        <Text style={styles.subtitle}>Saisissez les details de votre itineraire pour attirer des passagers.</Text>
      </View>

      <View style={styles.form}>
        {errors.server && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errors.server}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ville de depart</Text>
          <View style={[styles.inputContainer, errors.depart && styles.inputError]}>
            <TextInput 
              style={styles.inputWithIcon} 
              placeholder="Ex: Jendouba" 
              placeholderTextColor="#94A3B8" 
              value={activeInput === 'depart' ? searchQuery : depart}
              onFocus={() => { setActiveInput('depart'); setSearchQuery(depart); }}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (activeInput !== 'depart') setActiveInput('depart');
                if (errors.depart) setErrors({ ...errors, depart: '' });
              }}
            />
            <TouchableOpacity style={styles.mapIconButton} onPress={() => { setMapTarget('depart'); setMapVisible(true); }}>
              <Ionicons name="map-outline" size={24} color="#EA580C" />
            </TouchableOpacity>
          </View>
          {renderAutocomplete('depart')}
          {errors.depart && <Text style={styles.errorMessage}>{errors.depart}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ville d&apos;arrivée</Text>
          <View style={[styles.inputContainer, errors.arrivee && styles.inputError]}>
            <TextInput 
              style={styles.inputWithIcon} 
              placeholder="Ex: Tunis" 
              placeholderTextColor="#94A3B8" 
              value={activeInput === 'arrivee' ? searchQuery : arrivee}
              onFocus={() => { setActiveInput('arrivee'); setSearchQuery(arrivee); }}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (activeInput !== 'arrivee') setActiveInput('arrivee');
                if (errors.arrivee) setErrors({ ...errors, arrivee: '' });
              }}
            />
            <TouchableOpacity style={styles.mapIconButton} onPress={() => { setMapTarget('arrivee'); setMapVisible(true); }}>
              <Ionicons name="map-outline" size={24} color="#EA580C" />
            </TouchableOpacity>
          </View>
          {renderAutocomplete('arrivee')}
          {errors.arrivee && <Text style={styles.errorMessage}>{errors.arrivee}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Heure de départ</Text>
          <TextInput 
            style={[styles.input, errors.heure && styles.inputError]} 
            placeholder="Ex: 08:00" 
            placeholderTextColor="#94A3B8" 
            value={heure} 
            onChangeText={(text) => { setHeure(text); if (errors.heure) setErrors({ ...errors, heure: '' }); }}
          />
          {errors.heure && <Text style={styles.errorMessage}>{errors.heure}</Text>}
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Places (1-8)</Text>
            <TextInput 
              style={[styles.input, errors.places && styles.inputError]} 
              placeholder="Ex: 8" 
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
            <Text style={styles.label}>Prix (DT)</Text>
            <TextInput 
              style={[styles.input, errors.prix && styles.inputError]} 
              placeholder="Ex: 15" 
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
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Ville {mapTarget === 'depart' ? 'de depart' : "d'arrivee"}
          </Text>
          <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#0F172A" />
          </TouchableOpacity>
        </View>
        {Platform.OS === 'web' ? (
          createElement('iframe', {
            srcDoc: mapHtmlContent,
            style: { width: '100%', height: '100%', border: 'none' },
            sandbox: 'allow-scripts allow-same-origin'
          })
        ) : (
          <WebView
            source={{ html: mapHtmlContent }}
            onMessage={handleMapMessage}
            style={{ flex: 1 }}
          />
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  hero: {
    backgroundColor: '#1E3A8A',
    borderRadius: 0,
    paddingHorizontal: 24,
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
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
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
    margin: 16,
    marginTop: -20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D7E3F4',
    borderRadius: 16,
    overflow: 'hidden',
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
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  mapIconButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#D7E3F4',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  errorMessage: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  autocompleteContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 4,
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    zIndex: 100,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: {
    fontSize: 15,
    color: '#334155',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
  },
});
