#!/usr/bin/env bash

# Global settings
export TESSDATA_PREFIX="$HOME/Git/tessdata"
BASE=$(dirname "$0")
TITLE='%(title)s_%(id)s.%(ext)s'

SOURCE_DEST="$BASE"/source
FRAMES_DEST="$BASE"/frames
DATA_DEST="$BASE"/data

SKIP_DOWNLOAD=0
SKIP_FRAMER=0
SKIP_OCR=0

# Cleanup
if [ "$1" == "clean" ]; then
    echo "Cleaning up..."
    rm -rf "$SOURCE_DEST"
    rm -rf "$FRAMES_DEST"
    rm -rf "$DATA_DEST"
fi
if [ "$1" == "clean_frames" ]; then
    echo "Cleaning up..."
    rm -rf "$FRAMES_DEST"
fi
if [ "$1" == "trim" ]; then
    echo "Trimming frames..."

    for VIDEO in "$FRAMES_DEST"/*; do
        for FILE in $(ls "$VIDEO" | \
            grep -F '.png' | \
            awk 'NR % 15 != 0' | \
            awk "{ print \"$VIDEO/\" \$0 }"); do
            rm "$FILE"
        done
    done

    exit 0
fi

# Create a storage for downloaded videos and frames
mkdir -p "$SOURCE_DEST" || error 'Failed to create destination for source videos'
mkdir -p "$FRAMES_DEST" || error 'Failed to create destination for video frames'
mkdir -p "$DATA_DEST" || error 'Failed to create destination for video data'

gather(){
    # Config & Preparation
    error() { echo "[ERROR]: $@"; exit 1; }
    
    SOURCE="$1"
    TIME_START="$2"
    TIME_END="$3"
    TIME_LENGTH=$(bc <<< "$3 - $2")

    CROP="in_w*(150/1920):in_h*(115/1080):in_w*(1240/1920):in_h*(965/1080)"
    if [ $# -ne 3 ]; then
        error "Argument count doesnt match, should be 4 ($0 <time_start> <time_end> <crop>)"
    fi

    # Get a few metadata
    VIDEO_ID=$(grep -Po '(?<=[?&]v=)(.*?)(?=&|$)' <<< "$SOURCE")
    VIDEO_NAME="$VIDEO_ID"
    VIDEO_FILE=$(youtube-dl --get-filename -o "$SOURCE_DEST"/"$VIDEO_NAME"."%(ext)s" "$SOURCE")

    # Actually download the video, 720p is all needed, text is legible and 60fps is wasteful
    if [ $SKIP_DOWNLOAD -ne 1 ]; then
        youtube-dl \
            -f '247' \
            -o "$VIDEO_FILE" \
            "$SOURCE"
        if [ $? -ne 0 ]; then
            error 'Failed to download video'
        fi
    fi

    # Generate frames (assuming 30FPS)
    VIDEO_FRAME_DEST="$FRAMES_DEST"/"$VIDEO_NAME"
    if [ $SKIP_FRAMER -ne 1 -a ! -d "$VIDEO_FRAME_DEST" ]; then
        mkdir -p "$VIDEO_FRAME_DEST" || error 'Failed to create destionation for a video frames'
        ffmpeg \
            -ss "$TIME_START" \
            -i "$VIDEO_FILE" \
            -t "$TIME_LENGTH" \
            -vf "crop=$CROP" \
            -start_number $(bc <<< "$TIME_START * 30") \
            -hide_banner -loglevel quiet -stats -y \
            "$VIDEO_FRAME_DEST"/"%08d.png"
        if [ $? -ne 0 ]; then
            error 'Failed to convert to frames'
        fi
    fi

    # Convert those frames back into values
    VIDEO_FRAME_COUNT=$(ls "$VIDEO_FRAME_DEST" | wc -l)
    VIDEO_FRAME_INCREMENT=0

    VIDEO_DATA_DEST="$DATA_DEST"/"$VIDEO_NAME".csv
    
    if [ $SKIP_OCR -ne 1 ]; then
        echo "frame;hr" > "$VIDEO_DATA_DEST"

        export OMP_THREAD_LIMIT=1 # We are running things in parallel, it's better to have single-threaded performance
        ls "$VIDEO_FRAME_DEST" | \
            grep -F '.png' | \
            awk 'NR % 15 == 0' | \
            parallel --progress --eta "\"$BASE/ocr.sh\" \"$VIDEO_FRAME_DEST/{}\"" \
            >> "$VIDEO_DATA_DEST"
    fi

    echo "[SUCCESS] $VIDEO_FILE"
}

ocr(){
    time "$BASE"/ocr.sh "$1"
    if [ $? -ne 0 ]; then
        error "Failed to OCR image ($1)"
    fi
}

gather "$@"