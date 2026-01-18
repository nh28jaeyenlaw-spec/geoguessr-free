import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Copy, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

type GameMode = '1v1' | '2v2' | 'freeplay';
type ViewMode = 'normal' | 'noMoving' | 'noZoom';

export default function Lobby() {
  const [, navigate] = useLocation();
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>('1v1');
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  const createSessionMutation = trpc.game.createSession.useMutation();
  const getSessionQuery = trpc.game.getSession.useQuery(
    { sessionId: joinCode },
    { enabled: false }
  );
  const joinSessionMutation = trpc.game.joinSession.useMutation();

  const handleCreateSession = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      const result = await createSessionMutation.mutateAsync({
        gameMode,
        viewMode,
      });
      
      toast.success(`Party created! Code: ${result.sessionId}`);
      setCreatedSessionId(result.sessionId);
      setCopiedCode(null);
    } catch (error) {
      toast.error('Failed to create party');
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a party code');
      return;
    }

    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      const session = await getSessionQuery.refetch();
      if (!session.data) {
        toast.error('Party code not found');
        return;
      }

      await joinSessionMutation.mutateAsync({
        sessionId: joinCode,
      });

      toast.success('Joined party!');
      navigate(`/game/${joinCode}`);
    } catch (error) {
      toast.error('Failed to join party');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Party code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-2">GeoGuessr Party</h1>
          <p className="text-xl text-slate-600">Play with friends or strangers - no sign-in required!</p>
        </div>

        {/* Player Name Input */}
        <Card className="p-8 mb-8 shadow-lg bg-blue-50 border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">What's your name?</h2>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
              className="flex-1 p-3 border-2 border-slate-200 rounded-lg"
              autoFocus
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Session */}
          <Card className="p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Create Party</h2>
            </div>

            {/* Game Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Game Mode
              </label>
              <div className="space-y-2">
                {(['1v1', '2v2', 'freeplay'] as GameMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left font-medium ${
                      gameMode === mode
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {mode === '1v1' && '⚔️ 1v1 - Head to Head'}
                    {mode === '2v2' && '👥 2v2 - Team Battle'}
                    {mode === 'freeplay' && '🎮 Freeplay - Solo Challenge'}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                View Mode
              </label>
              <div className="space-y-2">
                {(['normal', 'noMoving', 'noZoom'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left font-medium ${
                      viewMode === mode
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {mode === 'normal' && '👁️ Normal - Full View'}
                    {mode === 'noMoving' && '🚫 No Moving - Static View'}
                    {mode === 'noZoom' && '📍 No Zoom - Fixed Zoom'}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateSession}
              disabled={createSessionMutation.isPending || !playerName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {createSessionMutation.isPending ? 'Creating...' : 'Create Party'}
            </Button>

            {/* Display Created Session Code */}
            {createdSessionId && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-600 mb-2">Your Party Code:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-mono font-bold text-blue-900 bg-white p-3 rounded border border-blue-300">
                    {createdSessionId}
                  </code>
                  <button
                    onClick={() => copyToClipboard(createdSessionId)}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    {copiedCode === createdSessionId ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-2">Share this code with friends to join</p>
                <Button
                  onClick={() => navigate(`/game/${createdSessionId}`)}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg"
                >
                  Start Playing
                </Button>
              </div>
            )}
          </Card>

          {/* Join Session */}
          <Card className="p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-slate-900">Join Party</h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Enter Party Code
              </label>
              <Input
                type="text"
                placeholder="Enter party code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full p-3 border-2 border-slate-200 rounded-lg font-mono text-lg"
              />
            </div>

            <Button
              onClick={handleJoinSession}
              disabled={joinSessionMutation.isPending || !joinCode.trim() || !playerName.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {joinSessionMutation.isPending ? 'Joining...' : 'Join Party'}
            </Button>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-slate-100 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">How to Join</h3>
              <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
                <li>Get a party code from a friend</li>
                <li>Paste it in the box above</li>
                <li>Click "Join Party"</li>
                <li>Start playing together!</li>
              </ol>
            </div>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="px-8 py-2"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
