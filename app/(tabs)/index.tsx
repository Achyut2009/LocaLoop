// DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
}

const categories = [
  { id: 'all', name: 'All', icon: 'grid' },
  { id: 'restaurant', name: 'Restaurants', icon: 'restaurant' },
  { id: 'cafe', name: 'Cafés', icon: 'cafe' },
  { id: 'laundry', name: 'Laundries', icon: 'shirt' },
];

export default function DashboardScreen() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Replace with your Google Places API Key
  const GOOGLE_PLACES_API_KEY = 'process.env.GOOGLE_PLACES_API_KEY';

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby places');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
    }
  };

  const searchNearbyPlaces = async () => {
    if (!location) {
      Alert.alert('Location required', 'Please allow location access to search nearby places');
      return;
    }

    setLoading(true);
    try {
      const radius = 5000; // 5km in meters
      let type = '';

      switch (selectedCategory) {
        case 'restaurant':
          type = 'restaurant';
          break;
        case 'cafe':
          type = 'cafe';
          break;
        case 'laundry':
          type = 'laundry';
          break;
        default:
          type = 'restaurant,cafe,laundry';
      }

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        let filteredPlaces = data.results;

        // Filter by search query if provided
        if (searchQuery.trim()) {
          filteredPlaces = filteredPlaces.filter((place: Place) =>
            place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.vicinity.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setPlaces(filteredPlaces.slice(0, 15)); // Limit to 15 places
      } else {
        console.error('Places API error:', data.status);
        Alert.alert('Error', 'Failed to search nearby places. Please check your API key.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search nearby places');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() || selectedCategory !== 'all') {
      searchNearbyPlaces();
    }
  };

  const getPlaceType = (types: string[]) => {
    if (types.includes('laundry')) return 'Laundry';
    if (types.includes('cafe') || types.includes('coffee')) return 'Café';
    if (types.includes('restaurant') || types.includes('food')) return 'Restaurant';
    return 'Other';
  };

  const getPlaceIcon = (types: string[]) => {
    if (types.includes('laundry')) return 'shirt-outline';
    if (types.includes('cafe') || types.includes('coffee')) return 'cafe-outline';
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant-outline';
    return 'location-outline';
  };

  const renderPlaceItem = ({ item }: { item: Place }) => (
    <TouchableOpacity style={styles.placeCard}>
      <View style={styles.placeHeader}>
        <View style={styles.placeIconContainer}>
          <Ionicons name={getPlaceIcon(item.types) as any} size={20} color="#10b981" />
        </View>
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.placeType}>{getPlaceType(item.types)}</Text>
        </View>
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.placeAddress} numberOfLines={2}>{item.vicinity}</Text>
      {item.opening_hours && (
        <View style={[
          styles.statusContainer,
          item.opening_hours.open_now ? styles.statusOpen : styles.statusClosed
        ]}>
          <Text style={styles.statusText}>
            {item.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Welcome Message */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Hello, {user?.username || 'User'}! 
            </Text>
            <Text style={styles.subtitle}>
              Find the best places near you
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Discover Nearby</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                placeholder="Search restaurants, cafés, laundries..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="navigate" size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === item.id && styles.categoryButtonActive,
                ]}
                onPress={() => {
                  setSelectedCategory(item.id);
                  if (location) {
                    searchNearbyPlaces();
                  }
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={selectedCategory === item.id ? '#ffffff' : '#10b981'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item.id && styles.categoryTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Results Section */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {places.length > 0 ? `Found ${places.length} places` : 'Nearby Places'}
            </Text>
            {places.length > 0 && (
              <TouchableOpacity onPress={() => setPlaces([])}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Searching nearby places...</Text>
            </View>
          ) : places.length > 0 ? (
            <View style={styles.placesContainer}>
              {places.map((item) => (
                <View key={item.place_id}>
                  {renderPlaceItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No places found</Text>
              <Text style={styles.emptyText}>
                {location 
                  ? 'Search for restaurants, cafés, or laundries within 5km'
                  : 'Enable location access to find nearby places'
                }
              </Text>
              {!location && (
                <TouchableOpacity 
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                >
                  <Ionicons name="location" size={20} color="#ffffff" />
                  <Text style={styles.locationButtonText}>Enable Location</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40, // Increased top padding
    paddingBottom: 24,
  },
  welcomeContainer: {
    marginTop: 10, // Additional spacing
  },
  welcomeText: {
    fontSize: 32, // Slightly larger
    fontWeight: 'bold',
    color: '#065f46',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 18, // Slightly larger
    color: '#059669',
    marginTop: 8,
    lineHeight: 22,
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16, // More rounded
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16, // More padding
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  categoriesList: {
    paddingHorizontal: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  resultsSection: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    paddingBottom: 24,
    minHeight: 400,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#065f46',
  },
  clearText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  placesContainer: {
    paddingHorizontal: 24,
  },
  placesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  placeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  placeType: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rating: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '700',
    marginLeft: 4,
  },
  placeAddress: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  statusContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusOpen: {
    backgroundColor: '#d1fae5',
  },
  statusClosed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});