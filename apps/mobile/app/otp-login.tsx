import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { api } from '../utils/api';
import { storeUser, getUser } from '../utils/store';
import { MaterialIcons } from '@expo/vector-icons';

// Completes the OAuth tracking redirect loops on the browser safely
WebBrowser.maybeCompleteAuthSession();

export default function OTPLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Real Phone Number Input State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  
  // Two-Step Ingestion State Machine: Step 1 (Authentication) -> Step 2 (Google Fit Synchronization)
  const [step, setStep] = useState<1 | 2>(1);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Initialize the Google Auth Request configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '864063917722-rc83fjkmopqv1mhlakih6716pn7jqreg.apps.googleusercontent.com',
    webClientId: '864063917722-rc83fjkmopqv1mhlakih6716pn7jqreg.apps.googleusercontent.com',
    androidClientId: '864063917722-rc83fjkmopqv1mhlakih6716pn7jqreg.apps.googleusercontent.com',
    iosClientId: '864063917722-rc83fjkmopqv1mhlakih6716pn7jqreg.apps.googleusercontent.com',
    scopes: [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read'
    ],
  });

  // Watch for the OAuth callback response redirection token
  useEffect(() => {
    if (response) {
      if (response.type === 'success' && response.authentication?.accessToken) {
        const accessToken = response.authentication.accessToken;
        setGoogleToken(accessToken);
        setSyncError(null);
        if (step === 1) {
          handleGoogleLogin(accessToken);
        } else {
          handleSyncHealthData(accessToken);
        }
      } else {
        setLoading(false);
        if (response.type === 'error') {
          setSyncError('Google authentication failed. Please try again.');
        } else if (response.type === 'cancel') {
          setSyncError('Authentication was cancelled.');
        }
      }
    }
  }, [response]);

  // Phone validation check
  const validatePhone = (num: string) => {
    const cleaned = num.replace(/[\s-]/g, '');
    if (!cleaned) {
      setSyncError('Please enter your mobile phone number.');
      return false;
    }
    if (cleaned.length < 10) {
      setSyncError('Please enter a valid mobile number (at least 10 digits).');
      return false;
    }
    return true;
  };

  // Handle Google authentication & Backend Registration (Step 1)
  const handleGoogleLogin = async (token: string) => {
    setLoading(true);
    setSyncError(null);
    try {
      // Register or fetch user profile from MongoDB using the real paired phone number
      const phoneToUse = targetPhone || phoneNumber.trim().replace(/[\s-]/g, '');
      const backendRes = await api.post('/users', {
        phoneNumber: phoneToUse,
        firebaseUid: `google_fit_${Date.now()}`,
        email: `fit_${Date.now()}@swasthya.local`
      });

      if (backendRes.data.success) {
        const uId = backendRes.data.user._id;
        await storeUser(uId);
        setTempUserId(uId);
        setStep(2); // Transition cleanly to Step 2!
      } else {
        setSyncError('Failed to create backend user session.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setSyncError(err?.response?.data?.error || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async () => {
    let formattedPhone = phoneNumber.trim().replace(/[\s-]/g, '');
    if (!validatePhone(formattedPhone)) {
      return;
    }
    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
      formattedPhone = `+91${formattedPhone}`;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    setLoading(true);
    setSyncError(null);
    try {
      const backendRes = await api.post('/users', {
        phoneNumber: formattedPhone,
        firebaseUid: `mock_fit_${Date.now()}`,
        email: `mock_${Date.now()}@swasthya.local`
      });

      if (backendRes.data.success) {
        const uId = backendRes.data.user._id;
        await storeUser(uId);
        setSyncSuccess(true);
        setTimeout(() => {
          router.replace('/calm-wave-home');
        }, 1200);
      } else {
        setSyncError('Failed to create mock user session.');
      }
    } catch (err: any) {
      console.error('Mock login error:', err);
      setSyncError(err?.response?.data?.error || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Request & Sync live health indicators strictly from Google Fit (Step 2)
  const handleSyncHealthData = async (token: string) => {
    setLoading(true);
    setSyncError(null);
    
    // Initialize strictly at zero (no dummy placeholder counts)
    let steps = 0;
    let activeMins = 0;
    let sleepHours = 0;
    let sleepMins = 0;
    let heartRate = 0;

    try {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const res = await fetch(
        'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [
              { dataTypeName: 'com.google.step_count.delta' },
              { dataTypeName: 'com.google.calories.expended' }
            ],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: oneWeekAgo,
            endTimeMillis: now,
          }),
        }
      );

      const dataset = await res.json();
      
      // If Google returns an API error response, bubble it up directly to the user
      if (dataset.error) {
        throw new Error(dataset.error.message || 'Google Fit API returned an error.');
      }

      if (dataset && dataset.bucket) {
        let totalSteps = 0;
        let totalCalories = 0;
        let daysCount = 0;

        for (const bucket of dataset.bucket) {
          if (bucket.dataset) {
            daysCount++;
            for (const ds of bucket.dataset) {
              if (ds.dataTypeName === 'com.google.step_count.delta' && ds.point) {
                for (const p of ds.point) {
                  if (p.value && p.value[0]) {
                    totalSteps += p.value[0].intVal || 0;
                  }
                }
              }
              if (ds.dataTypeName === 'com.google.calories.expended' && ds.point) {
                for (const p of ds.point) {
                  if (p.value && p.value[0]) {
                    totalCalories += p.value[0].fpVal || 0;
                  }
                }
              }
            }
          }
        }

        const activeDays = daysCount || 7;
        if (totalSteps > 0) {
          steps = Math.round(totalSteps / activeDays);
        }
        if (totalCalories > 0) {
          // Standard physical mapping: ~100 active calories = 5 active minutes
          activeMins = Math.round((totalCalories / activeDays) * 0.05);
        }
      }

      // Sync strict metrics to backend MongoDB User profile
      const targetUserId = tempUserId || (await getUser());
      if (targetUserId) {
        await api.post('/users/sync-fit', {
          userId: targetUserId,
          steps,
          activeMins,
          sleepHours,
          sleepMins,
          heartRate
        });
      }

      setSyncSuccess(true);
      setLoading(false);

      // Transition forward to home dashboard
      setTimeout(() => {
        router.replace('/calm-wave-home');
      }, 1500);

    } catch (err: any) {
      console.error('Error syncing fitness datasets:', err);
      setSyncError(err?.message || 'Failed to query Google Fit REST aggregates.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <MaterialIcons name="spa" size={48} color="#466736" style={styles.logoIcon} />
        <Text style={styles.title}>SWASTHYA</Text>
        <Text style={styles.subtitle}>Ecosystem Secure Gateway</Text>
        
        {step === 1 ? (
          <>
            <Text style={styles.description}>
              Pair your mobile phone number to coordinate incoming voice signals and behavioral distress tracking.
            </Text>

            {/* Styled Real Phone Number Input Box */}
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color="#466736" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Mobile Number (e.g. +919876543210)"
                placeholderTextColor="#73796d"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#466736" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.authButton} 
                  onPress={async () => {
                    // Phone Number Validation before Google Login
                    let formattedPhone = phoneNumber.trim().replace(/[\s-]/g, '');
                    if (!validatePhone(formattedPhone)) {
                      return;
                    }
                    // Auto-format standard 10 digit entries
                    if (formattedPhone.length === 10 && !formattedPhone.startsWith('+')) {
                      formattedPhone = `+91${formattedPhone}`;
                    } else if (!formattedPhone.startsWith('+')) {
                      formattedPhone = `+${formattedPhone}`;
                    }
                    
                    setTargetPhone(formattedPhone);
                    setLoading(true);
                    setSyncError(null);
                    
                    try {
                      if (request) {
                        const res = await promptAsync();
                        if (res?.type !== 'success') {
                          setLoading(false);
                          if (res?.type === 'cancel') {
                            setSyncError('Authentication cancelled.');
                          }
                        }
                      } else {
                        setSyncError('Google authentication provider is initializing. Please wait...');
                        setLoading(false);
                      }
                    } catch (err) {
                      console.warn('Auth error:', err);
                      setSyncError('Google Sign-in failed to open.');
                      setLoading(false);
                    }
                  }}
                >
                  <Text style={styles.btnText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Elegant Dev Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Quick Developer Bypass Button */}
                <TouchableOpacity 
                  style={styles.bypassButton} 
                  onPress={handleMockLogin}
                >
                  <MaterialIcons name="developer-mode" size={18} color="#466736" style={{ marginRight: 6 }} />
                  <Text style={styles.bypassBtnText}>Quick Developer Login</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.description}>
              Identity verified! Now, synchronize your physical health indicators (steps, activity, sleep) to configure your somatic fatigue tracking.
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#466736" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={styles.authButton} 
                  onPress={async () => {
                    if (googleToken) {
                      await handleSyncHealthData(googleToken);
                    } else {
                      setSyncError('Google credentials expired. Please log in again.');
                      setStep(1);
                    }
                  }}
                >
                  <Text style={styles.btnText}>Sync Live Google Fit Data</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {syncError && (
          <View style={styles.errorToast}>
            <Text style={styles.errorToastText}>❌ {syncError}</Text>
          </View>
        )}

        {syncSuccess && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✅ Data Channels Configured. Opening Home...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195, 200, 187, 0.3)',
    shadowColor: '#466736',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  logoIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#466736',
    letterSpacing: 2,
    fontFamily: 'Plus Jakarta Sans',
  },
  subtitle: {
    fontSize: 12,
    color: '#73796d',
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Plus Jakarta Sans',
  },
  description: {
    color: '#43483e',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: 'Plus Jakarta Sans',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 200, 187, 0.5)',
    paddingHorizontal: 12,
    height: 52,
    width: '100%',
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#1a1c18',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  authButton: {
    backgroundColor: '#466736',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#466736',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  btnText: {
    color: '#fafaf3',
    fontWeight: '700',
    fontSize: 15,
  },
  toast: {
    marginTop: 20,
    backgroundColor: '#c7eeb0',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  toastText: {
    color: '#062100',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorToast: {
    marginTop: 20,
    backgroundColor: '#FDE8E8',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  errorToastText: {
    color: '#9B1C1C',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(195, 200, 187, 0.4)',
  },
  dividerText: {
    color: '#73796d',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  bypassButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#466736',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#466736',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bypassBtnText: {
    color: '#466736',
    fontWeight: '700',
    fontSize: 14.5,
  },
});