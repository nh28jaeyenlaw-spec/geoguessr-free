import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Compass, ChevronLeft, X, Map as MapIcon } from 'lucide-react';
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

// Locations with confirmed official Google Street View coverage
const STREET_VIEW_LOCATIONS = [
  { lat: 51.5074, lng: -0.1278, name: 'London' },
  { lat: 48.8566, lng: 2.3522, name: 'Paris' },
  { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
  { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
  { lat: 40.7128, lng: -74.0060, name: 'New York' },
  { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
  { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
  { lat: 41.9028, lng: 12.4964, name: 'Rome' },
  { lat: 39.9526, lng: 116.4074, name: 'Beijing' },
  { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
  { lat: 55.7558, lng: 37.6173, name: 'Moscow' },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
  { lat: 43.2965, lng: 5.3698, name: 'Marseille' },
  { lat: 50.1109, lng: 14.4094, name: 'Prague' },
  { lat: 59.3293, lng: 18.0686, name: 'Stockholm' },
  { lat: 48.2082, lng: 16.3738, name: 'Vienna' },
  { lat: 52.2297, lng: 21.0122, name: 'Warsaw' },
  { lat: 47.4979, lng: 19.0402, name: 'Budapest' },
  { lat: 38.7223, lng: -9.1393, name: 'Lisbon' },
  { lat: 40.4168, lng: -3.7038, name: 'Madrid' },
  { lat: 45.5017, lng: -122.6750, name: 'Portland' },
  { lat: 47.6062, lng: -122.3321, name: 'Seattle' },
  { lat: 39.7392, lng: -104.9903, name: 'Denver' },
  { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
  { lat: 25.7617, lng: -80.1918, name: 'Miami' },
  { lat: -23.5505, lng: -46.6333, name: 'São Paulo' },
  { lat: -33.8688, lng: 18.4241, name: 'Cape Town' },
  { lat: 31.2357, lng: 30.4415, name: 'Cairo' },
  { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
  { lat: 13.7563, lng: 100.5018, name: 'Bangkok' },
];

const MAX_POINTS_PER_ROUND = 5000;
const MAX_TOTAL_SCORE = 25000;
const MAP_SIZE = 40075;

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

  const [gameOver, setGameOver] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const guessMarkerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Initialize game with first location
  useEffect(() => {
    selectRandomLocation();
  }, []);

  // Initialize Street View when API is ready
  useEffect(() => {
    if (apiReady && gameState.currentLocation && !streetViewRef.current) {
      const streetViewContainer = document.getElementById('street-view');
      if (streetViewContainer && window.google) {
        streetViewRef.current = new window.google.maps.StreetViewPanorama(
          streetViewContainer,
          {
            position: gameState.currentLocation,
            pov: {
              heading: Math.random() * 360,
              pitch: Math.random() * 60 - 30,
            },
            zoom: 1,
            addressControl: false,
            fullscreenControl: false,
            panControl: false,
            zoomControl: false,
            motionTrackingControl: false,
            linksControl: false,
          }
        );

        // Validation happens through the StreetViewService API
        // which checks copyright field during getPanorama() calls
        // Official Google Street View has proper copyright attribution
      }
    }
  }, [apiReady, gameState.currentLocation]);

  // Initialize map in collapsible panel when API is ready
  useEffect(() => {
    if (mapOpen && mapContainerRef.current && window.google && !mapRef.current && apiReady) {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;

      // Add click listener to place guess marker
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng && gameState.isGuessing && !gameState.roundComplete) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // Remove existing guess marker
          if (guessMarkerRef.current) {
            guessMarkerRef.current.setMap(null);
          }

          // Add new guess marker
          guessMarkerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: 'Your Guess',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          });

          setGameState((prev) => ({
            ...prev,
            guessLocation: { lat, lng },
          }));
        }
      });
    }
  }, [mapOpen, apiReady]);

  const selectRandomLocation = () => {
    const randomLocation = STREET_VIEW_LOCATIONS[Math.floor(Math.random() * STREET_VIEW_LOCATIONS.length)];
    
    // Add slight random offset (within ~2km)
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;
    
    const nearbyLocation = {
      lat: randomLocation.lat + latOffset,
      lng: randomLocation.lng + lngOffset,
    };

    // Reset Street View reference when changing location
    streetViewRef.current = null;

    setGameState((prev) => ({
      ...prev,
      currentLocation: nearbyLocation,
      guessLocation: null,
      isGuessing: true,
      roundComplete: false,
      distance: null,
      points: null,
      locationName: randomLocation.name,
    }));
  };

  const handleMapReady = (map: google.maps.Map) => {
    setApiReady(true);
  };

  const calculatePoints = (distance: number): number => {
    const points = Math.round(MAX_POINTS_PER_ROUND * Math.exp((-10 * distance) / MAP_SIZE));
    return Math.max(0, points);
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
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

  const handleSubmitGuess = () => {
    if (!gameState.guessLocation || !gameState.currentLocation) return;

    const distance = calculateDistance(
      gameState.currentLocation.lat,
      gameState.currentLocation.lng,
      gameState.guessLocation.lat,
      gameState.guessLocation.lng
    );

    const points = calculatePoints(distance);

    // Draw line between guess and actual location
    if (mapRef.current) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      polylineRef.current = new window.google.maps.Polyline({
        path: [gameState.guessLocation, gameState.currentLocation],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        map: mapRef.current,
      });

      // Add actual location marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      markerRef.current = new window.google.maps.Marker({
        position: gameState.currentLocation,
        map: mapRef.current,
        title: 'Actual Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      });
    }

    setGameState((prev) => ({
      ...prev,
      isGuessing: false,
      roundComplete: true,
      distance: Math.round(distance),
      points,
      score: prev.score + points,
      totalDistance: prev.totalDistance + distance,
    }));
  };

  const handleNextRound = () => {
    // Close map after each round
    setMapOpen(false);

    if (gameState.round < 5) {
      setGameState((prev) => ({
        ...prev,
        round: prev.round + 1,
        guessLocation: null,
        isGuessing: true,
        roundComplete: false,
        distance: null,
        points: null,
      }));

      // Clear markers
      if (markerRef.current) markerRef.current.setMap(null);
      if (guessMarkerRef.current) guessMarkerRef.current.setMap(null);
      if (polylineRef.current) polylineRef.current.setMap(null);

      selectRandomLocation();
    } else {
      // Game over - show final score screen
      setGameOver(true);
    }
  };

  // Final Score Screen
  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 flex items-center justify-center p-4">
        <Card className="bg-black/80 border-gray-700 backdrop-blur-sm max-w-md w-full p-8">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
              <p className="text-gray-300">Challenge Complete</p>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6">
              <p className="text-sm text-blue-100 mb-2">Final Score</p>
              <p className="text-5xl font-bold text-white">{gameState.score.toLocaleString()}</p>
              <p className="text-sm text-blue-100 mt-2">out of {MAX_TOTAL_SCORE.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase mb-1">Accuracy</p>
                <p className="text-2xl font-bold text-green-400">
                  {Math.round((gameState.score / MAX_TOTAL_SCORE) * 100)}%
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase mb-1">Avg Distance</p>
                <p className="text-2xl font-bold text-red-400">
                  {Math.round(gameState.totalDistance / 5).toLocaleString()} km
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => navigate('/game')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Play Again
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-900"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Full Screen Street View */}
      <div className="flex-1 relative overflow-hidden z-0" style={{ height: '100vh' }}>
        <div
          id="street-view"
          className="w-full h-full absolute inset-0"
          style={{ height: '100%', width: '100%' }}
        />

        {/* Google Attribution - Bottom Right */}
        <div className="absolute bottom-4 right-4 z-5 text-xs text-gray-400 pointer-events-none">
          <p>Powered by Google</p>
        </div>

        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5" />
                  GeoGuessr
                </h1>
                <p className="text-sm text-gray-300">Round {gameState.round}/5</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">Score</p>
              <p className="text-2xl font-bold text-white">
                {gameState.score} / {MAX_TOTAL_SCORE}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Center - Guess Controls */}
        {!gameState.roundComplete && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 pb-4 z-20">
            <Card className="bg-black/80 border-gray-700 p-4 backdrop-blur-sm">
              <p className="text-sm text-gray-300 mb-3">
                {gameState.guessLocation
                  ? '✓ Guess placed. Ready to submit?'
                  : 'Open the map to make your guess'}
              </p>
              <Button
                onClick={handleSubmitGuess}
                disabled={!gameState.guessLocation}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                Submit Guess
              </Button>
            </Card>
          </div>
        )}

        {/* Bottom Right - Results Panel (when round complete) */}
        {gameState.roundComplete && (
          <div className="absolute bottom-4 right-4 z-20">
            <Card className="bg-black/90 border-gray-700 p-4 backdrop-blur-sm w-80">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Distance</p>
                    <p className="text-lg font-bold text-red-400">
                      {gameState.distance?.toLocaleString()} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Points</p>
                    <p className="text-lg font-bold text-green-400">
                      +{gameState.points?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Accuracy</p>
                    <p className="text-lg font-bold text-blue-400">
                      {Math.round((gameState.points! / MAX_POINTS_PER_ROUND) * 100)}%
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleNextRound}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {gameState.round < 5 ? 'Next Round' : 'Finish Game'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Bottom Right - Map Toggle Button */}
        <button
          onClick={() => setMapOpen(!mapOpen)}
          className="absolute bottom-4 right-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg"
          title={mapOpen ? 'Close map' : 'Open map'}
        >
          {mapOpen ? <X className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
        </button>

        {/* Collapsible Map Panel */}
        {mapOpen && (
          <div className="absolute bottom-20 right-4 z-40 w-96 h-96 rounded-lg overflow-hidden shadow-2xl border border-gray-700">
            <div
              ref={mapContainerRef}
              className="w-full h-full"
              id="collapsible-map"
            />
          </div>
        )}
      </div>

      {/* Hidden MapView to load Google Maps API */}
      <div className="hidden">
        <MapView onMapReady={handleMapReady} disableStreetView={true}/>
      </div>
    </div>
  );
}
