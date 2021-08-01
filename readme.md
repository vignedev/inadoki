# ina_kokoro

HR log of Ina's horror week.

The project is "separated" into two folders: the `web` and the `gatherer`, which is responsible for the data collection. More information on both of these parts below.

## `web`

Yes, the web is written in pure HTML, JS and CSS. It was because I was running low at memory during the time I started doing this so didn't want to pull any heavy frameworks and/or libraries. 

And besides, it works as it should (or at least I hope so...)

## `gatherer`

For `gatherer`, you'll most likely need a UNIX system that has the following:

* `tesseract>=4` - OCR system (with `tessdata`)
* `imagemagick` - for preparing a section to be OCR'd
* `ffmpeg` - converting the stream into frames
* `youtube-dl` - downloading the stream
* `nodejs` - optional, for web

While the `./gather_video.sh` is in my opinion legible, I'll try to explain the process of how I went on doing this.

Skipping the parts about the cleanup and setup, the function of interest is of course `gather()` which accepts two parameters: *`stream URL`*, *`time start in seconds`* and *`time end in seconds`*. The times are present to trim out and not scan the portions of the stream where the HR is not present, thus cutting down time of computing.

In the funciton itself you can see the variable `CROP`, which is the setting that controls which portion of the screen is going to get cropped out. It's based on relative numbers and thus should work regardless of resolution.

After that the script downloads the stream using `youtube-dl`, it has hard coded format type `247`, which is a `webm` at 30 FPS. While looking at the stream, the heartrate monitor changes like every half-a-second, so a 60 FPS stream would be overkill.

Once the download is finished, the stream is getting cropped and extracted into an image sequence using `ffmpeg`. Unfortunately, I wasn't able to figure out how to skip frames during this process, which would have saved storage space and/or time. More on that below.

And to top it all off is the OCR.

Firstly, it collects *all of the frames*, and selects *every 15th* frame, because as I said before, the HR monitor changes every half-a-second, thus we should always capture every number in these select frames, **significantly** reducing computing time from up to 20 hours down to an hour.

Before the OCR itself begins, the image is being adjusted so it is more clearer what is being read using `convert`, which converts it into a black and white 1bpp image with only the number visible. That is then piped into `tesseract` which does the magic needed.

In this stage there was a lot of trial-and-error to find the "perfect values" in both the preparation phase and the actual OCR phase. For eg. tweaking the threshold value for `convert` yielded in sometimes better results etc. I have also set `tesseract` to do only numbers, thus avoiding random letters in the scan.

Unfortunate thing about this automatic method is that `tesseract` did mistakes here and there, however most of the work is correct and thus the manual repairs were relatively short and could be automated (for eg. HR of `100` would be read as `700`).

Another thing about `tesseract` is that running I am running them in parallel using `parallel`, that's why in `./gather_video.sh` you see the `export OMP_THREAD_LIMIT=1`, so all CPU threads are utilized to its fullest. The OCR process itself takes approximately 30 minutes on a 8 thread CPU with a 3 hour stream.

After all of that is done, the downloaded stream is located at `gatherer/source`, individual frames at `gatherer/frames` and the finished CSV with the values in `gatherer/data`. For the web usage however, there is an extra script called `reparse.js`, which just takes all the data from the folder, calculates a few extra things and puts it together into a JSON, which is then placed into the web directory.

## License

MIT