import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAdminStats } from '../../services/api';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') { window.alert(`${title}\n${message}`); }
  else { Alert.alert(title, message); }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      if (!token) {
        router.replace('/(admin)/adminLogin');
        return;
      }
      const response = await getAdminStats(token);
      setStats(response.data);
    } catch (error) {
      console.error('[AdminDashboard] Error loading stats:', error);
      showAlert('Erreur', 'Session expirée.');
      router.replace('/(admin)/adminLogin');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('adminToken');
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  const StatCard = ({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const ActionButton = ({ label, icon, onPress, color }: { label: string; icon: string; onPress: () => void; color: string }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, Admin 👋</Text>
          <Text style={styles.headerSubtitle}>Voici l&apos;état de votre application</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>Statistiques</Text>
      <View style={styles.statsGrid}>
        <StatCard icon="👥" label="Utilisateurs" value={stats?.users?.total || 0} color="#3B82F6" />
        <StatCard icon="🚗" label="Chauffeurs" value={stats?.users?.chauffeurs || 0} color="#8B5CF6" />
        <StatCard icon="🧑" label="Passagers" value={stats?.users?.passagers || 0} color="#10B981" />
        <StatCard icon="🚫" label="Suspendus" value={stats?.users?.suspended || 0} color="#EF4444" />
        <StatCard icon="🛣️" label="Trajets actifs" value={stats?.trajets?.actif || 0} color="#F59E0B" />
        <StatCard icon="✅" label="Complets" value={stats?.trajets?.complet || 0} color="#06B6D4" />
        <StatCard icon="❌" label="Annulés" value={stats?.trajets?.annule || 0} color="#F43F5E" />
        <StatCard icon="⭐" label="Note moyenne" value={stats?.avis?.average || '—'} color="#F59E0B" />
        <StatCard icon="💬" label="Total avis" value={stats?.avis?.total || 0} color="#8B5CF6" />
        <StatCard icon="📊" label="Total trajets" value={stats?.trajets?.total || 0} color="#3B82F6" />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Gestion</Text>
      <View style={styles.actionsContainer}>
        <ActionButton
          icon="👥"
          label="Gérer les utilisateurs"
          color="#1E3A5F"
          onPress={() => router.push('/(admin)/users')}
        />
        <ActionButton
          icon="🛣️"
          label="Gérer les trajets"
          color="#1E3A5F"
          onPress={() => router.push('/(admin)/trajets')}
        />
        <ActionButton
          icon="⭐"
          label="Gérer les avis"
          color="#1E3A5F"
          onPress={() => router.push('/(admin)/avis')}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    width: '48%' as any,
    flexGrow: 1,
    borderLeftWidth: 4,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionArrow: {
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
