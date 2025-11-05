// ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              setSettingsModalVisible(false);
              router.replace('/sign-in');
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be reversed.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await user?.delete();
              setSettingsModalVisible(false);
              router.replace('/sign-in');
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsModalVisible(true)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Picture */}
          <View style={styles.profileImageContainer}>
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {user?.username?.charAt(0).toUpperCase() || user?.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfoSection}>
            <Text style={styles.userName}>
              {user?.username || 'User'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.emailAddresses[0]?.emailAddress || 'No email'}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>👤</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue}>
                {user?.username || 'Not set'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>📧</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>
                {user?.emailAddresses[0]?.emailAddress || 'Not set'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>📅</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Member Since</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>🆔</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>User ID</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {user?.id || 'Not available'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSettingsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Edit Profile Option */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSettingsModalVisible(false);
                  Alert.alert('Edit Profile', 'Edit profile feature coming soon!');
                }}
              >
                <View style={styles.modalOptionIcon}>
                  <Text style={styles.modalOptionIconText}>✏️</Text>
                </View>
                <Text style={styles.modalOptionText}>Edit Profile</Text>
              </TouchableOpacity>

              {/* Change Password Option */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSettingsModalVisible(false);
                  Alert.alert('Change Password', 'Change password feature coming soon!');
                }}
              >
                <View style={styles.modalOptionIcon}>
                  <Text style={styles.modalOptionIconText}>🔒</Text>
                </View>
                <Text style={styles.modalOptionText}>Change Password</Text>
              </TouchableOpacity>

              {/* Privacy Settings Option */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSettingsModalVisible(false);
                  Alert.alert('Privacy Settings', 'Privacy settings feature coming soon!');
                }}
              >
                <View style={styles.modalOptionIcon}>
                  <Text style={styles.modalOptionIconText}>🔐</Text>
                </View>
                <Text style={styles.modalOptionText}>Privacy Settings</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.modalDivider} />

              {/* Sign Out Option */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleSignOut}
              >
                <View style={[styles.modalOptionIcon, styles.modalOptionIconWarning]}>
                  <Text style={styles.modalOptionIconText}>🚪</Text>
                </View>
                <Text style={[styles.modalOptionText, styles.modalOptionTextWarning]}>
                  Sign Out
                </Text>
              </TouchableOpacity>

              {/* Delete Account Option */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleDeleteAccount}
              >
                <View style={[styles.modalOptionIcon, styles.modalOptionIconDanger]}>
                  <Text style={styles.modalOptionIconText}>🗑️</Text>
                </View>
                <Text style={[styles.modalOptionText, styles.modalOptionTextDanger]}>
                  Delete Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#065f46',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsIcon: {
    fontSize: 24,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#10b981',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#d1fae5',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfoSection: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailIcon: {
    fontSize: 20,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  modalBody: {
    padding: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionIconWarning: {
    backgroundColor: '#fef3c7',
  },
  modalOptionIconDanger: {
    backgroundColor: '#fee2e2',
  },
  modalOptionIconText: {
    fontSize: 20,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  modalOptionTextWarning: {
    color: '#d97706',
  },
  modalOptionTextDanger: {
    color: '#dc2626',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
});