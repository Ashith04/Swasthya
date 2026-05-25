import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getUser, removeUser } from '../utils/store';
import { api } from '../utils/api';

const { width } = Dimensions.get('window');

// Custom Slider component replacing the deprecated react-native Slider
const CustomSlider = ({ 
  value, 
  onValueChange, 
  activeColor 
}: { 
  value: number; 
  onValueChange: (val: number) => void; 
  activeColor: string; 
}) => {
  const handleDecrease = () => {
    onValueChange(Math.max(0, value - 10));
  };

  const handleIncrease = () => {
    onValueChange(Math.min(100, value + 10));
  };

  return (
    <View style={styles.sliderContainerRow}>
      <TouchableOpacity 
        style={styles.adjustButton} 
        onPress={handleDecrease}
        activeOpacity={0.7}
      >
        <MaterialIcons name="remove" size={16} color={activeColor} />
      </TouchableOpacity>
      
      <View style={styles.sliderTrackBackground}>
        <View style={[styles.sliderTrackFilled, { width: `${value}%`, backgroundColor: activeColor }]} />
        <View style={[styles.sliderThumb, { left: `${value}%`, borderColor: activeColor }]} />
      </View>

      <TouchableOpacity 
        style={styles.adjustButton} 
        onPress={handleIncrease}
        activeOpacity={0.7}
      >
        <MaterialIcons name="add" size={16} color={activeColor} />
      </TouchableOpacity>
    </View>
  );
};

