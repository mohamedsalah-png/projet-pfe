import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avis, getAdminAvis, deleteAdminAvis } from '../../services/api';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') { window.alert(`${title}\n${message}`); }
  else { Alert.alert(title, message); }
};

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') { if (window.confirm(`${title}\n${message}`)) onConfirm(); }
  else { Alert.alert(title, message, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', onPress: onConfirm }]); }
};

export default function AdminAvisScreen() {
  const router = useRouter();
  const [avisList, setAvisList] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAvis = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (!token) {
        router.replace('/(admin)/adminLogin');
        return;
      }
      const response = await getAdminAvis(token);
      setAvisList(response.data);
    } catch (error) {
      console.error('[AdminAvis] Error loading:', error);
      showAlert('Erreur', 'Impossible de charger les avis.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => { loadAvis(); }, [loadAvis]));

  const handleDelete = (avis: Avis) => {
    showConfirm(
      "Supprimer l'avis",
      'Voulez-vous vraiment supprimer cet avis ?',
      async () => {
        try {
          const token = await AsyncStorage.getItem('adminToken');
          if (!token) return;
          await deleteAdminAvis(avis._id, token);
          showAlert('Succès', 'Avis supprimé.');
          loadAvis();
        } catch (error) {
          console.error('[AdminAvis] Error deleting:', error);
          showAlert('Erreur', "Impossible de supprimer l'avis.");
        }
      }
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const renderAvis = ({ item }: { item: Avis }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.ratingContainer}>
          <Text style={styles.stars}>{'⭐'.repeat(Math.floor(item.note || 0))}</Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.comment}>{item.commentaire || 'Aucun commentaire'}</Text>

      <View style={styles.usersInfo}>
        <Text style={styles.userText}>🧑 Passager: {item.passager?.nom || ''} {item.passager?.prenom || ''}</Text>
        <Text style={styles.userText}>🚗 Chauffeur: {item.chauffeur?.nom || ''} {item.chauffeur?.prenom || ''}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={avisList}
          keyExtractor={(item) => item._id}
          renderItem={renderAvis}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun avis trouvé.</Text>}
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  listContent: {
    padding: 16,
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
  ratingContainer: {
    gap: 4,
  },
  stars: {
    fontSize: 16,
  },
  date: {
    color: '#64748B',
    fontSize: 12,
  },
  comment: {
    color: '#FFFFFF',
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 22,
  },
  usersInfo: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  userText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
