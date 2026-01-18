# Image Organization Guide

## Theme Folders

Images are organized by theme in the following folders:

- `fantasy/` - Fantasy artwork
- `cyberpunk/` - Cyberpunk/Shadowrun artwork
- `postapocalyptic/` - Post-apocalyptic artwork
- `modern/` - Modern artwork
- `steampunk/` - Steampunk artwork

## Adding New Images

To add new images to your gallery:

1. **Place the image file** in the appropriate theme folder (e.g., `images/fantasy/my-new-artwork.jpg`)

2. **Add the filename** to the theme's array in `index.html`:
   ```javascript
   fantasy: [
       '1.jpeg',
       '3.jpeg',
       // ... existing images
       'my-new-artwork.jpg'  // Add your new image filename here
   ]
   ```

3. **That's it!** The image will automatically be included in the gallery rotation for that theme.

## Image Requirements

- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp` (case-insensitive)
- Filenames can be anything you want - no specific naming convention required
- Just make sure the filename in the array matches the actual file name exactly (including extension)

## Notes

- Images are randomly shuffled on each theme load
- The gallery rotates through images every 5 seconds
- Users can switch themes using the dropdown on the main page
- Default theme is "Fantasy"

