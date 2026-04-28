import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminLogin } from '../../services/api';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      console.log(`[FRONTEND ADMIN] Tentative de connexion avec email: '${cleanEmail}'`);
      const response = await adminLogin({ email: cleanEmail, password });
      console.log(`[FRONTEND ADMIN] Connexion réussie, token reçu`);
      await AsyncStorage.setItem('adminToken', response.data.token);
      router.replace('/(admin)/dashboard');
    } catch (error: any) {
      console.error(`[FRONTEND ADMIN] Erreur de connexion:`, error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Identifiants incorrects ou erreur réseau.';
      Alert.alert('Accès refusé', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <Text style={styles.shieldIcon}>🛡️</Text>
            <Text style={styles.eyebrow}>Administration</Text>
            <Text style={styles.title}>Espace administrateur</Text>
            <Text style={styles.subtitle}>
              Accès réservé aux administrateurs de Louage.tn
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion Admin</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email administrateur</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@louage.tn"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe administrateur"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backLink}>← Retour à l&apos;accueil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  keyboardView: { flex: 1 },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  eyebrow: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  backLink: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
