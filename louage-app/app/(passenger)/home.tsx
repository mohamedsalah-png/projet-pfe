import { useState, useEffect, createElement, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Modal, 
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import LogoutButton from '../../components/LogoutButton';
import { Trajet, getTrajets } from '../../services/api';
import { TUNISIAN_CITIES, City } from '../../data/cities';
import { getMapHtml } from '../../components/MapHtml';

export default function PassengerHome() {
  const router = useRouter();
  const [depart, setDepart] = useState('');
  const [arrivee, setArrivee] = useState('');
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [mapVisible, setMapVisible] = useState(false);
  const [mapTarget, setMapTarget] = useState<'depart' | 'arrivee' | null>(null);

  const [activeInput, setActiveInput] = useState<'depart' | 'arrivee' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Generate Map HTML with current cities
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

  const invertCities = () => {
    const temp = depart;
    setDepart(arrivee);
    setArrivee(temp);
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          if (typeof event.data === 'string') {
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
          }
        } catch (e) {
          // ignore
        }
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

  const chercher = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!depart.trim()) newErrors.depart = 'Ville de départ obligatoire';
    if (!arrivee.trim()) newErrors.arrivee = "Ville d'arrivée obligatoire";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      const response = await getTrajets(depart, arrivee);
      setTrajets(response.data);

      if (response.data.length === 0) {
        Alert.alert('Info', 'Aucun trajet trouvé pour cette destination !');
      }
    } catch (error) {
      console.error('[PassengerHome] Error searching trajets:', error);
      Alert.alert('Erreur', 'Impossible de charger les trajets !');
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
            style={{ maxHeight: 200 }}
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={trajets}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>LOUAGE.TN</Text>
              <Text style={styles.title}>Trouvez votre prochain trajet</Text>
              <Text style={styles.subtitle}>
                Saisissez votre depart et votre destination pour reserver votre place.
              </Text>
            </View>

            <View style={styles.searchCard}>
              
              {/* VILLE DE DEPART */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ville de départ</Text>
                <View style={[styles.inputContainer, errors.depart && styles.inputError]}>
                  <Ionicons name="location" size={20} color="#EA580C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="D'où partez-vous ?"
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

              {/* BOUTON INVERSER */}
              <View style={styles.invertContainer}>
                <TouchableOpacity style={styles.invertButton} onPress={invertCities}>
                  <Ionicons name="swap-vertical" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* VILLE D'ARRIVEE */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ville d'arrivée</Text>
                <View style={[styles.inputContainer, errors.arrivee && styles.inputError]}>
                  <Ionicons name="flag" size={20} color="#10B981" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Où allez-vous ?"
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
                    <Ionicons name="map-outline" size={24} color="#10B981" />
                  </TouchableOpacity>
                </View>
                {renderAutocomplete('arrivee')}
                {errors.arrivee && <Text style={styles.errorMessage}>{errors.arrivee}</Text>}
              </View>

              <TouchableOpacity style={styles.button} onPress={chercher} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Rechercher les trajets</Text>}
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }: { item: Trajet }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.routeBadge}>
                <Text style={styles.routeBadgeText}>Disponible</Text>
              </View>
              <Text style={styles.price}>{item.prix} DT</Text>
            </View>

            <View style={styles.trajetHeader}>
              <Text style={styles.trajetCity}>{item.depart}</Text>
              <Ionicons name="arrow-forward" size={20} color="#94A3B8" style={{ marginHorizontal: 8 }}/>
              <Text style={styles.trajetCity}>{item.arrivee}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#64748B" />
              <Text style={styles.infoText}>{item.heure}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={16} color="#64748B" />
              <Text style={styles.infoText}>{item.places}/{item.placesInitiales || item.places} places restantes</Text>
            </View>

            <View style={styles.divider} />
            
            <Text style={styles.chauffeur}>🚗 {item.chauffeur?.nom} {item.chauffeur?.prenom}</Text>
            <Text style={styles.chauffeur}>📞 {item.chauffeur?.telephone}</Text>

            <TouchableOpacity
              style={[styles.reserveButton, item.places <= 0 && styles.reserveButtonDisabled]}
              disabled={item.places <= 0}
              onPress={() => router.push({
                pathname: '/(passenger)/booking',
                params: {
                  trajetId: item._id,
                  depart: item.depart,
                  arrivee: item.arrivee,
                  heure: item.heure,
                  prix: item.prix,
                  chauffeur: `${item.chauffeur?.nom} ${item.chauffeur?.prenom}`,
                  telephone: item.chauffeur?.telephone,
                  chauffeurId: item.chauffeur?._id,
                  places: item.places,
                },
              })}
            >
              <Text style={styles.reserveText}>{item.places <= 0 ? 'Complet' : 'Réserver une place'}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Faites une recherche pour afficher les trajets.</Text>}
        ListFooterComponent={<LogoutButton />}
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Sélectionner la ville {mapTarget === 'depart' ? 'de départ' : "d'arrivée"}
          </Text>
          <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#431407" />
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
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: '#EA580C',
    borderRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 30,
    marginBottom: 0,
  },
  eyebrow: {
    color: '#FFEDD5',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: '#FFEDD5',
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputGroup: {
    zIndex: 1, // Important for absolute positioned autocomplete
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputIcon: {
    paddingLeft: 14,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  mapIconButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
  autocompleteContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    maxHeight: 200,
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
    fontWeight: '500',
  },
  invertContainer: {
    alignItems: 'center',
    height: 1,
    justifyContent: 'center',
    zIndex: 2,
    marginVertical: 16,
  },
  invertButton: {
    backgroundColor: '#EA580C',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  routeBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  price: {
    color: '#EA580C',
    fontSize: 22,
    fontWeight: '900',
  },
  trajetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trajetCity: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    color: '#475569',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  chauffeur: {
    color: '#334155',
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  reserveButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  reserveButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  reserveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  empty: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 40,
    fontWeight: '500',
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
  webview: {
    flex: 1,
  },
});
