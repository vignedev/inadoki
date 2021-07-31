window.onload = async e => {
    const hrSeek = new HrSeek('canvas#hr_section')

    const
        videoPeak = document.querySelector('#video_stat #peak'),
        videoAvg = document.querySelector('#video_stat #avg')

    const video = document.querySelector('video')
    const update_needle = (e) => hrSeek.needle = e.target.currentTime / e.target.duration
    video.ontimeupdate = update_needle
    video.onseeking = update_needle
    video.onloadedmetadata = async e => {
        const data = await (await fetch('assets/json/mzR5CjLXZtE.json')).json()
        hrSeek.update(data.data, e.target.duration)

        videoPeak.innerText = data.peak.toFixed(2) + ' bpm'
        videoAvg.innerText = data.avg.toFixed(2) + ' bpm'
    }
}