import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Swasthya</Text>
      <Button title="Get Started" onPress={() => router.push('/onboarding')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2A4365',
  },
});
