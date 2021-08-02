# inadoki

Ina streamed with a heartrate monitor during her Horror week. So, naturally, someone had to create a log of it... right?

## Data gatherer

This branch is solely for the the data gathering part from the streams, for the web source code (as well as pre-generated JSON files) check out the `web` branch.

For `gatherer`, you'll most likely need a UNIX system that has the following:

* `tesseract>=4` - OCR system (with `tessdata`)
* `imagemagick` - for preparing a section to be OCR'd
* `ffmpeg` - converting the stream into frames
* `youtube-dl` - downloading the stream
* `nodejs` - optional, for web

After that, you just need to call `./gather_video.sh <youtube_url> <time_start> <time_end>`. For information about these parameters, read below.

While the `./gather_video.sh` is in my opinion legible *enough*, I'll try to explain the process of how I went on doing this. Note: I did say it is *legible*, not a *smart solution*.

Skipping the parts about the cleanup and setup, the function of interest is of course `gather()` which accepts two parameters: *`stream URL`*, *`time start in seconds`* and *`time end in seconds`*. The times are present to trim out and not scan the portions of the stream where the HR is not present, thus cutting down time of computing.

In the function itself you can see the variable `CROP`, which is the setting that controls which portion of the screen is going to get cropped out. It's based on relative numbers and thus should work regardless of resolution.

After that the script downloads the stream using `youtube-dl`, it has hard coded format type `247`, which is a 720p `webm` at 30 FPS. While looking at the stream, the heartrate monitor changes like every half-a-second, so a 60 FPS stream would be overkill.

Once the download is finished, the stream is getting cropped and extracted into an image sequence using `ffmpeg`. Unfortunately, I wasn't able to figure out how to skip frames during this process, which would have saved storage space and/or time. More on that below.

And to top it all off is the OCR.

Firstly, it collects *all of the frames*, and selects *every 15th* frame, because as I said before, the HR monitor changes every half-a-second, thus we should always capture every number in these select frames, **significantly** reducing computing time from up to 20 hours down to an hour.

Before the OCR itself begins, the image is being adjusted so it is more clearer what is being read using `convert`, which converts it into a black and white 1bpp image with only the number visible. That is then piped into `tesseract` which does the magic needed.

In this stage there was a lot of trial-and-error to find the "perfect values" in both the preparation phase and the actual OCR phase. For eg. tweaking the threshold value for `convert` yielded in sometimes better results etc. I have also set `tesseract` to do only numbers, thus avoiding random letters in the scan.

Unfortunate thing about this automatic method is that `tesseract` did mistakes here and there, however most of the work is correct and thus the manual repairs were relatively short and could be automated (for eg. HR of `100` would be read as `700`, or `100` as `160`).

Another thing about `tesseract` is that running I am running them in parallel using `parallel`, that's why in `./gather_video.sh` you see the `export OMP_THREAD_LIMIT=1`, so all CPU threads are utilized to its fullest. The OCR process itself takes approximately an hour on a 8 thread CPU with a 3 hour stream.

After all of that is done, the downloaded stream is located at `source`, individual frames at `frames` and the finished CSV with the values in `data`. For the web usage however, there is an extra script called `reparse.js`, which just takes all the data from the folder, calculates a few extra things and puts it together into a JSON, which is then placed into the `json` folder of the web.

## `test` folder

It includes a few files that were a tad problematic for the OCR to detect correctly. Those files were used to fine-tune the `convert` command in the `ocr.sh` script.

## License

MIT