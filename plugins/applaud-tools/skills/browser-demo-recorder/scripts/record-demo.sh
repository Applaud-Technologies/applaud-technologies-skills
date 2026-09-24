#!/bin/bash
# Record browser demo with virtual display
# Usage: ./record-demo.sh [output.webm]

OUTPUT="${1:-demo-$(date +%Y%m%d-%H%M%S).webm}"
DISPLAY_NUM=99
RESOLUTION="1920x1080"

echo "🎬 Starting browser demo recording..."
echo "   Output: $OUTPUT"
echo "   Resolution: $RESOLUTION"

# Cleanup function
cleanup() {
    echo "🛑 Stopping recording..."
    [ -n "$FFMPEG_PID" ] && kill $FFMPEG_PID 2>/dev/null
    [ -n "$XVFB_PID" ] && kill $XVFB_PID 2>/dev/null
    wait $FFMPEG_PID 2>/dev/null
    echo "✅ Recording saved to: $OUTPUT"
}
trap cleanup EXIT

# Start Xvfb if not already running
if ! xdpyinfo -display :$DISPLAY_NUM >/dev/null 2>&1; then
    echo "📺 Starting virtual display :$DISPLAY_NUM..."
    Xvfb :$DISPLAY_NUM -screen 0 ${RESOLUTION}x24 &
    XVFB_PID=$!
    sleep 2
fi

# Start recording
echo "🔴 Starting ffmpeg recording..."
DISPLAY=:$DISPLAY_NUM ffmpeg -y \
    -video_size $RESOLUTION \
    -framerate 30 \
    -f x11grab \
    -i :$DISPLAY_NUM \
    -c:v libvpx-vp9 \
    -crf 30 \
    -b:v 0 \
    "$OUTPUT" 2>/dev/null &
FFMPEG_PID=$!
sleep 1

# Run the demo
echo "🌐 Running browser demo..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source ~/.nvm/nvm.sh
DISPLAY=:$DISPLAY_NUM node "$SCRIPT_DIR/record-browser-demo.mjs"

echo "⏳ Finalizing video..."
sleep 1
