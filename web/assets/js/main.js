window.onload = async e => {
    const
        hrSeek = new HrSeek('canvas#hr_section'),
        footer = document.querySelector('#random_footer')
    const
        videoPeak   = document.querySelector('#video_stat #peak'),
        videoAvg    = document.querySelector('#video_stat #avg'),
        videoMin    = document.querySelector('#video_stat #min'),
        videoSelect = document.querySelector('#video_select select'),
        dummyOption = document.querySelector('#dummy_option'),
        jsonDlBtn   = document.querySelector('button#jsonDl'),
        csvDlBtn    = document.querySelector('button#csvDl')
    const
        totalPeak   = document.querySelector('#total_stat #peak'),
        totalAvg    = document.querySelector('#total_stat #avg'),
        totalMin    = document.querySelector('#total_stat #min')
    let player = null

    // Hook up UI elements
    jsonDlBtn.onclick = e => download(`assets/json/videos/${videoSelect.value}.json`, `${videoSelect.value}.json`)
    csvDlBtn.onclick = e => download(`assets/csv/videos/${videoSelect.value}.csv`, `${videoSelect.value}.csv`)
    videoSelect.onchange = async e => await loadVideo(e.target.value)

    // Optional and not-so-necessary portion, get the total statistics
    fetch('assets/json/stats.json').then(res => res.json())
    .then(data => {
        totalPeak.innerText = data.peak?.toFixed(2) + ' bpm'
        totalAvg.innerText  = data.avg?.toFixed(2) + ' bpm'
        totalMin.innerText  = data.min?.toFixed(2) + ' bpm'
    })

    // Main portion, create UI elements, load the videos
    try{
        const videos = await (await fetch('assets/json/videos.json')).json()
        dummyOption.innerText = 'select a video (=w<)b'
        videoSelect.disabled = false
        jsonDlBtn.disabled = csvDlBtn.disabled = true

        for(const [id, title] of Object.entries(videos)){
            const option = document.createElement('option')
            option.value = id
            option.innerText = title
            videoSelect.appendChild(option)
        }
    }catch(err){
        dummyOption.innerText = 'Failed to load videos (´°ω°`) sorry...'
        return
    }

    // Just a random thing I thought up
    const messages = [
        'with sleep deprivation',
        'with pain-staking ocr',
        'with over 24gb of source materials',
        'with 4h naps',
        'with pain tako',
        'with aaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    ]
    footer.innerText = messages[Math.floor(Math.random() * messages.length)]

    /** Loads up a video and updates the HR chart
     * @param {string} id YouTube stream's ID */
    async function loadVideo(id){
        try{
            hrSeek.needle = 0
            hrSeek.update([], 0)
            videoPeak.innerText = videoAvg.innerText = videoMin.innerText = '???'
            if(player) player.destroy()

            const data = await (await fetch(`assets/json/videos/${id}.json`)).json()
            videoPeak.innerText = data.peak?.toFixed(2) + ' bpm'
            videoAvg.innerText  = data.avg?.toFixed(2) + ' bpm'
            videoMin.innerText  = data.min?.toFixed(2) + ' bpm'

            jsonDlBtn.disabled = csvDlBtn.disabled = false

            if(player) player.destroy()
            hrSeek.player = player = null

            hrSeek.player = player = new YT.Player('video', {
                width: 1280, height: 720,
                videoId: id, events: {
                    onReady: e => {
                        hrSeek.update(data.data, e.target.getDuration())
                    },
                    onStateChange: e => {
                        hrSeek.needle = (e.target.getCurrentTime() / e.target.getDuration())
                    }
                }
            })
        }catch(err){
            videoSelect.value = ''
            alert('Sorry, couldn\'t load the video HR data! (︶︹︺)\nPlease try again later or try a different video.')
            console.error(err)
            jsonDlBtn.disabled = csvDlBtn.disabled = true
            return
        }
    }

    /**
     * Invokes a download
     * @param {string} url URL of the file
     * @param {string} name Final filename
     */
    function download(url, name){
        const temp = document.createElement('a')
        temp.href = url
        temp.target = '_blank'
        temp.download = name
        temp.click()
    }
}