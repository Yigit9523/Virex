import { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Text, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const startVideoCall = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/video/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        navigation.navigate('Video', {
          roomId: data.data.roomId,
          userId: user.id,
        });
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      Alert.alert('Error', 'Failed to start video call');
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const newMessages = [
        ...messages,
        {
          id: Date.now().toString(),
          text: newMessage.trim(),
          timestamp: new Date(),
          sender: currentUser,
          avatar: `https://i.pravatar.cc/150?u=${currentUser}`,
        }
      ];
      setMessages(newMessages);
      saveMessages(newMessages);
      setNewMessage('');
      setIsTyping(false);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Simulate response after 2 seconds
      setTimeout(() => {
        const responseMessages = [
          ...newMessages,
          {
            id: Date.now().toString() + '1',
            text: 'Thanks for your message! 👋',
            timestamp: new Date(),
            sender: 'bot@example.com',
            avatar: 'https://i.pravatar.cc/150?u=bot',
          }
        ];
        setMessages(responseMessages);
        saveMessages(responseMessages);
      }, 2000);
    }
  };

  const renderMessage = ({ item }) => {
    const isSentMessage = item.sender === currentUser;
    return (
      <Animatable.View 
        animation="fadeIn"
        duration={500}
        style={[
          styles.messageContainer,
          isSentMessage ? styles.sentMessage : styles.receivedMessage
        ]}
      >
        {!isSentMessage && (
          <Image 
            source={{ uri: item.avatar }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.messageContent,
          isSentMessage ? styles.sentMessageContent : styles.receivedMessageContent
        ]}>
          <Text style={[
            styles.messageText,
            isSentMessage ? styles.sentMessageText : styles.receivedMessageText
          ]}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </Animatable.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      {messages.length === 0 && (
        <View style={styles.emptyState}>
          <AntDesign name="message1" size={50} color="#ccc" />
          <Text style={styles.emptyStateText}>No messages yet</Text>
          <Text style={styles.emptyStateSubtext}>Start a conversation!</Text>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.videoCallButton}
          onPress={startVideoCall}
        >
          <MaterialIcons name="video-call" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={(text) => {
            setNewMessage(text);
            setIsTyping(text.length > 0);
          }}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <AntDesign 
            name="arrowup" 
            size={24} 
            color={newMessage.trim() ? '#fff' : '#999'}
          />
        </TouchableOpacity>
      </View>
      {isTyping && (
        <Animatable.View 
          animation="fadeIn"
          style={styles.typingIndicator}
        >
          <Text style={styles.typingText}>Typing...</Text>
        </Animatable.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 15,
    paddingBottom: 30,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    maxWidth: '85%',
  },
  messageContent: {
    padding: 12,
    borderRadius: 20,
    maxWidth: '100%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  sentMessageContent: {
    backgroundColor: '#007AFF',
    borderTopRightRadius: 4,
  },
  receivedMessageContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  sentMessageText: {
    color: '#fff',
  },
  receivedMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    alignSelf: 'flex-end',
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  typingIndicator: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  typingText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});
