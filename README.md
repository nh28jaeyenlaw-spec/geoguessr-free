# GeoGuessr Geography Game

An interactive geography guessing game built with React, TypeScript, and Google Maps API. Players are shown random Street View locations and must guess where they are on a map. Features multiplayer party functionality with shareable codes, multiple game modes, and view restrictions.

## Features

### Core Gameplay
- **5-Round Gameplay**: Complete games with 5 rounds per session
- **Exponential Decay Scoring**: Points based on distance accuracy (formula: `5000 × e^(-10 × distance / map_size)`)
- **Official Google Street View Only**: Strict validation ensures only official Google Street View imagery is used (no user-submitted content)
- **Mobile-Optimized**: Responsive design with touch-friendly controls and safe area padding for notches
- **Auto-Opening Map**: Map panel automatically opens after each guess to show results and distance

### Multiplayer Features
- **No Authentication Required**: Players enter their name directly without sign-up
- **Party System**: Shareable party codes for easy multiplayer joining
- **Game Modes**:
  - **1v1**: One-on-one competitive gameplay
  - **2v2**: Team-based gameplay with two players per team
  - **Freeplay**: Casual gameplay without competitive scoring
- **View Restrictions**:
  - **Normal**: Full Street View controls (pan, zoom, rotate)
  - **No Moving**: Static view without panning
  - **No Zoom**: Panning allowed but no zoom in/out

### Technical Features
- **Full-Stack Architecture**: React frontend with Express/tRPC backend
- **Database Support**: MySQL/TiDB with Drizzle ORM for persistent game sessions
- **Type Safety**: End-to-end TypeScript with tRPC for type-safe API procedures
- **Unit Testing**: Comprehensive test coverage for multiplayer procedures (11 tests)
- **Real-Time Multiplayer**: Backend infrastructure for synchronized gameplay

## Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Maps**: Google Maps JavaScript API with Street View
- **Routing**: Wouter for client-side navigation
- **State Management**: React hooks with tRPC queries/mutations

### Backend
- **Server**: Express 4 with tRPC 11
- **Database**: Drizzle ORM with MySQL/TiDB
- **API**: tRPC procedures for game session management
- **Authentication**: No authentication required (name-based player identification)

### Database Schema
- **GameSessions**: Stores game metadata (mode, view restrictions, status)
- **Players**: Player information within sessions (name, score)
- **RoundResults**: Individual round results (location, guess, distance, points)

## Getting Started

### Prerequisites
- Node.js 22.13.0 or higher
- npm or pnpm
- Google Maps API Key (with Street View and Maps APIs enabled)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nh28jaeyenlaw-spec/geoguessr-free.git
   cd geoguessr-free
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the project root with:
   ```env
   # Database
   DATABASE_URL=mysql://user:password@host:port/database

   # Google Maps API
   VITE_FRONTEND_FORGE_API_KEY=your_google_maps_api_key
   VITE_FRONTEND_FORGE_API_URL=https://your-proxy-url

   # JWT Secret (for session signing)
   JWT_SECRET=your_jwt_secret_key

   # OAuth (if using authentication)
   VITE_OAUTH_PORTAL_URL=https://oauth-portal-url
   OAUTH_SERVER_URL=https://oauth-server-url
   ```

4. **Set up the database**:
   ```bash
   pnpm db:push
   ```

5. **Start the development server**:
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`

## Usage

### Single Player Mode
1. Click **"Start Playing"** on the home page
2. View the Street View location
3. Click on the map to place your guess
4. Proceed through 5 rounds
5. View your final score and statistics

### Multiplayer Mode
1. Click **"Play with Friends"** on the home page
2. **Create a Party**:
   - Enter your name
   - Select game mode (1v1, 2v2, or Freeplay)
   - Select view restriction (Normal, No Moving, or No Zoom)
   - Click "Create Party"
   - Share the generated party code with friends
3. **Join a Party**:
   - Enter your name
   - Enter the party code
   - Click "Join Party"
4. Wait for all players to join
5. Click "Start Playing" when ready
6. Play through 5 rounds with synchronized gameplay

## API Documentation

### tRPC Procedures

#### Game Session Management
- `game.createSession`: Create a new game session with mode and view restrictions
- `game.joinSession`: Join an existing session with a party code
- `game.startSession`: Start a game session when all players are ready
- `game.saveRoundResult`: Save the result of a single round (location, guess, distance, points)
- `game.getSessionStatus`: Get current session status and player information

### Database Queries
All database operations are handled through Drizzle ORM query helpers in `server/db.ts`. See the schema in `drizzle/schema.ts` for available tables and fields.

## Project Structure

```
client/
  src/
    pages/
      Home.tsx           # Landing page with game mode selection
      Game.tsx           # Main game component with Street View and map
      Lobby.tsx          # Multiplayer lobby for creating/joining parties
    components/
      Map.tsx            # Google Maps integration
      DashboardLayout.tsx # Dashboard layout for admin panels
    lib/
      trpc.ts            # tRPC client configuration
    _core/
      hooks/useAuth.ts   # Authentication hook
    App.tsx              # Routes and layout
    main.tsx             # React entry point
    index.css            # Global styles

