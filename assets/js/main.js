window.onload = async e => {
    const
        hrSeek = new HrSeek('canvas#hr_chart'),
        footer = document.querySelector('#random_footer')
    const
        videoPeak   = document.querySelector('#video_stat #peak'),
        videoAvg    = document.querySelector('#video_stat #avg'),
        videoMin    = document.querySelector('#video_stat #min'),
        videoSelect = document.querySelector('#video_select select'),
        dummyOption = document.querySelector('#dummy_option'),
        jsonDlBtn   = document.querySelector('button#jsonDl'),
        csvDlBtn    = document.querySelector('button#csvDl'),
        simplifyIn  = document.querySelector('input#simplify'),
        chartControl= document.querySelector('#chart_control'),
        settingsBtn = document.querySelector('#hr_settings_toggle')
    const
        totalPeak   = document.querySelector('#total_stat #peak'),
        totalAvg    = document.querySelector('#total_stat #avg'),
        totalMin    = document.querySelector('#total_stat #min')
    let player = null

    // Hook up UI elements
    jsonDlBtn.onclick = e => download(`assets/json/videos/${videoSelect.value}.json`, `${videoSelect.value}.json`)
    csvDlBtn.onclick = e => download(`assets/csv/videos/${videoSelect.value}.csv`, `${videoSelect.value}.csv`)
    videoSelect.onchange = async e => await loadVideo(e.target.value)
    simplifyIn.oninput = simplifyIn.onchange = e => {
        hrSeek.simplify = e.target.max - e.target.value
        hrSeek.generateChart()
    }
    settingsBtn.onclick = e => chartControl.classList.toggle('closed')

    // Optional and not-so-necessary portion, get the total statistics
    fetch('assets/json/stats.json').then(res => res.json())
    .then(data => {
        totalPeak.innerText = ((data && data.peak) ? data.peak.toFixed(2) : '???') + ' bpm'
        totalAvg.innerText  = ((data && data.avg)  ? data.avg.toFixed(2)  : '???') + ' bpm'
        totalMin.innerText  = ((data && data.min)  ? data.min.toFixed(2)  : '???') + ' bpm'
    })

    // Main portion, create UI elements, load the videos
    try{
        const videos = await (await fetch('assets/json/videos.json')).json()
        dummyOption.innerText = 'select a video here (=w<)b'
        videoSelect.disabled = false
        jsonDlBtn.disabled = csvDlBtn.disabled = true

        for(const [id, title] of Object.entries(videos)){
            const option = document.createElement('option')
            option.value = id
            option.innerText = title
            videoSelect.appendChild(option)
        }

        const given_id = window.location.hash.substr(1)
        if(given_id) await loadVideo(given_id)
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
        //'with a 3d model in the works (shh)' // little teaser ow<
        'wah'
    ]
    footer.innerText = messages[Math.floor(Math.random() * messages.length)]

    // YouTube's iframe API doesn't provide any events for time change, so we need to monitor it ourself
    setInterval(() => {
        if(player == null || !player || !player.getCurrentTime || !player.getDuration) return
        hrSeek.needle = (player.getCurrentTime() / player.getDuration())
    }, 1000) // check every second, we don't need maximum precision

    /** Loads up a video and updates the HR chart
     * @param {string} id YouTube stream's ID */
    async function loadVideo(id){
        try{
            hrSeek.needle = 0
            hrSeek.update([], 0)
            videoPeak.innerText = videoAvg.innerText = videoMin.innerText = '???'
            if(player) player.destroy()

            const data = await (await fetch(`assets/json/videos/${id}.json`)).json()
            videoPeak.innerText = ((data && data.peak) ? data.peak.toFixed(2) : '???') + ' bpm'
            videoAvg.innerText  = ((data && data.avg)  ? data.avg.toFixed(2)  : '???') + ' bpm'
            videoMin.innerText  = ((data && data.min)  ? data.min.toFixed(2)  : '???') + ' bpm'

            jsonDlBtn.disabled = csvDlBtn.disabled = false
            videoSelect.value = id
            
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

            window.location.hash = id
        }catch(err){
            videoSelect.value = ''
            alert('Sorry, couldn\'t load the video HR data! (︶︹︺)\nPlease try again later or try a different video.')
            console.error(err)
            jsonDlBtn.disabled = csvDlBtn.disabled = true
            if(player) player.destroy()
            hrSeek.player = player = null
            window.location.hash = ''
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