window.onload = async e => {
    const
        hrSeek = new HrSeek('canvas#hr_section')

    const
        videoPeak = document.querySelector('#video_stat #peak'),
        videoAvg = document.querySelector('#video_stat #avg'),
        videoMin = document.querySelector('#video_stat #min'),
        videoContainer = document.querySelector('#video_container'),
        videoSelect = document.querySelector('#video_select'),
        dummyOption = document.querySelector('#dummy_option')

    let player = null

    try{
        const videos = await (await fetch('assets/json/videos.json')).json()
        dummyOption.innerText = 'select a video (=w<)b<'
        videoSelect.disabled = false

        for(const [id, title] of Object.entries(videos)){
            const option = document.createElement('option')
            option.value = id
            option.innerText = title
            videoSelect.appendChild(option)
        }
    }catch(err){
        dummyOption.innerText = 'Failed to load videos (´°ω°`)'
        return
    }


    videoSelect.onchange = async e => {
        await loadVideo(e.target.value)
    }

    async function loadVideo(id){
        try{
            hrSeek.needle = 0
            hrSeek.update([], 0)
            videoPeak.innerText = videoAvg.innerText = videoMin.innerText = '???'

            const data = await (await fetch(`assets/json/${id}.json`)).json()
            videoPeak.innerText = data.peak.toFixed(2) + ' bpm'
            videoAvg.innerText = data.avg.toFixed(2) + ' bpm'
            videoMin.innerText = data.min.toFixed(2) + ' bpm'

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
            alert('Sorry, couldn\'t load the video HR data! (︶︹︺)\nTry again later or a different video.')
            console.error(err)
            return
        }
    }

    

    /*const video = document.querySelector('video')
    const update_needle = (e) => hrSeek.needle = e.target.currentTime / e.target.duration
    video.ontimeupdate = update_needle
    video.onseeking = update_needle
    video.onloadedmetadata = async e => {

    }*/
}