#!/usr/bin/env bash
HR=$(convert "$1" -channel RGB -threshold 60% -monochrome -negate - | tesseract - - --oem 0 --psm 7 -c tessedit_char_whitelist=0123456789 --dpi 300 | grep -o '[0-9]*')
# if [ ! -z $HR ]; then rm "$1" fi
FRAME=${1%.*}
FRAME=$(basename "$FRAME")
echo "$FRAME;$HR"