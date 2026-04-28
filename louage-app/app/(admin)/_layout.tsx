import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800' },
      }}
    >
      <Stack.Screen name="adminLogin" options={{ title: 'Administration', headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ title: 'Tableau de bord' }} />
      <Stack.Screen name="users" options={{ title: 'Gestion des utilisateurs' }} />
      <Stack.Screen name="trajets" options={{ title: 'Gestion des trajets' }} />
      <Stack.Screen name="avis" options={{ title: 'Gestion des avis' }} />
    </Stack>
  );
}
