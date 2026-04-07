"""
Thumbnail generator for Axly's Customs gallery.
Reads images.json, generates 400px-wide compressed JPEG thumbnails in images/thumbs/.
Run this after adding/removing images via the admin panel.
"""

import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: python -m pip install Pillow")
    sys.exit(1)

THUMB_WIDTH = 400
THUMB_QUALITY = 80
SITE_ROOT = Path(__file__).resolve().parent.parent
IMAGES_JSON = SITE_ROOT / "images.json"
THUMBS_DIR = SITE_ROOT / "images" / "thumbs"


def generate_thumbnail(src_path, thumb_path):
    """Generate a compressed JPEG thumbnail at THUMB_WIDTH px wide."""
    try:
        with Image.open(src_path) as img:
            # Convert RGBA/P to RGB for JPEG
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Calculate proportional height
            ratio = THUMB_WIDTH / img.width
            thumb_height = int(img.height * ratio)

            # Resize with high-quality resampling
            img_resized = img.resize((THUMB_WIDTH, thumb_height), Image.LANCZOS)
            img_resized.save(thumb_path, "JPEG", quality=THUMB_QUALITY, optimize=True)

            src_size = os.path.getsize(src_path)
            thumb_size = os.path.getsize(thumb_path)
            ratio_pct = (thumb_size / src_size * 100) if src_size > 0 else 0
            print(f"  OK  {src_path.name} ({src_size//1024}KB -> {thumb_size//1024}KB, {ratio_pct:.0f}%)")
            return True
    except Exception as e:
        print(f"  FAIL {src_path.name}: {e}")
        return False


def main():
    if not IMAGES_JSON.exists():
        print(f"Error: {IMAGES_JSON} not found.")
        sys.exit(1)

    with open(IMAGES_JSON, "r") as f:
        image_paths = json.load(f)

    print(f"Found {len(image_paths)} images in images.json")
    print(f"Thumbnails dir: {THUMBS_DIR}")
    print()

    THUMBS_DIR.mkdir(parents=True, exist_ok=True)

    generated = 0
    skipped = 0
    failed = 0

    for rel_path in image_paths:
        src = SITE_ROOT / rel_path
        if not src.exists():
            print(f"  SKIP {rel_path} (file not found)")
            skipped += 1
            continue

        # Thumbnail filename: same stem but always .jpg
        thumb_name = src.stem + ".jpg"
        thumb_path = THUMBS_DIR / thumb_name

        # Skip if thumbnail already exists and is newer than source
        if thumb_path.exists() and thumb_path.stat().st_mtime >= src.stat().st_mtime:
            skipped += 1
            continue

        if generate_thumbnail(src, thumb_path):
            generated += 1
        else:
            failed += 1

    # Clean up thumbnails for images no longer in rotation
    active_stems = set()
    for rel_path in image_paths:
        active_stems.add(Path(rel_path).stem)

    removed = 0
    for thumb in THUMBS_DIR.iterdir():
        if thumb.stem not in active_stems:
            thumb.unlink()
            print(f"  REMOVED orphan thumbnail: {thumb.name}")
            removed += 1

    print()
    print(f"Done: {generated} generated, {skipped} skipped, {failed} failed, {removed} orphans removed")


if __name__ == "__main__":
    main()
