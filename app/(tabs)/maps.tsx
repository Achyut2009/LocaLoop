// MapsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';

interface LocationCoords {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

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

export default function MapsScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<'restaurant' | 'cafe'>('restaurant');
  const mapRef = useRef<MapView>(null);

  // Replace with your Google Places API Key
  const GOOGLE_PLACES_API_KEY = 'process.env.GOOGLE_PLACES_API_KEY';

  useEffect(() => {
    (async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLoading(false);
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords: LocationCoords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.05, // Roughly 5km zoom level
          longitudeDelta: 0.05,
        };

        setLocation(coords);
        setLoading(false);

        // Fetch nearby places
        fetchNearbyPlaces(coords.latitude, coords.longitude, selectedType);
      } catch (error) {
        setErrorMsg('Failed to get location');
        setLoading(false);
        console.error('Location error:', error);
      }
    })();
  });

  const fetchNearbyPlaces = async (lat: number, lng: number, type: 'restaurant' | 'cafe') => {
    setLoadingPlaces(true);
    try {
      const radius = 5000; // 5km in meters
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        setPlaces(data.results.slice(0, 20)); // Limit to 20 places
      } else {
        console.error('Places API error:', data.status);
        Alert.alert('Error', 'Failed to fetch nearby places. Please check your API key.');
      }
    } catch (error) {
      console.error('Fetch places error:', error);
      Alert.alert('Error', 'Failed to fetch nearby places');
    } finally {
      setLoadingPlaces(false);
    }
  };

  const handleTypeChange = (type: 'restaurant' | 'cafe') => {
    setSelectedType(type);
    if (location) {
      fetchNearbyPlaces(location.latitude, location.longitude, type);
    }
  };

  const centerOnUserLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: LocationCoords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setLocation(coords);
      mapRef.current?.animateToRegion(coords, 1000);
      fetchNearbyPlaces(coords.latitude, coords.longitude, selectedType);
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location');
    }
  };

  const getMarkerColor = (types: string[]) => {
    if (types.includes('cafe')) return '#f59e0b'; // Amber for cafes
    return '#ef4444'; // Red for restaurants
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg || !location) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📍</Text>
        <Text style={styles.errorTitle}>Location Access Required</Text>
        <Text style={styles.errorText}>
          {errorMsg || 'Unable to access your location'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setErrorMsg(null);
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Nearby Places</Text>
          <Text style={styles.headerSubtitle}>
            {places.length} {selectedType === 'cafe' ? 'cafés' : 'restaurants'} found within 5km
          </Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Explore Categories</Text>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === 'restaurant' && styles.filterButtonActive,
            ]}
            onPress={() => handleTypeChange('restaurant')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedType === 'restaurant' && styles.filterButtonTextActive,
            ]}>
              🍽️ Restaurants
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedType === 'cafe' && styles.filterButtonActive,
            ]}
            onPress={() => handleTypeChange('cafe')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedType === 'cafe' && styles.filterButtonTextActive,
            ]}>
              ☕ Cafés
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapSection}>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={location}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            loadingEnabled={true}
          >
            {/* User location marker */}
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You are here"
              description="Your current location"
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerDot} />
              </View>
            </Marker>

            {/* 5km radius circle */}
            <Circle
              center={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              radius={5000}
              strokeWidth={2}
              strokeColor="rgba(16, 185, 129, 0.5)"
              fillColor="rgba(16, 185, 129, 0.1)"
            />

            {/* Place markers */}
            {places.map((place) => (
              <Marker
                key={place.place_id}
                coordinate={{
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                }}
                pinColor={getMarkerColor(place.types)}
              >
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{place.name}</Text>
                    <Text style={styles.calloutAddress}>{place.vicinity}</Text>
                    {place.rating && (
                      <Text style={styles.calloutRating}>⭐ {place.rating.toFixed(1)}</Text>
                    )}
                    {place.opening_hours && (
                      <Text style={[
                        styles.calloutStatus,
                        place.opening_hours.open_now ? styles.calloutOpen : styles.calloutClosed
                      ]}>
                        {place.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed'}
                      </Text>
                    )}
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* Loading overlay for places */}
          {loadingPlaces && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingOverlayText}>Loading places...</Text>
            </View>
          )}

          {/* Recenter Button */}
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={centerOnUserLocation}
          >
            <Text style={styles.recenterIcon}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Places List */}
      <View style={styles.placesSection}>
        <View style={styles.placesHeader}>
          <Text style={styles.placesListTitle}>
            Nearby {selectedType === 'cafe' ? 'Cafés' : 'Restaurants'}
          </Text>
          <Text style={styles.placesSubtitle}>
            Tap to view map
          </Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.placesList}
          contentContainerStyle={styles.placesListContent}
        >
          {places.map((place) => (
            <TouchableOpacity
              key={place.place_id}
              style={styles.placeCard}
              onPress={() => {
                mapRef.current?.animateToRegion({
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }, 1000);
              }}
            >
              <Text style={styles.placeCardName} numberOfLines={1}>
                {place.name}
              </Text>
              <Text style={styles.placeCardAddress} numberOfLines={2}>
                {place.vicinity}
              </Text>
              <View style={styles.placeCardFooter}>
                {place.rating && (
                  <View style={styles.ratingContainer}>
                    <Text style={styles.placeCardRating}>⭐ {place.rating.toFixed(1)}</Text>
                  </View>
                )}
                {place.opening_hours && (
                  <View style={[
                    styles.placeCardStatus,
                    place.opening_hours.open_now ? styles.placeCardStatusOpen : styles.placeCardStatusClosed
                  ]}>
                    <Text style={styles.placeCardStatusText}>
                      {place.opening_hours.open_now ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 40,
    paddingTop: 60,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerContent: {
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#065f46',
    lineHeight: 38,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#059669',
    marginTop: 8,
    lineHeight: 20,
  },
  filterSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#d1fae5',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterButtonActive: {
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
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065f46',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  mapSection: {
    flex: 1,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: [{ translateX: -70 }],
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingOverlayText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recenterIcon: {
    fontSize: 26,
  },
  calloutContainer: {
    width: 220,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  calloutAddress: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 16,
  },
  calloutRating: {
    fontSize: 13,
    color: '#f59e0b',
    marginBottom: 6,
    fontWeight: '600',
  },
  calloutStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  calloutOpen: {
    color: '#10b981',
  },
  calloutClosed: {
    color: '#ef4444',
  },
  placesSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  placesHeader: {
    marginBottom: 16,
  },
  placesListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 4,
  },
  placesSubtitle: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  placesList: {
    flexDirection: 'row',
  },
  placesListContent: {
    paddingRight: 24,
  },
  placeCard: {
    width: 220,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  placeCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  placeCardAddress: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  placeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  placeCardRating: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '700',
  },
  placeCardStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  placeCardStatusOpen: {
    backgroundColor: '#d1fae5',
  },
  placeCardStatusClosed: {
    backgroundColor: '#fee2e2',
  },
  placeCardStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});