import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, getAdminUsers, updateAdminUser, deleteAdminUser } from '../../services/api';

// Helper pour les alertes cross-platform (web + mobile)
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: onConfirm },
    ]);
  }
};

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', telephone: '', email: '', role: '' });

  const loadUsers = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (!token) {
        router.replace('/(admin)/adminLogin');
        return;
      }
      const response = await getAdminUsers(token);
      setUsers(response.data);
      setFiltered(response.data);
    } catch (error) {
      console.error('[AdminUsers] Error loading:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => { loadUsers(); }, [loadUsers]));

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(users);
      return;
    }
    const q = text.toLowerCase();
    setFiltered(users.filter(u =>
      (u.nom || '').toLowerCase().includes(q) ||
      (u.prenom || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.telephone || '').includes(q)
    ));
  };

  const handleToggleSuspend = async (user: User) => {
    const action = user.suspended ? 'réactiver' : 'suspendre';
    showConfirm('Confirmation', `Voulez-vous ${action} ${user.nom} ${user.prenom} ?`, async () => {
      try {
        const token = await AsyncStorage.getItem('adminToken');
        if (!token) return;
        await updateAdminUser(user._id, { suspended: !user.suspended }, token);
        showAlert('Succès', `Compte ${action === 'suspendre' ? 'suspendu' : 'réactivé'} avec succès.`);
        loadUsers();
      } catch (error) {
        console.error('[AdminUsers] Error toggling suspend:', error);
        showAlert('Erreur', 'Impossible de modifier le statut.');
      }
    });
  };

  const handleDelete = (user: User) => {
    showConfirm(
      'Supprimer le compte',
      `Supprimer définitivement ${user.nom} ${user.prenom} et toutes ses données ?`,
      async () => {
        try {
          const token = await AsyncStorage.getItem('adminToken');
          if (!token) return;
          await deleteAdminUser(user._id, token);
          showAlert('Succès', 'Utilisateur supprimé.');
          loadUsers();
        } catch (error) {
          console.error('[AdminUsers] Error deleting:', error);
          showAlert('Erreur', 'Impossible de supprimer.');
        }
      }
    );
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      email: user.email,
      role: user.role,
    });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (!token) return;
      await updateAdminUser(editUser._id, editForm, token);
      setEditUser(null);
      showAlert('Succès', 'Utilisateur modifié.');
      loadUsers();
    } catch (error) {
      console.error('[AdminUsers] Error saving edit:', error);
      showAlert('Erreur', 'Impossible de sauvegarder.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={[styles.userCard, item.suspended && styles.suspendedCard]}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nom} {item.prenom}</Text>
          <View style={styles.badges}>
            <Text style={[styles.roleBadge, item.role === 'chauffeur' ? styles.driverBadge : styles.passengerBadge]}>
              {item.role === 'chauffeur' ? '🚗' : '🧑'} {item.role}
            </Text>
            {item.suspended && (
              <Text style={styles.suspendedBadge}>🚫 Suspendu</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.userDetails}>
        <Text style={styles.detailText}>📧 {item.email}</Text>
        <Text style={styles.detailText}>📞 {item.telephone}</Text>
        <Text style={styles.detailText}>📅 Inscrit le {formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openEdit(item)}>
          <Text style={styles.editButtonText}>✏️ Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.suspendButton, item.suspended && styles.reactivateButton]}
          onPress={() => handleToggleSuspend(item)}
        >
          <Text style={[styles.suspendButtonText, item.suspended && styles.reactivateText]}>
            {item.suspended ? '✅ Réactiver' : '🚫 Suspendre'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher un utilisateur..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={handleSearch}
        />
        <Text style={styles.countText}>{filtered.length} utilisateur(s)</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={!!editUser} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier l&apos;utilisateur</Text>

            <Text style={styles.modalLabel}>Nom</Text>
            <TextInput style={styles.modalInput} value={editForm.nom} onChangeText={(t) => setEditForm({ ...editForm, nom: t })} />

            <Text style={styles.modalLabel}>Prénom</Text>
            <TextInput style={styles.modalInput} value={editForm.prenom} onChangeText={(t) => setEditForm({ ...editForm, prenom: t })} />

            <Text style={styles.modalLabel}>Téléphone</Text>
            <TextInput style={styles.modalInput} value={editForm.telephone} onChangeText={(t) => setEditForm({ ...editForm, telephone: t })} keyboardType="phone-pad" />

            <Text style={styles.modalLabel}>Email</Text>
            <TextInput style={styles.modalInput} value={editForm.email} onChangeText={(t) => setEditForm({ ...editForm, email: t })} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.modalLabel}>Rôle</Text>
            <View style={styles.roleToggle}>
              <TouchableOpacity
                style={[styles.roleOption, editForm.role === 'passager' && styles.roleActive]}
                onPress={() => setEditForm({ ...editForm, role: 'passager' })}
              >
                <Text style={[styles.roleOptionText, editForm.role === 'passager' && styles.roleActiveText]}>Passager</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, editForm.role === 'chauffeur' && styles.roleActive]}
                onPress={() => setEditForm({ ...editForm, role: 'chauffeur' })}
              >
                <Text style={[styles.roleOptionText, editForm.role === 'chauffeur' && styles.roleActiveText]}>Chauffeur</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditUser(null)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                <Text style={styles.saveButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  userCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  suspendedCard: {
    borderColor: '#DC2626',
    opacity: 0.75,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  driverBadge: {
    backgroundColor: '#1E3A5F',
    color: '#93C5FD',
  },
  passengerBadge: {
    backgroundColor: '#3B1F2B',
    color: '#F9A8D4',
  },
  suspendedBadge: {
    backgroundColor: '#7F1D1D',
    color: '#FCA5A5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  userDetails: {
    gap: 4,
    marginBottom: 14,
  },
  detailText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  suspendButton: {
    flex: 1,
    backgroundColor: '#92400E',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reactivateButton: {
    backgroundColor: '#065F46',
  },
  suspendButtonText: {
    color: '#FDE68A',
    fontWeight: '700',
    fontSize: 13,
  },
  reactivateText: {
    color: '#A7F3D0',
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  modalLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#475569',
  },
  roleToggle: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
  },
  roleActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#3B82F6',
  },
  roleOptionText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  roleActiveText: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F59E0B',
  },
  saveButtonText: {
    color: '#0F172A',
    fontWeight: '800',
  },
});
