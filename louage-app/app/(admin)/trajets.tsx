import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trajet, getAdminTrajets, updateAdminTrajetStatus, deleteAdminTrajet } from '../../services/api';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') { window.alert(`${title}\n${message}`); }
  else { Alert.alert(title, message); }
};

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') { if (window.confirm(`${title}\n${message}`)) onConfirm(); }
  else { Alert.alert(title, message, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', onPress: onConfirm }]); }
};

export default function AdminTrajetsScreen() {
  const router = useRouter();
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [filtered, setFiltered] = useState<Trajet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTrajets = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (!token) {
        router.replace('/(admin)/adminLogin');
        return;
      }
      const response = await getAdminTrajets(token);
      setTrajets(response.data);
      setFiltered(response.data);
    } catch (error) {
      console.error('[AdminTrajets] Error loading:', error);
      showAlert('Erreur', 'Impossible de charger les trajets.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => { loadTrajets(); }, [loadTrajets]));

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(trajets);
      return;
    }
    const q = text.toLowerCase();
    setFiltered(trajets.filter(t =>
      (t.depart || '').toLowerCase().includes(q) ||
      (t.arrivee || '').toLowerCase().includes(q) ||
      (t.chauffeur?.nom || '').toLowerCase().includes(q) ||
      (t.chauffeur?.prenom || '').toLowerCase().includes(q)
    ));
  };

  const handleStatusChange = async (trajetId: string, newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (!token) return;
      await updateAdminTrajetStatus(trajetId, newStatus, token);
      loadTrajets();
    } catch (error) {
      console.error('[AdminTrajets] Error updating status:', error);
      showAlert('Erreur', 'Impossible de changer le statut.');
    }
  };

  const handleDelete = (trajet: Trajet) => {
    showConfirm(
      'Supprimer le trajet',
      `Supprimer ${trajet.depart} → ${trajet.arrivee} et tous les avis associés ?`,
      async () => {
        try {
          const token = await AsyncStorage.getItem('adminToken');
          if (!token) return;
          await deleteAdminTrajet(trajet._id, token);
          showAlert('Succès', 'Trajet supprimé.');
          loadTrajets();
        } catch (error) {
          console.error('[AdminTrajets] Error deleting:', error);
          showAlert('Erreur', 'Impossible de supprimer.');
        }
      }
    );
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'actif': return { bg: '#064E3B', text: '#6EE7B7' };
      case 'complet': return { bg: '#1E3A5F', text: '#93C5FD' };
      case 'annule': return { bg: '#7F1D1D', text: '#FCA5A5' };
      default: return { bg: '#334155', text: '#94A3B8' };
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const renderTrajet = ({ item }: { item: Trajet }) => {
    const statusColor = getStatusColor(item.statut);
    const demandesCount = (item.demandes || []).length;
    const reservationsCount = (item.reservations || []).length;
    const pendingCount = (item.demandes || []).filter((d: any) => d.status === 'pending').length;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.route}>{item.depart} → {item.arrivee}</Text>
            <Text style={styles.driverName}>
              🚗 {item.chauffeur?.nom || '?'} {item.chauffeur?.prenom || ''}
            </Text>
          </View>
          <Text style={[styles.statusBadge, { backgroundColor: statusColor.bg, color: statusColor.text }]}>
            {item.statut}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoItem}>🕐 {item.heure}</Text>
          <Text style={styles.infoItem}>💰 {item.prix} DT</Text>
          <Text style={styles.infoItem}>💺 {item.places}/{item.placesInitiales || '?'}</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>📋 {demandesCount} demande(s)</Text>
          <Text style={styles.statText}>✅ {reservationsCount} réservation(s)</Text>
          {pendingCount > 0 && <Text style={[styles.statText, { color: '#F59E0B' }]}>⏳ {pendingCount} en attente</Text>}
        </View>

        <Text style={styles.dateText}>📅 Créé le {formatDate(item.createdAt)}</Text>

        {/* Status Override */}
        <Text style={styles.statusLabel}>Changer le statut :</Text>
        <View style={styles.statusButtons}>
          {['actif', 'complet', 'annule'].map((s) => {
            const sc = getStatusColor(s);
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusOption,
                  { backgroundColor: item.statut === s ? sc.bg : '#0F172A', borderColor: sc.text },
                ]}
                onPress={() => handleStatusChange(item._id, s)}
              >
                <Text style={[styles.statusOptionText, { color: sc.text }]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteButtonText}>🗑️ Supprimer le trajet</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher par ville ou chauffeur..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={handleSearch}
        />
        <Text style={styles.countText}>{filtered.length} trajet(s)</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderTrajet}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun trajet trouvé.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  searchContainer: {
    padding: 16,
    gap: 8,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#334155',
  },
  countText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'right',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  route: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  driverName: {
    color: '#94A3B8',
    fontSize: 14,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  infoItem: {
    color: '#CBD5E1',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  statText: {
    color: '#64748B',
    fontSize: 13,
  },
  dateText: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 12,
  },
  statusLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FCA5A5',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
