# OBS Studio Integration Guide

## Setup Instructions

### 1. Add Browser Source in OBS

1. Open OBS Studio
2. In your scene, click the **+** button in Sources
3. Select **Browser Source**
4. Create a new source or use existing
5. Configure the Browser Source:

   **Settings:**
   - **URL**: `http://localhost:3000/overlay`
   - **Width**: `1920`
   - **Height**: `1080`
   - **FPS**: `30` (default is fine)
   - **Custom CSS**: Leave blank
   - **Shutdown source when not visible**: Unchecked
   - **Refresh browser when scene becomes active**: Unchecked

### 2. Position and Scale

1. **Full Screen Overlay**: Position to cover entire canvas
2. **Corner Overlay**: Scale down and position in corner
3. **Custom Size**: Adjust transform to fit your layout

### 3. Test the Integration

1. Start the RPG Image Generator backend and frontend
2. Upload an image through the web interface
3. Verify it appears in OBS immediately
4. Test switching between images

## Overlay Features

### Automatic Updates
- Images appear instantly when uploaded
- No manual refresh required
- Smooth transitions between images

### Connection Status
- Green indicator: Connected and ready
- Red indicator: Connection issues
- Auto-reconnection on network issues

### Image Display
- Maintains aspect ratio
- Smooth fade transitions
- Transparent background for clean compositing

## Recommended OBS Settings

### For RPG Streaming

1. **Main Scene Layout:**
   ```
   - Webcam (top-right corner)
   - Game/VTT capture (center-left)
   - Image overlay (center-right)
   - Chat overlay (bottom)
   ```

2. **Image Overlay Settings:**
   - Size: 400x400 to 600x600 pixels
   - Position: Right side of screen
   - Opacity: 100% (images have transparency)

### Multiple Overlay Setup

You can run multiple overlays for different purposes:

1. **Scene Images**: `http://localhost:3000/overlay`
2. **Character Portraits**: Custom implementation
3. **Item/Equipment**: Future enhancement

## Troubleshooting

### Common Issues

#### Overlay Not Loading
1. Check if backend server is running on port 3000
2. Verify URL is correct: `http://localhost:3000/overlay`
3. Check browser console in OBS (right-click source → Interact)

#### Images Not Updating
1. Verify WebSocket connection (check status indicator)
2. Restart OBS Browser Source if needed
3. Check network/firewall settings

#### Poor Performance
1. Reduce FPS to 15-20 for overlay sources
2. Use "Shutdown source when not visible" for unused scenes
3. Limit overlay resolution if needed

### Browser Source Optimization

```css
/* Custom CSS for performance (optional) */
body {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
```

## Advanced Configuration

### Custom Styling

You can modify the overlay appearance by editing `/obs-overlay/index.html`:

```css
/* Example customizations */
.image-display {
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 3px solid #gold;
}
```

### Multiple Campaigns

For multiple campaigns, you can:
1. Run multiple backend instances on different ports
2. Use different overlay URLs per campaign
3. Create separate OBS scenes for each campaign

### Remote Streaming

For remote RPG sessions:
1. Expose backend on public IP/domain
2. Update CORS settings for remote access
3. Use HTTPS for secure connections
4. Update overlay URL to public domain

## Production Tips

### Reliable Streaming Setup

1. **Local Network**: Keep everything on local network for stability
2. **Backup Images**: Pre-load important images before session
3. **Test Setup**: Always test before going live
4. **Monitor Performance**: Watch CPU/memory usage

### Stream Integration

The overlay works well with:
- StreamLabs OBS
- OBS Studio (recommended)
- XSplit (via browser source)

### Mobile Control

Since the web interface is responsive, you can:
- Control images from tablet/phone
- Upload images from mobile device
- Monitor overlay from second screen

## Example Workflow

### During RPG Session

1. **Preparation**: Upload key images before session
2. **Scene Changes**: Upload new scene images as needed
3. **Character Introductions**: Activate character portraits
4. **Combat**: Quick image switches for initiative/maps
5. **Story Moments**: Dramatic scene reveals

### Stream Production

1. **Pre-Stream**: Test all overlays and connections
2. **Live**: Use simple controls for quick changes
3. **Post-Stream**: Clear active images, backup important ones

This integration makes your RPG streams more visually engaging and professional!
