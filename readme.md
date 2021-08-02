# inadoki

Ina streamed with a heartrate monitor during her Horror week. So, naturally, someone had to create a log of it... right?

## Data gatherer

This branch is solely for the data gathering from the streams. For the web source code (as well as pre-generated JSON files) check out the `web` branch.

### Requirements 

For `gatherer`, you'll most likely need a UNIX system that has the following:

* `tesseract>=4` - OCR system (with `tessdata`)
* `imagemagick` - preprocessing frames for OCR
* `ffmpeg` - converting the stream into frames
* `youtube-dl` - downloading the stream
* `nodejs` - optional, converting data for web

### Usage

Please note that while I did my best to make the script as flexible as possible, for uses other that Ina's streams during the Horror week *will* require manually adjusting hardcoded values that are described below.

#### `./gather_video.sh`

This script is responsible for nearly if not all of the work required. 

```sh
# Example usage
$ ./gather_video.sh "$VIDEO_URL" "$TIME_START" "$TIME_END"
```

The command itself expects 3 arguments:
* `VIDEO_URL` - URL to said video to be downloaded and then processed
* `TIME_START` - Time in seconds from which to start extracting frames
* `TIME_END` - Time in seconds to which to stop extracting frames

The script itself expects the URL to be a YouTube URL (because of the rubbish `grep` video ID extractor), if you wish to use different platforms you'll need to edit for your purpose.

Parameters `TIME_START` and `TIME_END` are for specifying the range of which to process to avoid processing empty or invalid frames for time and space conserving reasons.

#### `./ocr.sh`

This script is called with its sole argument being the path to the image to be read, after which it pre-processes the image and performs OCR reading on it.

The return value is a CSV row in format `$FILENAME;$OCR_RESULT`. The `$FILENAME` in our case would be the frame number.

The "pre-processing" part is basically adjusting the image colors til only the number is visible in a 1bpp image. Again, if you wish to use the script for other videos, this is the ~~value~~ command you want to tweak.

### What does it do?

You can take a peek inside the `./gather_video.sh` file, which has been commented quite well in my opinion. Down below are more information about it which may include my internal thoughts.

Also please do note that I *do not consider the script to be optimized nor a smart solution*.

The script includes some "hidden options" for cleaning up data, however these are truly just experimental and should not be used.

All of the arguments to the script are passed along to the `gather()` function (which acts like the script itself).

The first step is obtaining the stream itself, which is done by using `youtube-dl`. I have hardcoded the format ID of `247`, being the smallest 720p30 video only file. From my testing, 720p seemed to be the "sweet spot" between legibility and file size. 60FPS was out of the question, since it'd be just wasteful, given that the HR changes (from the looks of it) every half a second.

After the download is completed, the stream is then cut up into separate frames. During this process, there's a variable called `$CROP`, which specifies which portion of the video is required. If you're planning to use this script for others' stream, this is most likely the value you need to tweak. During this stage, variables `$TIME_START` and `$TIME_END` are utilized to just extract the needed part.

The final part of all of this is the OCR itself. The script takes *every 15th* extracted frame and does `./ocr.sh` on it, because the footage is expected to be 30FPS and the heartrate monitor changes every half a second. Doing so reduces the computation time from up to 24 hours down to an hour (with theoretically conserving every HR value). This stage is also ran in `parallel`, hence the `OMP_THREAD_LIMIT`. I have not tested it thoroughly whether this hinders or helps the performance though.

At this point you can consider the work to be done, however `tesseract` was (or at least in my case) quite inaccurate in a few parts. You can test it out on a few problematic frames in the `test/` folder (eg. 100 is read as 700, 100 as 160, ...). However since most of the work done automatically was correct, manually editing these values was easy and finding them even easier (given that a human heart shouldn't be able to go from 99 to 160 in 0.5s).

If you are satisfied with the CSV results in the `data/` folder, you are finished. If you want to process these results into a format that the `web` branches needs, you'll need to call the `./reparse.js` script. All it does is converts all of CSV files into JSON and calculates their peak, average and lowest values for each video *and* all videos in total. The script itself will create a `json/` folder, which is then just copied over into the `assets/` folder of the `web` branch.

## `test` folder

It includes a few files that were a tad problematic for the OCR to detect correctly. Those files were used to fine-tune the `convert` command in the `ocr.sh` script.

## License

MIT