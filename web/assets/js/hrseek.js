

class HrSeek{
    /** @param {string} selector CSS selector */
    constructor(selector){
        this.canvas = document.querySelector(selector)
        /** @type {CanvasRenderingContext2D} */
        this.ctx = this.canvas.getContext('2d')

        this.fbElement = document.createElement('canvas')
        /** @type {CanvasRenderingContext2D} */
        this.framebuffer = this.fbElement.getContext('2d')

        this.data = []
        this.total_seconds = 0
        this.lower_bound = 70
        this.upper_bound = 150
        this.player = null

        // this.last_mouse_x = 0
        this.needle = 0

        this.fbElement.width = this.canvas.width = this.canvas.clientWidth
        this.fbElement.height = this.canvas.height = this.canvas.clientHeight
        this.generateChart()

        window.addEventListener('resize', _ => {
            this.fbElement.width = this.canvas.width = this.canvas.clientWidth
            this.fbElement.height = this.canvas.height = this.canvas.clientHeight
            this.generateChart()
        })
        /*this.canvas.addEventListener('mousemove', e => {
            this.last_mouse_x = e.clientX - this.canvas.getBoundingClientRect().left;
        })
        this.canvas.addEventListener('mouseleave', e => {
            this.last_mouse_x = null
        })*/

        this.canvas.addEventListener('mousedown', e => {
            const rect = this.canvas.getBoundingClientRect()
            const relative_position = (e.clientX - rect.left) / rect.width

            if(!this.player) return

            this.player.seekTo(relative_position * this.total_seconds)
            this.needle = relative_position
        })

        this.render()
    }

    /**
     * @param {object} data 
     * @param {number} total_seconds 
     */
    update(data, total_seconds){
        this.data = data
        this.total_seconds = total_seconds
        this.generateChart()
    }

    generateChart(){
        this.framebuffer.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        this.framebuffer.strokeStyle = '#f29a30'
        this.framebuffer.lineWidth = 1
        this.framebuffer.beginPath()
        //this.framebuffer.moveTo(0, this.canvas.height)
        for(const { frame, hr } of this.data){
            this.framebuffer.lineTo(
                (frame / 30) / this.total_seconds * this.canvas.width,
                (1.0 - ((hr-this.lower_bound) / (this.upper_bound-this.lower_bound))) * this.canvas.height
            )
        }
        this.framebuffer.stroke()
    }

    render(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.fillStyle = this.ctx.strokeStyle = '#00000080'
        this.ctx.lineWidth = .5
        let max = 10
        let n = max + 1
        while(n--){
            this.ctx.beginPath()
            let height = n * this.canvas.height / max
            this.ctx.moveTo(0, height)
            this.ctx.lineTo(this.canvas.width, height)
            this.ctx.stroke()

            this.ctx.fillText(this.lower_bound + (max-n) * (this.upper_bound - this.lower_bound) / max, 4, height - 2)
        }

        this.ctx.drawImage(this.fbElement, 0, 0)

        this.ctx.strokeStyle = '#ff000070'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.moveTo(this.needle * this.canvas.width, 0)
        this.ctx.lineTo(this.needle * this.canvas.width, this.canvas.height)
        this.ctx.stroke()

        // if(this.last_mouse_x){
        //     this.ctx.strokeStyle = '#ff000070'
        //     this.ctx.beginPath()
        //     this.ctx.moveTo(this.last_mouse_x, 0)
        //     this.ctx.lineTo(this.last_mouse_x, this.canvas.height)
        //     this.ctx.stroke()

        //     let { frame, hr } = this.lookUp(
        //         this.last_mouse_x / this.canvas.width * this.total_seconds
        //     )

        //     let total_seconds = frame / 30
        //     let hour = Math.floor(total_seconds / 3600)
        //     let minutes = Math.floor(total_seconds / 60) - hour * 60
        //     let second = total_seconds - minutes * 60 - hour * 3600
        //     let time = `${hour.toFixed(0).padStart(2, '0')}:${minutes.toFixed(0).padStart(2, '0')}:${second.toFixed(0).padStart(2, '0')}`
                
        //     this.ctx.fillText(frame + ' / ' + time + ' / ' + hr, this.last_mouse_x, 64)
        // }

        requestAnimationFrame(this.render.bind(this))
    }

    lookUp(frame){
        let low = 0
        let middle
        let high = this.data.length - 1
        while(low <= high){
            middle = Math.floor((low + high) / 2)
            if(this.data[middle].frame < frame){
                low = middle + 1
            }else if(this.data[middle].frame > frame){
                high = middle - 1
            }else{
                return this.data[middle]
            }
        }
        return this.data[middle]
    }
}