export default function CalmWaveHome() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Quick check-in slider states
  const [sleepQuality, setSleepQuality] = useState(80);
  const [energy, setEnergy] = useState(50);
  const [focus, setFocus] = useState(90);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const userId = await getUser();
      if (!userId) {
        router.replace('/otp-login');
        return;
      }
      const res = await api.get(`/dashboard/${userId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeUser();
    router.replace('/otp-login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#466736" />
      </View>
    );
  }

  // Calculate wellness score based on latest anomaly score
  // If anomaly score is high, wellness is low.
  const anomalyScore = data?.healthStatus?.anomalyScore || 0.16;
  const wellnessScore = Math.round(100 - (anomalyScore * 100));

  // Determine wellness rating text
  let wellnessRating = "Optimal";
  if (wellnessScore < 50) wellnessRating = "Critical Needs";
  else if (wellnessScore < 75) wellnessRating = "Mild Stress";

  return (
    <View style={styles.outerContainer}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="spa" size={24} color="#466736" style={styles.logoIcon} />
          <Text style={styles.headerTitle}>Swasthya</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialIcons name="notifications" size={22} color="#466736" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Good evening, {data?.user?.name?.split(' ')[0] || 'Aditi'}</Text>
          <Text style={styles.subGreetingText}>Here's how you're doing today.</Text>
        </View>

        {/* Wellness Score Circular Indicator */}
        <View style={styles.wellnessRingSection}>
          <View style={styles.wellnessRingOuter}>
            <View style={styles.wellnessRingInner}>
              <Text style={styles.wellnessScoreNumber}>{wellnessScore}</Text>
              <Text style={styles.wellnessScoreLabel}>WELLNESS SCORE</Text>
            </View>
          </View>
        </View>

        {/* Body Signals Grid */}
        <View style={styles.gridContainer}>
          {/* Steps */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="walk" size={16} color="#3E6187" />
              <Text style={styles.cardHeaderLabel}>Steps</Text>
            </View>
            <Text style={styles.cardValueText}>
              {data?.user?.steps !== undefined ? data.user.steps.toLocaleString() : '6,420'}
            </Text>
          </View>

          {/* Active Mins */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="bolt" size={16} color="#466736" />
              <Text style={styles.cardHeaderLabel}>Active Mins</Text>
            </View>
            <Text style={styles.cardValueText}>
              {data?.user?.activeMins !== undefined ? data.user.activeMins : 45}
              <Text style={styles.cardValueSubText}>m</Text>
            </Text>
          </View>

          {/* Sleep */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="bedtime" size={16} color="#476271" />
              <Text style={styles.cardHeaderLabel}>Sleep</Text>
            </View>
            <Text style={styles.cardValueText}>
              {data?.user?.sleepHours !== undefined ? data.user.sleepHours : 7}
              <Text style={styles.cardValueSubText}>h</Text>
              {data?.user?.sleepMins !== undefined ? data.user.sleepMins : 20}
              <Text style={styles.cardValueSubText}>m</Text>
            </Text>
          </View>

          {/* Heart Rate */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="favorite" size={16} color="#ba1a1a" />
              <Text style={styles.cardHeaderLabel}>Heart Rate</Text>
            </View>
            <Text style={styles.cardValueText}>
              {data?.user?.heartRate !== undefined ? data.user.heartRate : 72}
              <Text style={styles.cardValueSubText}>bpm</Text>
            </Text>
          </View>
        </View>

        {/* 7-Day Mood Trend */}
        <View style={styles.trendSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>7-day Mood Trend</Text>
            <TouchableOpacity>
              <MaterialIcons name="more-vert" size={20} color="#73796d" />
            </TouchableOpacity>
          </View>
          <View style={styles.chartContainer}>
            {/* Bar 1 */}
            <View style={styles.chartBarColumn}>
              <View style={[styles.chartBarFilled, { height: '40%' }]} />
              <Text style={styles.chartBarLabel}>M</Text>
            </View>
            {/* Bar 2 */}
            <View style={styles.chartBarColumn}>
              <View style={[styles.chartBarFilled, { height: '60%' }]} />
              <Text style={styles.chartBarLabel}>T</Text>
            </View>
            {/* Bar 3 */}
            <View style={styles.chartBarColumn}>
              <View style={[styles.chartBarFilled, { height: '85%' }]} />
              <Text style={styles.chartBarLabel}>W</Text>
            </View>
            {/* Bar 4 */}
            <View style={styles.chartBarColumn}>
              <View style={[styles.chartBarFilled, { height: '45%' }]} />
              <Text style={styles.chartBarLabel}>T</Text>
            </View>
            {/* Bar 5 */}
            <View style={styles.chartBarColumn}>
              <View style={[styles.chartBarFilled, { height: '95%', backgroundColor: '#466736' }]} />
              <Text style={[styles.chartBarLabel, { color: '#466736', fontWeight: 'bold' }]}>F</Text>
            </View>
            {/* Bar 6 */}
            <View style={styles.chartBarColumn}>
              <View style={[styles.chartBarFilled, { height: '70%' }]} />
              <Text style={styles.chartBarLabel}>S</Text>
            </View>
            {/* Bar 7 */}
            <View style={styles.chartBarColumn}>
              <View style={[styles.chartBarFilled, { height: '55%' }]} />
              <Text style={styles.chartBarLabel}>S</Text>
            </View>
          </View>
        </View>

        {/* Last Call Summary Card */}
        <View style={styles.voiceSummaryCard}>
          <View style={styles.voiceHeaderRow}>
            <View style={styles.voiceAvatarContainer}>
              <MaterialIcons name="psychology" size={24} color="#466736" />
            </View>
            <View>
              <Text style={styles.voiceTitle}>Last Voice Summary</Text>
              <Text style={styles.voiceSubtitle}>Yesterday, 9:30 PM</Text>
            </View>
          </View>
          
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, { backgroundColor: '#cae7f8' }]}>
              <Text style={[styles.tagText, { color: '#001e2b' }]}>Restful Sleep</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#bde4a7' }]}>
              <Text style={[styles.tagText, { color: '#062100' }]}>Calm</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#afd2fe' }]}>
              <Text style={[styles.tagText, { color: '#001d36' }]}>Low Anxiety</Text>
            </View>
          </View>

          <View style={styles.distressContainer}>
            <View style={styles.distressLabelRow}>
              <Text style={styles.distressLabel}>Distress level</Text>
              <Text style={styles.distressValue}>{(anomalyScore * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFilled, { width: `${anomalyScore * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Quick Check-in Sliders */}
        <View style={styles.slidersSection}>
          <Text style={styles.sectionTitle}>Quick Check-in</Text>
          
          {/* Sleep Quality */}
          <View style={styles.sliderCard}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Sleep Quality</Text>
              <Text style={[styles.sliderValueText, { color: '#466736' }]}>
                {sleepQuality > 75 ? 'Well Rested' : sleepQuality > 40 ? 'Moderate' : 'Exhausted'}
              </Text>
            </View>
            <CustomSlider
              value={sleepQuality}
              onValueChange={setSleepQuality}
              activeColor="#466736"
            />
          </View>

          {/* Energy */}
          <View style={styles.sliderCard}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Energy</Text>
              <Text style={[styles.sliderValueText, { color: '#3E6187' }]}>
                {energy > 75 ? 'Vibrant' : energy > 40 ? 'Moderate' : 'Fatigued'}
              </Text>
            </View>
            <CustomSlider
              value={energy}
              onValueChange={setEnergy}
              activeColor="#3E6187"
            />
          </View>

          {/* Focus */}
          <View style={styles.sliderCard}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Focus</Text>
              <Text style={[styles.sliderValueText, { color: '#476271' }]}>
                {focus > 75 ? 'Sharp' : focus > 40 ? 'Moderate' : 'Distracted'}
              </Text>
            </View>
            <CustomSlider
              value={focus}
              onValueChange={setFocus}
              activeColor="#476271"
            />
          </View>
        </View>

        {/* Mood trigger navigation button */}
        <TouchableOpacity 
          style={styles.microCheckinButton}
          onPress={() => router.push('/micro-checkin')}
        >
          <Text style={styles.microCheckinText}>Log Somatic Check-In</Text>
          <MaterialIcons name="edit" size={16} color="#fafaf3" />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* Analytics (Active) */}
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => {}}>
          <MaterialIcons name="analytics" size={24} color="#062100" />
          <Text style={[styles.navText, styles.navTextActive]}>Analytics</Text>
        </TouchableOpacity>

        {/* Calm Waves */}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/breathing-tools')}>
          <MaterialIcons name="waves" size={24} color="#79747E" />
          <Text style={styles.navText}>Calm Waves</Text>
        </TouchableOpacity>

        {/* Chat */}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/swasthya-chat')}>
          <MaterialIcons name="chat-bubble" size={24} color="#79747E" />
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <MaterialIcons name="person" size={24} color="#79747E" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#fafaf3',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fafaf3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: '#fafaf3',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 200, 187, 0.2)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#466736',
    fontFamily: 'Plus Jakarta Sans',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1c18',
    fontFamily: 'Plus Jakarta Sans',
  },
  subGreetingText: {
    fontSize: 14,
    color: '#43483e',
    marginTop: 2,
    fontFamily: 'Plus Jakarta Sans',
  },
  wellnessRingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  wellnessRingOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: '#e8e9e2',
    justifyContent: 'center',
    alignItems: 'center',
    // Apply soft drop shadow
    shadowColor: '#466736',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    backgroundColor: '#ffffff',
  },
  wellnessRingInner: {
    alignItems: 'center',
  },
  wellnessScoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#466736',
  },
  wellnessScoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#73796d',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 16,
  },
  glassCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLabel: {
    fontSize: 12,
    color: '#43483e',
    fontWeight: '500',
    marginLeft: 6,
  },
  cardValueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1c18',
  },
  cardValueSubText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#73796d',
  },
  trendSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(195, 200, 187, 0.2)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1c18',
  },
  chartContainer: {
    height: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  chartBarColumn: {
    width: '10%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBarFilled: {
    width: '100%',
    backgroundColor: 'rgba(175, 210, 254, 0.4)',
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#73796d',
    marginTop: 8,
  },
  voiceSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(195, 200, 187, 0.2)',
  },
  voiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#c7eeb0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1c18',
  },
  voiceSubtitle: {
    fontSize: 12,
    color: '#73796d',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  distressContainer: {
    marginTop: 4,
  },
  distressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  distressLabel: {
    fontSize: 12,
    color: '#43483e',
  },
  distressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#466736',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e2e3dc',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFilled: {
    height: '100%',
    backgroundColor: '#466736',
    borderRadius: 3,
  },
  slidersSection: {
    marginBottom: 20,
  },
  sliderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(195, 200, 187, 0.2)',
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1c18',
  },
  sliderValueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sliderContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(195, 200, 187, 0.4)',
    shadowColor: '#466736',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sliderComponent: {
    height: 20,
  },
  sliderTrackBackground: {
    height: 6,
    backgroundColor: '#e2e3dc',
    borderRadius: 3,
    position: 'relative',
    marginVertical: 12,
    flex: 1,
    marginHorizontal: 12,
  },
  sliderTrackFilled: {
    height: '100%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    marginLeft: -8,
  },
  microCheckinButton: {
    backgroundColor: '#466736',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#466736',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  microCheckinText: {
    color: '#fafaf3',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 6,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#f4f4ed',
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 200, 187, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 99,
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  navItemActive: {
    backgroundColor: '#c7eeb0',
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 4,
    transform: [{ scale: 0.95 }],
  },
  navText: {
    fontSize: 10,
    color: '#79747E',
    marginTop: 2,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#062100',
    fontWeight: 'bold',
  },
});
