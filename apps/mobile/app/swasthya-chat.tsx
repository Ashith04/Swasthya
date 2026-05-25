import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getUser } from '../utils/store';
import { api } from '../utils/api';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export default function SwasthyaChat() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: "I'm here for you. How has your day been?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi' | 'kn'>('en');
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    loadChatContext();
  }, []);

  const loadChatContext = async () => {
    try {
      const uId = await getUser();
      if (!uId) return;

      const res = await api.get(`/dashboard/${uId}`);
      if (res.data.success && res.data.data.user) {
        const userLang = res.data.data.user.language || 'en';
        setLang(userLang);

        // Dynamically translate the welcome bubble inside the active message list
        let welcomeText = "I'm here for you. How has your day been?";
        if (userLang === 'kn') {
          welcomeText = "ನಾನು ನಿಮಗಾಗಿ ಇಲ್ಲಿದ್ದೇನೆ. ನಿಮ್ಮ ದಿನ ಹೇಗಿತ್ತು?";
        } else if (userLang === 'hi') {
          welcomeText = "मैं आपके लिए यहाँ हूँ। आपका दिन कैसा रहा?";
        }

        setMessages([
          {
            id: '1',
            sender: 'ai',
            text: welcomeText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat language preferences:', err);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom on load or message list update
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessageText,
      time: timeString
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    try {
      const uId = await getUser();
      
      // Call Gemini backend chat endpoint with chat history mapped to standard format
      const res = await api.post('/chat', {
        userId: uId,
        message: userMessageText,
        history: messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))
      });

      if (res.data.success && res.data.reply) {
        const newAiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: res.data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newAiMsg]);
      }
    } catch (err) {
      console.error('Failed to get reply from Gemini Chat:', err);
      
      let fallbackReply = "I had a small connection issue. Please describe your feelings again.";
      if (lang === 'kn') {
        fallbackReply = "ಸಂಪರ್ಕಿಸುವಲ್ಲಿ ಸ್ವಲ್ಪ ತೊಂದರೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ, ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ.";
      } else if (lang === 'hi') {
        fallbackReply = "कनेक्ट करने में थोड़ी समस्या हुई है। कृपया फिर से कहें, मैं सुन रहा हूँ।";
      }

      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallbackReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newAiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Localization dictionary mapping
  const loc = {
    en: {
      groundingTitle: "Feeling overwhelmed?",
      groundingSubtitle: "It looks like things are moving fast. Let's take a 2-minute pause to ground your thoughts.",
      groundingButton: "Start Calm Exercise",
      placeholder: "Type a message...",
    },
    kn: {
      groundingTitle: "ಖಿನ್ನತೆ ಅನಿಸುತ್ತಿದೆಯೇ?",
      groundingSubtitle: "ಒತ್ತಡದ ಭಾವನೆಗಳಿದ್ದರೆ, ಮನಸ್ಸನ್ನು ಶಾಂತಗೊಳಿಸಲು 2 ನಿಮಿಷಗಳ ವಿರಾಮ ತೆಗೆದುಕೊಳ್ಳೋಣ.",
      groundingButton: "ಧ್ಯಾನ ಅಭ್ಯಾಸ ಆರಂಭಿಸಿ",
      placeholder: "ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    },
    hi: {
      groundingTitle: "तनाव महसूस हो रहा है?",
      groundingSubtitle: "चीजें तेजी से बदल रही हैं। अपने विचारों को शांत करने के लिए 2 मिनट का विश्राम लें।",
      groundingButton: "शांति अभ्यास शुरू करें",
      placeholder: "संदेश टाइप करें...",
    }
  }[lang];

  if (loadingContext) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#466736" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.outerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
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
        ref={scrollViewRef}
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contextual Grounding Card */}
        <View style={styles.groundingCard}>
          <View style={styles.groundingHeader}>
            <View style={styles.psychologyIconContainer}>
              <MaterialIcons name="psychology" size={24} color="#466736" />
            </View>
            <View style={styles.groundingHeaderDetails}>
              <Text style={styles.groundingTitle}>{loc.groundingTitle}</Text>
              <Text style={styles.groundingSubtitle}>{loc.groundingSubtitle}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.calmButton}
            onPress={() => router.push('/breathing-tools')}
          >
            <MaterialIcons name="play-circle-filled" size={20} color="#fafaf3" style={styles.calmBtnIcon} />
            <Text style={styles.calmButtonText}>{loc.groundingButton}</Text>
          </TouchableOpacity>
        </View>

        {/* Message Thread */}
        <View style={styles.threadContainer}>
          {messages.map((message) => {
            const isUser = message.sender === 'user';
            return (
              <View 
                key={message.id} 
                style={[
                  styles.messageRow, 
                  isUser ? styles.messageRowUser : styles.messageRowAi
                ]}
              >
                <View 
                  style={[
                    styles.bubble, 
                    isUser ? styles.bubbleUser : styles.bubbleAi
                  ]}
                >
                  <Text 
                    style={[
                      styles.messageText, 
                      isUser ? styles.messageTextUser : styles.messageTextAi
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
                <Text style={styles.messageTime}>{message.time}</Text>
              </View>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingRow}>
              <View style={styles.typingBubble}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Input Area */}
      <View style={styles.inputAreaWrapper}>
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.inputIconBtn}>
            <MaterialIcons name="add-circle" size={24} color="#466736" />
          </TouchableOpacity>
          
          <TextInput 
            style={styles.textInput}
            placeholder={loc.placeholder}
            placeholderTextColor="#79747E"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          
          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.inputIconBtn}>
              <MaterialIcons name="mic" size={22} color="#79747E" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <MaterialIcons name="send" size={20} color="#fafaf3" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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

        {/* Chat (Active) */}
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => {}}>
          <MaterialIcons name="chat-bubble" size={24} color="#062100" />
          <Text style={[styles.navText, styles.navTextActive]}>Chat</Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <MaterialIcons name="person" size={24} color="#79747E" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 160,
  },
  groundingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 200, 187, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 20,
  },
  groundingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  psychologyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#afd2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groundingHeaderDetails: {
    flex: 1,
  },
  groundingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1c18',
  },
  groundingSubtitle: {
    fontSize: 13,
    color: '#43483e',
    marginTop: 4,
    lineHeight: 18,
  },
  calmButton: {
    backgroundColor: '#466736',
    borderRadius: 99,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
  calmBtnIcon: {
    marginRight: 6,
  },
  calmButtonText: {
    color: '#fafaf3',
    fontWeight: '700',
    fontSize: 13,
  },
  threadContainer: {
    gap: 16,
  },
  messageRow: {
    flexDirection: 'column',
    maxWidth: '80%',
    marginBottom: 4,
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowAi: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#c7eeb0',
    borderTopRightRadius: 2,
  },
  bubbleAi: {
    backgroundColor: '#eeeee7',
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#062100',
  },
  messageTextAi: {
    color: '#1a1c18',
  },
  messageTime: {
    fontSize: 10,
    color: '#73796d',
    marginTop: 4,
    marginHorizontal: 4,
  },
  typingRow: {
    alignSelf: 'flex-start',
  },
  typingBubble: {
    backgroundColor: '#eeeee7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderTopLeftRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(67, 72, 62, 0.4)',
  },
  inputAreaWrapper: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  inputBar: {
    backgroundColor: '#ffffff',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(195, 200, 187, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1c18',
    paddingHorizontal: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputIconBtn: {
    padding: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#466736',
    justifyContent: 'center',
    alignItems: 'center',
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
