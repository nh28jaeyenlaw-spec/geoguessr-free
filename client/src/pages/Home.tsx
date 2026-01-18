import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Compass, Globe, MapPin, Trophy } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-globe.jpg"
            alt="World Map"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Compass className="w-12 h-12 text-blue-700" />
              <h1 className="text-5xl md:text-6xl font-bold text-blue-900">GeoGuessr</h1>
            </div>
            <p className="text-xl md:text-2xl text-slate-700 mb-8">
              Test your geography knowledge by guessing locations from Street View images
            </p>
            <Button
              onClick={() => navigate('/game')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all hover:shadow-lg"
            >
              Start Playing
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">How It Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="p-8 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-lg mb-6">
              <Globe className="w-8 h-8 text-blue-700" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Explore Locations</h3>
            <p className="text-slate-600">
              View Street View images from random locations around the world. Examine clues like signs, architecture, and landscapes.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="p-8 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-lg mb-6">
              <MapPin className="w-8 h-8 text-emerald-700" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Make Your Guess</h3>
            <p className="text-slate-600">
              Click on the map to place your guess. The interactive map lets you pinpoint exactly where you think the location is.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="p-8 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-14 h-14 bg-amber-100 rounded-lg mb-6">
              <Trophy className="w-8 h-8 text-amber-700" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Earn Points</h3>
            <p className="text-slate-600">
              The closer your guess, the more points you earn. Play 5 rounds and see your final score. Can you get a perfect game?
            </p>
          </Card>
        </div>
      </section>

      {/* Scoring Section */}
      <section className="bg-white py-16 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">Scoring System</h2>

          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700 font-medium">Perfect Guess (Less than 1 km)</span>
                <span className="text-green-600 font-bold text-lg">5,000 pts</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700 font-medium">Very Close (1-10 km)</span>
                <span className="text-green-600 font-bold text-lg">4,500 pts</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700 font-medium">Close (10-50 km)</span>
                <span className="text-green-600 font-bold text-lg">4,000 pts</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700 font-medium">Nearby (50-100 km)</span>
                <span className="text-green-600 font-bold text-lg">3,500 pts</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700 font-medium">Far Away (100+ km)</span>
                <span className="text-green-600 font-bold text-lg">Decreasing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Challenge Yourself?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Test your geography skills and see how well you know the world. Play now and compete with others!
          </p>
          <Button
            onClick={() => navigate('/game')}
            className="bg-white text-blue-700 hover:bg-slate-100 font-bold py-4 px-8 rounded-lg text-lg transition-all hover:shadow-lg"
          >
            Start Playing Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            GeoGuessr &copy; 2024. Powered by Google Maps and Street View API.
          </p>
        </div>
      </footer>
    </div>
  );
}
