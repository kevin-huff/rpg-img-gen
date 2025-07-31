# RPG Image Generator

A Node.js application for generating AI image prompts during RPG sessions and displaying them via OBS overlay.

## Features

### Template Generator
- Form-based UI for creating reusable scenes, characters, and events
- Iterative template building with searchable history
- Optimized text output for AI image generation
- Quick recall and modification of previous elements

### OBS Overlay & Image Uploader
- Real-time image upload and display
- WebSocket-powered live updates
- OBS browser source integration
- Image queue management

## Project Structure

```
rpg-img-gen/
├── backend/
│   ├── server.js              # Main Express server
│   ├── db/                    # Database setup and models
│   ├── routes/                # API routes
│   ├── controllers/           # Business logic
│   ├── middleware/            # Custom middleware
│   └── uploads/               # Image upload directory
├── frontend/                  # React/Vite frontend
├── obs-overlay/               # Lightweight OBS overlay
├── scripts/                   # Setup and utility scripts
└── docs/                      # Documentation
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run setup
   ```

2. **Initialize database:**
   ```bash
   npm run db:init
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Start frontend (separate terminal):**
   ```bash
   npm run frontend:dev
   ```

5. **OBS Setup:**
   - Add Browser Source
   - URL: `http://localhost:3000/overlay`
   - Width: 1920, Height: 1080

## Environment Variables

Create a `.env` file:
```
PORT=3000
DB_PATH=./db/rpg.sqlite
UPLOAD_DIR=./uploads
NODE_ENV=development

# Authentication (CHANGE FOR PRODUCTION!)
SESSION_SECRET=change-this-to-a-random-secret-for-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
```

**Security Note**: The default password is visible in the `.env` file. Change `ADMIN_PASSWORD` before deploying to production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user
- `GET /api/auth/status` - Check auth status

### Template Generator (Protected)
- `GET /api/scenes` - List all scenes
- `POST /api/scenes` - Create new scene
- `GET /api/characters` - List all characters
- `POST /api/characters` - Create new character
- `POST /api/templates/generate` - Generate AI prompt template

### Image Management (Protected)
- `POST /api/images/upload` - Upload new image
- `GET /api/images` - List uploaded images
- `DELETE /api/images/:id` - Delete image

### WebSocket Events
- `image-update` - New image uploaded
- `template-generated` - New template created

## Technology Stack

- **Backend:** Node.js, Express, SQLite, Socket.io
- **Frontend:** React, Vite, Tailwind CSS
- **Real-time:** WebSocket connections
- **File Upload:** Multer middleware
- **Database:** SQLite with structured schema

## Development

The project is designed for easy iteration and deployment. The backend serves both the API and static files, while the frontend provides a modern UI for template generation and image management.

## OBS Integration

The overlay is designed to work seamlessly with OBS Studio:
1. Transparent background for clean compositing
2. Real-time updates via WebSocket
3. Responsive image display
4. No manual refresh required
