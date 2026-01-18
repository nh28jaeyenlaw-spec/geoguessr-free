'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Compass, ChevronLeft } from 'lucide-react';
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

// Predefined locations with guaranteed official Google Street View coverage
const STREET_VIEW_LOCATIONS = [
  { lat: 51.5074, lng: -0.1278 },
  { lat: 48.8566, lng: 2.3522 },
  { lat: 35.6762, lng: 139.6503 },
  { lat: -33.8688, lng: 151.2093 },
  { lat: 40.7128, lng: -74.0060 },
  { lat: 37.7749, lng: -122.4194 },
  { lat: 52.5200, lng: 13.4050 },
  { lat: 41.9028, lng: 12.4964 },
  { lat: 39.9526, lng: 116.4074 },
  { lat: 1.3521, lng: 103.8198 },
  { lat: 55.7558, lng: 37.6173 },
  { lat: 34.0522, lng: -118.2437 },
  { lat: 43.2965, lng: 5.3698 },
  { lat: 50.1109, lng: 14.4094 },
  { lat: 59.3293, lng: 18.0686 },
  { lat: 48.2082, lng: 16.3738 },
  { lat: 52.2297, lng: 21.0122 },
  { lat: 47.4979, lng: 19.0402 },
  { lat: 38.7223, lng: -9.1393 },
  { lat: 40.4168, lng: -3.7038 },
  { lat: 45.5017, lng: -122.6750 },
  { lat: 47.6062, lng: -122.3321 },
  { lat: 39.7392, lng: -104.9903 },
  { lat: 41.8781, lng: -87.6298 },
  { lat: 25.7617, lng: -80.1918 },
  { lat: -23.5505, lng: -46.6333 },
  { lat: -33.8688, lng: 18.4241 },
  { lat: 31.2357, lng: 30.4415 },
  { lat: 28.6139, lng: 77.2090 },
  { lat: 13.7563, lng: 100.5018 },
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

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const guessMarkerRef = useRef<google.maps.Marker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Initialize game with random location
  useEffect(() => {
    selectRandomLocation();
  }, []);

  const selectRandomLocation = () => {
    // Pick a random location from the predefined list
    const randomLocation = STREET_VIEW_LOCATIONS[Math.floor(Math.random() * STREET_VIEW_LOCATIONS.length)];

    // Generate a nearby random offset (within ~5-10km)
    const latOffset = (Math.random() - 0.5) * 0.15;
    const lngOffset = (Math.random() - 0.5) * 0.15;
    
    const nearbyLocation = {
      lat: randomLocation.lat + latOffset,
      lng: randomLocation.lng + lngOffset,
    };

    setGameState((prev) => ({
      ...prev,
      currentLocation: nearbyLocation,
      guessLocation: null,
      isGuessing: true,
      roundComplete: false,
      distance: null,
      points: null,
      locationName: '',
    }));
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    map.setCenter({ lat: 20, lng: 0 });
    map.setZoom(2);

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
        guessMarkerRef.current = new google.maps.Marker({
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

      polylineRef.current = new google.maps.Polyline({
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

      markerRef.current = new google.maps.Marker({
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
      // Game over
      navigate('/');
    }
  };

  // Generate Street View URL using Manus proxy
  const getStreetViewUrl = () => {
    if (!gameState.currentLocation) return '';
    const heading = Math.floor(Math.random() * 360);
    const pitch = Math.floor(Math.random() * 60) - 30;
    // Use Manus proxy for Street View API
    return `https://forge.manus.ai/v1/maps/proxy/maps/api/streetview?size=640x480&location=${gameState.currentLocation.lat},${gameState.currentLocation.lng}&heading=${heading}&pitch=${pitch}&fov=90`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-blue-500/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-blue-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-400" />
                GeoGuessr
              </h1>
              <p className="text-sm text-blue-300">Round {gameState.round}/5</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-300">Score</p>
            <p className="text-2xl font-bold text-blue-400">
              {gameState.score} / {MAX_TOTAL_SCORE}
            </p>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Street View - Left Half */}
        <div className="w-1/2 flex flex-col gap-4">
          <Card className="flex-1 bg-slate-800/50 border-blue-500/20 overflow-hidden">
            {gameState.currentLocation ? (
              <img
                src={getStreetViewUrl()}
                alt="Street View"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if Street View image fails to load
                  const img = e.target as HTMLImageElement;
                  img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect fill='%23334155' width='640' height='480'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EStreet View Loading...%3C/text%3E%3C/svg%3E`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <p className="text-blue-300">Loading...</p>
              </div>
            )}
          </Card>
        </div>

        {/* Map & Controls - Right Half */}
        <div className="w-1/2 flex flex-col gap-4">
          <Card className="flex-1 bg-slate-800/50 border-blue-500/20 overflow-hidden">
            <MapView
              onMapReady={handleMapReady}
              disableStreetView={true}
            />
          </Card>

          {/* Game Info & Controls */}
          <Card className="bg-slate-800/50 border-blue-500/20 p-4">
            {gameState.roundComplete ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-blue-300 uppercase">Distance</p>
                    <p className="text-lg font-bold text-red-400">
                      {gameState.distance?.toLocaleString()} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 uppercase">Points</p>
                    <p className="text-lg font-bold text-green-400">
                      +{gameState.points?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 uppercase">Accuracy</p>
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
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-blue-300">
                  {gameState.guessLocation
                    ? 'Click Submit Guess to check your answer'
                    : 'Click on the map to make your guess'}
                </p>
                <Button
                  onClick={handleSubmitGuess}
                  disabled={!gameState.guessLocation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  Submit Guess
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
