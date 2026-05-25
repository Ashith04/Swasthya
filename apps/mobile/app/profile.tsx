import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getUser, removeUser } from '../utils/store';
import { api } from '../utils/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userId = await getUser();
      if (!userId) {
        router.replace('/otp-login');
        return;
      }
      const res = await api.get(`/dashboard/${userId}`);
      if (res.data.success && res.data.data.user) {
        setUser(res.data.data.user);
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeUser();
    router.replace('/otp-login');
  };

  const handleToggleLanguage = async () => {
    if (!user?._id) return;
    
    // Cycle between en -> kn -> en (Hindi removed)
    let nextLang = 'en';
    if (user.language === 'en' || !user.language) {
      nextLang = 'kn';
    } else if (user.language === 'kn') {
      nextLang = 'en';
    }

    try {
      setLoading(true);
      const res = await api.post('/users/update-language', {
        userId: user._id,
        language: nextLang
      });

      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Failed to toggle language:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallASHA = () => {
    Linking.openURL('tel:+919353048159');
  };

  const handleCallAI = () => {
    Linking.openURL('tel:+19412063766');
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#466736" />
      </View>
    );
  }

  const name = user?.name || 'Aditi Sharma';
  const displayId = user?._id ? `#SW-${user._id.slice(-4).toUpperCase()}` : '#SW-9921';

  let displayLang = 'English';
  if (user?.language === 'kn') displayLang = 'ಕನ್ನಡ (Kannada)';

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
        {/* User Profile Section */}
        <View style={styles.profileHero}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuuuu9eyLgHvx2UJhuQc0sirjb_BshXi-DSnME96K4BuPU7Fg7vuZXSIsTbvBwmvsNLVFlArAOGUjCsPO5x0L9V2mMxhINVZwiA3CRj164HM4dwhdocOAkP7VLn-P6f4mXdGzP0MR-SNcimwfVllQQUqDfOJjf5oG15Q_dy4FTnaQmGSr5AVDsW48wWEzSszo6XiChwjDtdbOvFmVUIZNxU0OkRB7jhjK7tpNOPblm9P7VLGW73twpWA4BAdviUFS-6XdO7dgcor4d' }} 
              style={styles.avatarImage} 
            />
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#fafaf3" />
            </View>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <View style={styles.idBadge}>
            <MaterialIcons name="badge" size={14} color="#375a80" style={styles.badgeIcon} />
            <Text style={styles.idText}>Wellness Card ID: {displayId}</Text>
          </View>
        </View>

        {/* Assigned ASHA Worker Support Widget */}
        <View style={styles.supportCard}>
          <View style={styles.supportLeft}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBW0abyKUet7oLRgDXWMFSVkgZXRZyjYuksmMbmniXwR6p-BU6QwIAVFgiYClCk1a3ZAAgofZANUD0KjIbWtDxdTz0_oS7Whddaq3jyskDCNXuUcS47guFEFvNKW2k4ZBct1LezHNpOzlQ5dSXyASSygx8MwnUCwZ2kUXaomnDXby2SiFfxTDNcnAN2VlmlqP2t5pok-0x-vhZX96rm1FZj2rA_9h7maPTDOm11k5ecEPyAr_lwutVMhBCPj2tB1-rLH7iBHs2x2DQx' }} 
              style={styles.supportAvatar} 
            />
            <View>
              <Text style={styles.supportLabel}>Assigned ASHA Worker</Text>
              <Text style={styles.supportName}>Sunita D.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.supportCallButton} onPress={handleCallASHA}>
            <MaterialIcons name="call" size={20} color="#fafaf3" />
          </TouchableOpacity>
        </View>

        {/* Swasthya AI Voice Companion Widget */}
        <View style={styles.aiVoiceCard}>
          <View style={styles.aiVoiceTopRow}>
            <View style={styles.aiVoiceLeft}>
              <View style={styles.aiVoiceAvatarBg}>
                <MaterialIcons name="settings-voice" size={22} color="#466736" />
              </View>
              <View style={styles.aiVoiceHeaderContainer}>
                <Text style={styles.aiVoiceLabel}>AI VOICE BOT</Text>
                <Text style={styles.aiVoiceName}>Swasthya Assistant</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.aiVoiceCallButton} onPress={handleCallAI}>
              <MaterialIcons name="call" size={20} color="#fafaf3" />
            </TouchableOpacity>
          </View>

          <Text style={styles.aiVoiceDesc}>
            {user?.language === 'kn' 
              ? "ಕನ್ನಡದಲ್ಲಿ ಸಂಭಾಷಿಸಲು ಈ ಕರೆಯನ್ನು ಮಾಡಿ. ನಮ್ಮ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಸಹಾಯಕರು ನಿಮಗೆ ಕನ್ನಡದಲ್ಲೇ ಉತ್ತರಿಸುತ್ತಾರೆ."
              : user?.language === 'hi'
              ? "हिंदी में बात करने के लिए इस नंबर पर कॉल करें। हमारा एआई सहायक आपसे हिंदी में बात करेगा।"
              : "Dial to speak with our compassionate voice therapist. Real-time dynamic regional support active."}
          </Text>

          <View style={styles.aiVoiceFooterRow}>
            <Text style={styles.aiVoiceActiveLanguageLabel}>
              {user?.language === 'kn' ? 'ಸಕ್ರಿಯ ಭಾಷೆ:' : user?.language === 'hi' ? 'सक्रिय भाषा:' : 'Active Language:'}
            </Text>
            <TouchableOpacity style={styles.aiVoiceLangBadge} onPress={handleToggleLanguage}>
              <MaterialIcons name="translate" size={14} color="#062100" style={styles.aiVoiceLangBadgeIcon} />
              <Text style={styles.aiVoiceLangBadgeText}>
                {user?.language === 'kn' ? 'ಕನ್ನಡ (ಕನ್ನಡ)' : user?.language === 'hi' ? 'हिंदी (Hindi)' : 'English'}
              </Text>
              <MaterialIcons name="swap-horiz" size={14} color="#062100" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>


        {/* Call History Bento */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Call History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyList}>
            {/* Record 1 */}
            <View style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <View style={styles.historyIconBg}>
                  <MaterialIcons name="waves" size={20} color="#466736" />
                </View>
                <View>
                  <Text style={styles.historyDate}>Yesterday, 4:30 PM</Text>
                  <Text style={styles.historyDuration}>12 min session</Text>
                </View>
              </View>
              <View style={[styles.statusTag, { backgroundColor: '#c7eeb0' }]}>
                <Text style={[styles.statusTagText, { color: '#062100' }]}>Peace</Text>
              </View>
            </View>

            {/* Record 2 */}
            <View style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <View style={styles.historyIconBg}>
                  <MaterialIcons name="chat-bubble" size={20} color="#3E6187" />
                </View>
                <View>
                  <Text style={styles.historyDate}>Oct 24, 11:20 AM</Text>
                  <Text style={styles.historyDuration}>5 min check-in</Text>
                </View>
              </View>
              <View style={[styles.statusTag, { backgroundColor: '#cae7f8' }]}>
                <Text style={[styles.statusTagText, { color: '#001e2b' }]}>Calm</Text>
              </View>
            </View>

            {/* Record 3 */}
            <View style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <View style={styles.historyIconBg}>
                  <MaterialIcons name="call" size={20} color="#375a80" />
                </View>
                <View>
                  <Text style={styles.historyDate}>Oct 22, 6:15 PM</Text>
                  <Text style={styles.historyDuration}>28 min consultation</Text>
                </View>
              </View>
              <View style={[styles.statusTag, { backgroundColor: '#afd2fe' }]}>
                <Text style={[styles.statusTagText, { color: '#001d36' }]}>Relief</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Rows */}
        <View style={styles.settingsSection}>
          <Text style={styles.historyTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            {/* Notifications */}
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <MaterialIcons name="notifications" size={22} color="#73796d" />
                <Text style={styles.settingsItemText}>Notifications</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#73796d" />
            </TouchableOpacity>

            {/* Language Toggle */}
            <TouchableOpacity style={styles.settingsItem} onPress={handleToggleLanguage}>
              <View style={styles.settingsItemLeft}>
                <MaterialIcons name="language" size={22} color="#73796d" />
                <Text style={styles.settingsItemText}>Language</Text>
              </View>
              <View style={styles.languageTextContainer}>
                <Text style={styles.languageText}>{displayLang}</Text>
                <MaterialIcons name="chevron-right" size={20} color="#466736" />
              </View>
            </TouchableOpacity>

            {/* Privacy */}
            <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingsItemLeft}>
                <MaterialIcons name="lock" size={22} color="#73796d" />
                <Text style={styles.settingsItemText}>Privacy</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#73796d" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Soft Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#ba1a1a" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Swasthya Version 2.4.0 (Stable)</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* Analytics */}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/calm-wave-home')}>
          <MaterialIcons name="analytics" size={24} color="#79747E" />
          <Text style={styles.navText}>Analytics</Text>
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

        {/* Profile (Active) */}
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => {}}>
          <MaterialIcons name="person" size={24} color="#062100" />
          <Text style={[styles.navText, styles.navTextActive]}>Profile</Text>
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
  profileHero: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#c7eeb0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#466736',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1c18',
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1e4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginTop: 8,
  },
  badgeIcon: {
    marginRight: 6,
  },
  idText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#001d36',
  },
  supportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(195, 200, 187, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: '#e8e9e2',
  },
  supportLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#73796d',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  supportName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1c18',
    marginTop: 2,
  },
  supportCallButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#466736',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#466736',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  aiVoiceCard: {
    backgroundColor: '#eeeee7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 200, 187, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  aiVoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiVoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiVoiceAvatarBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#c7eeb0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  aiVoiceHeaderContainer: {
    flexDirection: 'column',
  },
  aiVoiceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#466736',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  aiVoiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1c18',
    marginTop: 1,
  },
  aiVoiceCallButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#466736',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#466736',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  aiVoiceDesc: {
    fontSize: 12.5,
    color: '#43483e',
    lineHeight: 18,
    marginHorizontal: 2,
    marginBottom: 12,
  },
  aiVoiceFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 200, 187, 0.25)',
    paddingTop: 10,
    marginTop: 2,
  },
  aiVoiceActiveLanguageLabel: {
    fontSize: 12,
    color: '#73796d',
    fontWeight: '500',
    marginRight: 8,
  },
  aiVoiceLangBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c7eeb0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiVoiceLangBadgeIcon: {
    marginRight: 4,
  },
  aiVoiceLangBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#062100',
  },
  historySection: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#73796d',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#466736',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eeeee7',
    padding: 14,
    borderRadius: 16,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconBg: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1c18',
  },
  historyDuration: {
    fontSize: 11,
    color: '#73796d',
    marginTop: 1,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(195, 200, 187, 0.2)',
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 200, 187, 0.2)',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1c18',
  },
  languageTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#466736',
    fontWeight: '500',
    marginRight: 4,
  },
  logoutContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(186, 26, 26, 0.3)',
    borderRadius: 12,
    backgroundColor: 'transparent',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  versionText: {
    fontSize: 11,
    color: 'rgba(115, 121, 109, 0.6)',
    marginTop: 16,
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
