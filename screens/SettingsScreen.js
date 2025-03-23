import { StyleSheet, View, Text, TouchableOpacity, Alert, Switch, Image } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

export default function SettingsScreen({ navigation }) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'messages']);
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const clearMessages = async () => {
    Alert.alert(
      'Clear Messages',
      'Are you sure you want to delete all messages?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('messages');
              Alert.alert('Success', 'All messages have been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear messages');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Animatable.View 
        animation="fadeInDown"
        duration={1000}
        style={styles.header}
      >
        <Image
          source={{ uri: `https://i.pravatar.cc/150?u=${currentUser}` }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{currentUser}</Text>
          <Text style={styles.userStatus}>Online</Text>
        </View>
      </Animatable.View>

      <Animatable.View 
        animation="fadeInUp"
        duration={1000}
        delay={300}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <AntDesign name="eye" size={20} color="#666" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <AntDesign name="bells" size={20} color="#666" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chat</Text>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={clearMessages}
          >
            <View style={styles.settingInfo}>
              <AntDesign name="delete" size={20} color="#FF3B30" />
              <Text style={[styles.settingText, styles.dangerText]}>Clear All Messages</Text>
            </View>
            <AntDesign name="right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.settingItem, styles.logoutButton]} 
            onPress={handleLogout}
          >
            <View style={styles.settingInfo}>
              <AntDesign name="logout" size={20} color="#FF3B30" />
              <Text style={[styles.settingText, styles.dangerText]}>Logout</Text>
            </View>
            <AntDesign name="right" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userStatus: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  dangerText: {
    color: '#FF3B30',
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
});
