import { View, Text, StyleSheet } from 'react-native';

export default function BreathingTools() {
  return (
    <View style={styles.container}>
      <Text>Breathing Tools Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
