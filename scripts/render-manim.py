#!/usr/bin/env python3
"""
Manim video rendering pipeline.

Fetches videos with status='generating' and manim_script populated from
Supabase, renders each with Manim CE, generates thumbnails with ffmpeg,
uploads to Supabase Storage, and updates the videos table.

Usage:
    python scripts/render-manim.py --quality l --limit 20
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path

# We use urllib for Supabase REST API to avoid extra dependencies
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
RENDER_LOGS_DIR = Path("render-logs")

QUALITY_FLAGS = {
    "l": "-ql",   # 480p, 15fps
    "m": "-qm",   # 720p, 30fps
    "h": "-qh",   # 1080p, 60fps
}


def supabase_request(method: str, path: str, body=None):
    """Make an authenticated request to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal" if method in ("PATCH", "POST") else "return=representation",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            if resp.status in (200, 201):
                return json.loads(resp.read())
            return None
    except urllib.error.HTTPError as e:
        print(f"  Supabase error {e.code}: {e.read().decode()}", file=sys.stderr)
        return None


def supabase_upload(bucket: str, path: str, file_path: Path, content_type: str):
    """Upload a file to Supabase Storage."""
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    with open(file_path, "rb") as f:
        data = f.read()
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
    }
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status in (200, 201)
    except urllib.error.HTTPError:
        # Try upsert (PUT) if file already exists
        req = urllib.request.Request(url, data=data, headers=headers, method="PUT")
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status in (200, 201)
        except urllib.error.HTTPError as e:
            print(f"  Storage upload error: {e.code}", file=sys.stderr)
            return False


def supabase_update_video(video_id: str, updates: dict):
    """Update a video row."""
    path = f"videos?id=eq.{video_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(updates).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status in (200, 204)
    except urllib.error.HTTPError as e:
        print(f"  Update error: {e.code}: {e.read().decode()}", file=sys.stderr)
        return False


def get_video_duration(video_path: Path) -> int:
    """Get video duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(video_path)],
            capture_output=True, text=True, timeout=10
        )
        return int(float(result.stdout.strip()))
    except Exception:
        return 0


def generate_thumbnail(video_path: Path, thumb_path: Path):
    """Generate thumbnail at 1 second mark."""
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(video_path), "-ss", "1", "-vframes", "1",
         "-vf", "scale=640:-1", str(thumb_path)],
        capture_output=True, timeout=30
    )


def render_script(script: str, quality: str, workdir: Path) -> Path | None:
    """Write script to file and render with Manim CE. Returns output path or None."""
    script_path = workdir / "scene.py"
    script_path.write_text(script, encoding="utf-8")

    quality_flag = QUALITY_FLAGS.get(quality, "-ql")
    cmd = ["manim", quality_flag, str(script_path), "ExampleScene"]

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=300, cwd=workdir
        )
    except subprocess.TimeoutExpired:
        print("  Render timed out (5 min)")
        return None

    if result.returncode != 0:
        print(f"  Manim error:\n{result.stderr[-500:]}")
        return None

    # Find output file
    media_dir = workdir / "media" / "videos" / "scene"
    if not media_dir.exists():
        # Try alternative path
        for mp4 in workdir.rglob("*.mp4"):
            return mp4
        return None

    for subdir in media_dir.iterdir():
        for mp4 in subdir.glob("*.mp4"):
            return mp4

    return None


def main():
    parser = argparse.ArgumentParser(description="Render Manim videos")
    parser.add_argument("--quality", choices=["l", "m", "h"], default="l")
    parser.add_argument("--limit", type=int, default=20)
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY", file=sys.stderr)
        sys.exit(1)

    RENDER_LOGS_DIR.mkdir(exist_ok=True)

    # Fetch videos to render
    path = f"videos?status=eq.generating&manim_script=not.is.null&limit={args.limit}&select=id,content_element_id,manim_script"
    videos = supabase_request("GET", path)

    if not videos:
        print("No videos to render.")
        return

    print(f"Found {len(videos)} videos to render.")

    rendered = 0
    failed = 0

    for video in videos:
        vid = video["id"]
        print(f"\n--- Rendering {vid} ---")

        with tempfile.TemporaryDirectory() as tmpdir:
            workdir = Path(tmpdir)
            output = render_script(video["manim_script"], args.quality, workdir)

            if output is None:
                print(f"  ❌ Render failed")
                supabase_update_video(vid, {"status": "failed"})
                # Save log
                log_file = RENDER_LOGS_DIR / f"{vid}.log"
                log_file.write_text(f"Render failed for {vid}\n")
                failed += 1
                continue

            # Get duration
            duration = get_video_duration(output)

            # Generate thumbnail
            thumb_path = workdir / "thumb.jpg"
            generate_thumbnail(output, thumb_path)

            # Upload video
            video_storage_path = f"{vid}.mp4"
            ok = supabase_upload("videos", video_storage_path, output, "video/mp4")
            if not ok:
                print(f"  ❌ Video upload failed")
                supabase_update_video(vid, {"status": "failed"})
                failed += 1
                continue

            # Upload thumbnail
            thumb_storage_path = f"{vid}_thumb.jpg"
            if thumb_path.exists():
                supabase_upload("videos", thumb_storage_path, thumb_path, "image/jpeg")

            # Update DB
            video_url = f"{SUPABASE_URL}/storage/v1/object/public/videos/{video_storage_path}"
            thumb_url = f"{SUPABASE_URL}/storage/v1/object/public/videos/{thumb_storage_path}"

            supabase_update_video(vid, {
                "video_url": video_url,
                "thumbnail_url": thumb_url if thumb_path.exists() else None,
                "duration_seconds": duration,
                "status": "ready",
            })

            print(f"  ✅ Rendered ({duration}s), uploaded")
            rendered += 1

    print(f"\n=== Summary ===")
    print(f"Rendered: {rendered}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    main()
