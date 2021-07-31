window.onload = async e => {
    const
        hrSeek = new HrSeek('canvas#hr_section')

    const
        videoPeak = document.querySelector('#video_stat #peak'),
        videoAvg = document.querySelector('#video_stat #avg'),
        videoContainer = document.querySelector('#video_container'),
        videoSelect = document.querySelector('#video_select')

    let player = null

    videoSelect.onchange = async e => {
        await loadVideo(e.target.value)
    }

    async function loadVideo(id){
        try{
            const data = await (await fetch(`assets/json/${id}.json`)).json()
            videoPeak.innerText = data.peak.toFixed(2) + ' bpm'
            videoAvg.innerText = data.avg.toFixed(2) + ' bpm'

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
            alert('Failed to get video ID\'s HR data. vignedev f-word up.')
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