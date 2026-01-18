import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Compass, RotateCcw, ChevronLeft } from 'lucide-react';
import { MapView } from '@/components/Map';
import { useLocation } from 'wouter';

interface GameState {
  round: number;
  score: number;
  totalDistance: number;
  currentLocation: { lat: number; lng: number } | null;
  guessLocation: { lat: number; lng: number } | null;
  isGuessing: boolean;
  roundComplete: boolean;
  distance: number | null;
  points: number | null;
  locationName: string;
}

// Random locations around the world for Street View
const LOCATIONS = [
  { lat: 51.5074, lng: -0.1278, name: 'London, UK' },
  { lat: 48.8566, lng: 2.3522, name: 'Paris, France' },
  { lat: 35.6762, lng: 139.6503, name: 'Tokyo, Japan' },
  { lat: -33.8688, lng: 151.2093, name: 'Sydney, Australia' },
  { lat: 40.7128, lng: -74.0060, name: 'New York, USA' },
  { lat: 37.7749, lng: -122.4194, name: 'San Francisco, USA' },
  { lat: 52.5200, lng: 13.4050, name: 'Berlin, Germany' },
  { lat: 41.9028, lng: 12.4964, name: 'Rome, Italy' },
  { lat: 39.9526, lng: 116.4074, name: 'Beijing, China' },
  { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
  { lat: 55.7558, lng: 37.6173, name: 'Moscow, Russia' },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, USA' },
  { lat: 43.2965, lng: 5.3698, name: 'Marseille, France' },
  { lat: 50.1109, lng: 14.4094, name: 'Prague, Czech Republic' },
  { lat: 59.3293, lng: 18.0686, name: 'Stockholm, Sweden' },
  { lat: 48.2082, lng: 16.3738, name: 'Vienna, Austria' },
  { lat: 52.2297, lng: 21.0122, name: 'Warsaw, Poland' },
  { lat: 47.4979, lng: 19.0402, name: 'Budapest, Hungary' },
  { lat: 38.7223, lng: -9.1393, name: 'Lisbon, Portugal' },
  { lat: 40.4168, lng: -3.7038, name: 'Madrid, Spain' },
  { lat: 45.5017, lng: -122.6750, name: 'Portland, USA' },
  { lat: 47.6062, lng: -122.3321, name: 'Seattle, USA' },
  { lat: 39.7392, lng: -104.9903, name: 'Denver, USA' },
  { lat: 41.8781, lng: -87.6298, name: 'Chicago, USA' },
  { lat: 25.7617, lng: -80.1918, name: 'Miami, USA' },
];

const MAX_POINTS_PER_ROUND = 5000;
const MAX_TOTAL_SCORE = 25000; // 5 rounds × 5000 points

export default function Game() {
  const [, navigate] = useLocation();
  const [gameState, setGameState] = useState<GameState>({
    round: 1,
    score: 0,
    totalDistance: 0,
    currentLocation: null,
    guessLocation: null,
    isGuessing: true,
    roundComplete: false,
    distance: null,
    points: null,
    locationName: '',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const guessMarkerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const streetViewContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize game with random location
  useEffect(() => {
    selectRandomLocation();
  }, []);

  // Initialize Street View when location changes
  useEffect(() => {
    if (gameState.currentLocation && streetViewContainerRef.current && window.google) {
      initializeStreetView(gameState.currentLocation);
    }
  }, [gameState.currentLocation]);

  const selectRandomLocation = () => {
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

    setGameState((prev) => ({
      ...prev,
      currentLocation: { lat: location.lat, lng: location.lng },
      guessLocation: null,
      isGuessing: true,
      roundComplete: false,
      distance: null,
      points: null,
      locationName: location.name,
    }));
  };

  const initializeStreetView = (location: { lat: number; lng: number }) => {
    if (!streetViewContainerRef.current || !window.google) return;

    const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
      position: location,
      pov: {
        heading: Math.floor(Math.random() * 360),
        pitch: Math.floor(Math.random() * 60) - 30,
      },
      zoom: 1,
      panControl: false,
      zoomControl: true,
      addressControl: false,
      fullscreenControl: false,
      linksControl: false,
    };

    if (streetViewRef.current) {
      streetViewRef.current.setPano('');
    }

    streetViewRef.current = new google.maps.StreetViewPanorama(
      streetViewContainerRef.current,
      streetViewOptions
    );
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;

    // Add click listener to map for guessing
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (gameState.isGuessing && e.latLng) {
        const guessLat = e.latLng.lat();
        const guessLng = e.latLng.lng();

        setGameState((prev) => ({
          ...prev,
          guessLocation: { lat: guessLat, lng: guessLng },
        }));

        // Update guess marker
        if (guessMarkerRef.current) {
          guessMarkerRef.current.setPosition(e.latLng);
        } else {
          guessMarkerRef.current = new google.maps.Marker({
            position: e.latLng,
            map,
            title: 'Your Guess',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          });
        }
      }
    });

    // Set initial map center
    if (gameState.currentLocation) {
      map.setCenter(gameState.currentLocation);
      map.setZoom(4);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculatePoints = (distance: number): number => {
    if (distance < 1) return MAX_POINTS_PER_ROUND;
    if (distance < 10) return 4500;
    if (distance < 50) return 4000;
    if (distance < 100) return 3500;
    if (distance < 500) return 3000;
    if (distance < 1000) return 2500;
    if (distance < 2500) return 2000;
    if (distance < 5000) return 1500;
    return Math.max(0, MAX_POINTS_PER_ROUND - Math.floor(distance / 2));
  };

  const handleSubmitGuess = () => {
    if (!gameState.guessLocation || !gameState.currentLocation) return;

    const distance = calculateDistance(
      gameState.currentLocation.lat,
      gameState.currentLocation.lng,
      gameState.guessLocation.lat,
      gameState.guessLocation.lng
    );

    const points = calculatePoints(distance);

    setGameState((prev) => ({
      ...prev,
      distance,
      points,
      score: prev.score + points,
      totalDistance: prev.totalDistance + distance,
      isGuessing: false,
      roundComplete: true,
    }));

    // Draw polyline between guess and actual location
    if (mapRef.current && markerRef.current === null) {
      markerRef.current = new google.maps.Marker({
        position: gameState.currentLocation,
        map: mapRef.current,
        title: 'Actual Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      });

      polylineRef.current = new google.maps.Polyline({
        path: [gameState.guessLocation, gameState.currentLocation],
        geodesic: true,
        strokeColor: '#ef4444',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        map: mapRef.current,
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(gameState.guessLocation);
      bounds.extend(gameState.currentLocation);
      mapRef.current.fitBounds(bounds);
    }
  };

  const handleNextRound = () => {
    // Clear markers and polyline
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    if (guessMarkerRef.current) {
      guessMarkerRef.current.setMap(null);
      guessMarkerRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (mapRef.current) {
      mapRef.current.setCenter({ lat: 20, lng: 0 });
      mapRef.current.setZoom(2);
    }

    setGameState((prev) => ({
      ...prev,
      round: prev.round + 1,
    }));

    selectRandomLocation();
  };

  const handleResetGame = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    if (guessMarkerRef.current) {
      guessMarkerRef.current.setMap(null);
      guessMarkerRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (mapRef.current) {
      mapRef.current.setCenter({ lat: 20, lng: 0 });
      mapRef.current.setZoom(2);
    }

    setGameState({
      round: 1,
      score: 0,
      totalDistance: 0,
      currentLocation: null,
      guessLocation: null,
      isGuessing: true,
      roundComplete: false,
      distance: null,
      points: null,
      locationName: '',
    });

    selectRandomLocation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <Compass className="w-8 h-8 text-blue-700" />
            <h1 className="text-3xl font-bold text-blue-900">GeoGuessr</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">Round</p>
              <p className="text-2xl font-bold text-blue-700">{gameState.round}/5</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">Score</p>
              <p className="text-2xl font-bold text-green-600">
                {gameState.score.toLocaleString()} / {MAX_TOTAL_SCORE.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="container mx-auto px-4 py-6 h-[calc(100vh-120px)]">
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Left Side - Street View */}
          <div className="flex flex-col">
            <Card className="overflow-hidden shadow-lg flex-1">
              <div
                ref={streetViewContainerRef}
                className="w-full h-full bg-slate-900"
              />
            </Card>
          </div>

          {/* Right Side - Map and Controls */}
          <div className="flex flex-col gap-4">
            {/* Map Section */}
            <Card className="overflow-hidden shadow-lg flex-1">
              <MapView
                onMapReady={handleMapReady}
                initialCenter={{ lat: 20, lng: 0 }}
                initialZoom={2}
                disableStreetView={true}
                className="h-full"
              />
            </Card>

            {/* Controls Section */}
            <Card className="p-4 bg-white shadow-md">
              <div className="space-y-3">
                {gameState.isGuessing && !gameState.guessLocation && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      Click on the map to make your guess
                    </p>
                  </div>
                )}

                {gameState.isGuessing && gameState.guessLocation && (
                  <Button
                    onClick={handleSubmitGuess}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Submit Guess
                  </Button>
                )}

                {gameState.roundComplete && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-slate-600">Location</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {gameState.locationName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Distance</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {gameState.distance?.toFixed(0)} km
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Points</p>
                          <p className="text-sm font-semibold text-green-600">
                            +{gameState.points?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {gameState.round < 5 && (
                      <Button
                        onClick={handleNextRound}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors"
                      >
                        Next Round
                      </Button>
                    )}

                    {gameState.round === 5 && (
                      <Button
                        onClick={handleResetGame}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Play Again
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