server/
  db.ts                  # Database query helpers
  routers.ts             # tRPC procedure definitions
  procedures/
    game.ts              # Game-specific procedures
    game.test.ts         # Unit tests for game procedures
  _core/                 # Framework-level infrastructure
    context.ts           # tRPC context builder
    oauth.ts             # OAuth integration
    map.ts               # Google Maps backend helpers
    llm.ts               # LLM integration
    notification.ts      # Owner notifications

drizzle/
  schema.ts              # Database schema definitions
  relations.ts           # Table relationships
  migrations/            # Database migrations

shared/
  types.ts               # Shared TypeScript types
  const.ts               # Shared constants

vitest.config.ts         # Test configuration
package.json             # Dependencies and scripts
```

## Development

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
```

### Database Migrations
After updating `drizzle/schema.ts`:
```bash
pnpm db:push
```

## API Key Configuration

### Google Maps API Setup

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the following APIs:
     - Google Maps JavaScript API
     - Street View Static API
     - Maps JavaScript API

2. **Create an API Key**:
   - Go to Credentials
   - Create an API key
   - Restrict to HTTP referrers (your domain)
   - Copy the API key

3. **Add to Environment**:
   ```env
   VITE_FRONTEND_FORGE_API_KEY=your_api_key_here
   ```

### Using Manus Proxy (Recommended)

If deployed on Manus, the proxy system handles Google Maps authentication automatically. No manual API key configuration is required—the platform provides:
- `VITE_FRONTEND_FORGE_API_URL`: Proxy endpoint for frontend
- `VITE_FRONTEND_FORGE_API_KEY`: Bearer token for authentication

## Deployment

### Manus Hosting
The project is configured for deployment on Manus with built-in hosting:
1. Save a checkpoint via the Management UI
2. Click the **Publish** button
3. Configure custom domain if desired
4. Your game is live!

### External Hosting
For deployment to external platforms (Vercel, Netlify, Railway, etc.):
1. Build the project: `pnpm build`
2. Deploy the `dist/` directory
3. Configure environment variables on your hosting platform
4. Set up database connection string

**Note**: Manus provides built-in hosting with custom domain support. External hosting may have compatibility issues with the Manus proxy system.

## Performance Optimization

- **Street View Caching**: Panorama data is cached by Google's CDN
- **Map Lazy Loading**: Map component loads only when needed
- **Responsive Images**: Optimized for mobile and desktop
- **Database Indexing**: Efficient queries on game sessions and results

## Troubleshooting

### Street View Not Loading
- Verify Google Maps API key is valid and has Street View API enabled
- Check that the location is within Google Street View coverage
- Ensure API key restrictions allow your domain

### Multiplayer Not Syncing
- Verify database connection is working: `pnpm db:push`
- Check that all players are in the same session (same party code)
- Ensure backend server is running: `pnpm dev`

### Map Not Responding to Clicks
- Verify Google Maps JavaScript API is loaded
- Check browser console for errors
- Ensure map container has proper dimensions (w-96 h-96)

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and add tests
3. Run tests: `pnpm test`
4. Commit with clear messages
5. Push and create a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues, feature requests, or questions:
- Open an issue on [GitHub](https://github.com/nh28jaeyenlaw-spec/geoguessr-free/issues)
- Check the [documentation](https://github.com/nh28jaeyenlaw-spec/geoguessr-free/wiki)

## Acknowledgments

- Built with [Google Maps API](https://developers.google.com/maps)
- Powered by [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/)
- Backend infrastructure with [tRPC](https://trpc.io/) and [Drizzle ORM](https://orm.drizzle.team/)
- Hosted on [Manus](https://manus.im/)
