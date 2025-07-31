# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install backend dependencies:**
   ```bash
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend && npm install && cd ..
   ```

3. **Initialize the database:**
   ```bash
   npm run db:init
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   npm run dev
   ```
   This starts the Express server on `http://localhost:3000`

2. **In a separate terminal, start the frontend:**
   ```bash
   npm run frontend:dev
   ```
   This starts the Vite dev server on `http://localhost:5173`

3. **Access the application:**
   - Frontend UI: `http://localhost:5173`
   - OBS Overlay: `http://localhost:3000/overlay`
   - API Health: `http://localhost:3000/api/health`

## Architecture Overview

### Backend (Node.js/Express)
- **Server**: `server.js` - Main Express application with Socket.io
- **Database**: SQLite with organized schema
- **Routes**: RESTful API endpoints for all resources
- **Real-time**: WebSocket connections for live updates
- **File Upload**: Multer middleware for image handling

### Frontend (React/Vite)
- **Template Generator**: Form-based interface for creating AI prompts
- **Scene Manager**: CRUD operations for reusable scenes
- **Character Manager**: CRUD operations for characters
- **Image Uploader**: Drag-and-drop image upload with preview
- **Template History**: View and manage generated templates

### OBS Integration
- **Overlay**: Lightweight HTML page with Socket.io client
- **Real-time Updates**: Automatic image updates via WebSocket
- **Browser Source**: Direct integration with OBS Studio

## Database Schema

### Tables
- `scenes` - Reusable scene descriptions
- `characters` - Character definitions with appearance
- `templates` - Generated AI prompt templates
- `images` - Uploaded images with metadata
- `events` - Event descriptions (unused in current version)

### Relationships
- Templates can reference scenes and multiple characters
- Images can be linked to templates
- Only one image can be active at a time

## API Endpoints

### Scenes
- `GET /api/scenes` - List scenes with search/pagination
- `POST /api/scenes` - Create new scene
- `PUT /api/scenes/:id` - Update scene
- `DELETE /api/scenes/:id` - Delete scene

### Characters  
- `GET /api/characters` - List characters with search/pagination
- `POST /api/characters` - Create new character
- `PUT /api/characters/:id` - Update character
- `DELETE /api/characters/:id` - Delete character

### Templates
- `GET /api/templates` - List generated templates
- `POST /api/templates/generate` - Generate new template
- `DELETE /api/templates/:id` - Delete template

### Images
- `GET /api/images` - List uploaded images
- `GET /api/images/active` - Get currently active image
- `POST /api/images/upload` - Upload new image
- `PUT /api/images/:id/activate` - Set image as active
- `DELETE /api/images/:id` - Delete image

## Socket.io Events

### Client → Server
- `join-overlay` - Join the overlay room for updates

### Server → Client
- `image-update` - New image activated (to overlay clients)
- `image-uploaded` - Image uploaded (to all clients)
- `template-generated` - New template created

## Development Tips

### Adding New Features
1. **Backend**: Add routes in `/routes`, update database schema if needed
2. **Frontend**: Create components in `/frontend/src/components`
3. **API Integration**: Update `/frontend/src/services/api.js`

### Database Changes
1. Update schema in `/db/database.js`
2. Consider migration strategy for existing data
3. Update API routes and validation

### Styling
- Uses Tailwind CSS for consistent styling
- Custom CSS variables for theming
- Responsive design principles

### Testing OBS Integration
1. Add Browser Source in OBS
2. Set URL to `http://localhost:3000/overlay`
3. Set dimensions to 1920x1080
4. Test image uploads and verify real-time updates

## Deployment Considerations

### Production Setup
- Use PM2 or similar for process management
- Set NODE_ENV=production
- Configure proper CORS origins
- Use reverse proxy (nginx) for static file serving
- Set up SSL/HTTPS for production use

### Environment Variables
```bash
PORT=3000
DB_PATH=./db/rpg.sqlite
UPLOAD_DIR=./uploads
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Docker Deployment
The project is ready for containerization:
- Dockerfile for the Node.js backend
- docker-compose.yml for full stack deployment
- Volume mounting for persistent data

## Troubleshooting

### Common Issues
1. **Database locked**: Ensure only one instance is running
2. **CORS errors**: Check CORS_ORIGIN environment variable
3. **Socket.io connection**: Verify proxy configuration in Vite
4. **File upload errors**: Check upload directory permissions

### Debug Mode
Set `DEBUG=socket.io*` environment variable for detailed Socket.io logs.

## Future Enhancements

### Planned Features
- AI API integration (OpenAI DALL-E, Stable Diffusion)
- Twitch chat integration
- Image history and versioning
- Template sharing/export
- Advanced image queue management
- Multi-room support for multiple campaigns
