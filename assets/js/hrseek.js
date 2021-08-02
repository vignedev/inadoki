class HrSeek{
    /** @param {string} selector CSS selector of the target canvas */
    constructor(selector){
        /** Target canvas to be displayed
         * @type {HTMLCanvasElement} */
        this.canvas = document.querySelector(selector)
        /** Framebuffer to draw the chart into
         * @type {HTMLCanvasElement} */
        this.fbElement = document.createElement('canvas')
        
        /** Target canvas' 2D context
         * @type {CanvasRenderingContext2D} */
        this.ctx = this.canvas.getContext('2d')
        /** Framebuffer's 2D context
         * @type {CanvasRenderingContext2D} */
        this.framebuffer = this.fbElement.getContext('2d')

        /** Data to be rendered
         * @type {{frame: number, hr: number|null}[]} */
        this.data = []

        /** Video duration
         * @type {number} */
        this.total_seconds = 0

        /** Lower bound of HR to be displayed
         * @type {number} */
        this.lower_bound = 70

        /** Upper bound of HR to be displayed
         * @type {number} */
        this.upper_bound = 150

        /** Number in range of `[0.0-1.0]` as relative position to where to display the needle
         * @type {number} */
        this.needle = 0

        /** Render only every nth point
         * @type {number|null} */
        this.simplify = 0

        /** @type {{position: [number, number], hr: number}|null} */
        this.preview_needle = null
        this.preview_needle_y = false

        /** YouTube Embed player (for seeking)
         * @type {YT.Player} */
        this.player = null

        /** @type {string} */
        this.font = '1em Montserrat'

        /** @type {{message: string}} */
        this.messages = {
            'title': 'no video loaded',
            'subtitle': 'btw you can click on the chart to jump to a specific point in the video!'
        }
        /** @type {HTMLElement} */
        this.message_container = null

        // ------------------------------------------------ //

        // Ensure correct size is displayed
        this.correct_size = this.correct_size.bind(this)
        this.correct_size()
        window.addEventListener('resize', this.correct_size.bind(this))

        // Allow click-seeking
        this.canvas.addEventListener('mousedown', e => {
            e.preventDefault()
            const rect = this.canvas.getBoundingClientRect()
            const relative_position = (e.clientX - rect.left) / rect.width

            if(!this.player || !this.player.seekTo) return
            this.player.seekTo(relative_position * this.total_seconds)
            this.needle = relative_position
            this.preview_needle = null
        })

        // Make a preview needle
        this.canvas.addEventListener('mousemove', e => this.onmousemove(e.clientX, e.clientY))
        this.canvas.addEventListener('mouseleave', e => this.preview_needle = null)

        // Touch support
        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault()
            if(e.touches.length >= 1)
                this.onmousemove(e.touches[0].clientX, e.touches[0].clientY)
        })
        this.canvas.addEventListener('touchstart', e => {
            if(!this.preview_needle && e.touches.length >= 1)
                this.onmousemove(e.touches[0].clientX, e.touches[0].clientY)
        })
        this.canvas.addEventListener('touchend', e => {
            e.preventDefault()
            if(e.touches.length <= 0 && this.preview_needle){
                const relative_position = this.preview_needle.position[0]

                if(!this.player) return
                this.player.seekTo(relative_position * this.total_seconds)
                this.needle = relative_position
                this.preview_needle = null
            }
        })
        
        // Make a "no video loaded notice"
        this.message_container = document.createElement('div')
        this.message_container.id = 'msg_container'
        this.canvas.parentElement.appendChild(this.message_container)
        for(const [className, text] of Object.entries(this.messages)){
            const elem = document.createElement('div')
            elem.className = className
            elem.innerText = text
            this.message_container.appendChild(elem)
        }


        // Start the rendering cycle
        this.render = this.render.bind(this)
        this.render()
    }

    onmousemove(clientX, clientY){
        const rect = this.canvas.getBoundingClientRect()
        const
            relativeX = (clientX - rect.left) / rect.width,
            relativeY = (clientY - rect.top) / rect.height

        if(this.preview_needle_y){
            const lookup = this.lookUp(relativeX * this.total_seconds * 30)
            if(!lookup || !lookup.hr){
                this.preview_needle = null
                return
            }
            this.preview_needle = {
                position: [relativeX, relativeY],
                hr: lookup.hr
            }
            return
        }
        this.preview_needle = {
            position: [relativeX, relativeY],
            hr: null
        }
    }

    /**
     * @param {{frame: number, hr: number|null}[]} data New data to overwrite
     * @param {number} total_seconds Duration of the video
     */
    update(data, total_seconds){
        this.data = data
        this.total_seconds = total_seconds
        this.generateChart()
    }

    /** Updates the canvas' and framebuffer's size */
    correct_size(){
        let scale = window.devicePixelRatio
        this.fbElement.width  = this.canvas.width  = this.canvas.clientWidth * scale
        this.fbElement.height = this.canvas.height = this.canvas.clientHeight * scale
        //this.ctx.scale(scale, scale)
        this.font = `${window.devicePixelRatio}em Montserrat`
        this.generateChart(scale)
    }

    /** Renders the chart based on the `data` and `total_seconds` into a framebuffer */
    generateChart(){
        // Clear previous data
        this.framebuffer.font = this.font
        this.framebuffer.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        // Draw lines & legend behind
        this.framebuffer.fillStyle = this.framebuffer.strokeStyle = 'rgba(0, 0, 0, 0.501960784)'
        this.framebuffer.lineWidth = .5
        let max = 10
        let n = max + 1
        while(n--){
            this.framebuffer.beginPath()
            let height = n * this.canvas.height / max
            this.framebuffer.moveTo(0, height)
            this.framebuffer.lineTo(this.canvas.width, height)
            this.framebuffer.stroke()
            this.framebuffer.fillText(this.lower_bound + (max-n) * (this.upper_bound - this.lower_bound) / max, 4, height - 2)
        }

        // Draw the chart
        this.framebuffer.strokeStyle = '#f29a30'
        this.framebuffer.lineWidth = 1
        this.framebuffer.beginPath()

        let pen_down = true
        let index = 0
        for(const { frame, hr } of this.data){
            if(hr == null){
                if(pen_down){
                    this.framebuffer.stroke()
                    pen_down = !pen_down
                }
                continue
            }

            if((this.simplify && this.simplify != 0) && index++ % this.simplify != 0) continue

            let x = (frame / 30) / this.total_seconds * this.canvas.width,
                y = (1.0 - ((hr-this.lower_bound) / (this.upper_bound-this.lower_bound))) * this.canvas.height

            if(pen_down) this.framebuffer.lineTo(x, y)
            else this.framebuffer.moveTo(x, y)
            pen_down = true
        }
        this.framebuffer.stroke()
    }

    /** Continuous rendering cycle */
    render(){
        // Wipe out previous data
        this.ctx.font = 'bold ' + this.font
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        // Rendering the (assumingly) pre-generated chart
        this.ctx.drawImage(this.fbElement, 0, 0)

        // Rendering the needle
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.439215686)'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.moveTo(this.needle * this.canvas.width, 0)
        this.ctx.lineTo(this.needle * this.canvas.width, this.canvas.height)
        this.ctx.stroke()

        // Rendering the preview needle
        if(this.preview_needle){
            let size = this.ctx.measureText(this.preview_needle.hr)
            size.height = (size.actualBoundingBoxAscent + size.actualBoundingBoxDescent) // a lil' bit of mutation

            let position = {
                x: this.preview_needle.position[0] * this.canvas.width,
                y: this.preview_needle.position[1] * this.canvas.height
            }

            this.ctx.fillStyle = this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.439215686)'
            if(this.preview_needle_y){
                let hr_y = (1.0 - ((this.preview_needle.hr-this.lower_bound) / (this.upper_bound-this.lower_bound))) * this.canvas.height
                let box_position = {
                    x: size.width / 4,
                    y: size.height * 1.5 + hr_y - size.height
                }

                this.ctx.fillRect(
                    box_position.x - size.width / 4,
                    box_position.y - size.height * 1.5,
                    size.width + size.width / 2,
                    size.height * 2
                )

                this.ctx.beginPath()
                this.ctx.moveTo(size.width * 1.5, hr_y)
                this.ctx.lineTo(this.canvas.width, hr_y)
                this.ctx.stroke()

                this.ctx.fillStyle = '#ffffffff'
                this.ctx.fillText(
                    this.preview_needle.hr,
                    box_position.x,
                    box_position.y
                )
            }

            this.ctx.lineWidth = 2
            this.ctx.beginPath()

            this.ctx.moveTo(position.x, 0)
            this.ctx.lineTo(position.x, this.canvas.height)

            this.ctx.stroke()
        }

        this.message_container.style.opacity = this.player ? 0.0 : 1.0

        // Repeat the cycle
        requestAnimationFrame(this.render)
    }

    /** Returns the closest HR number near the frame position
     * @param {number} frame Approximate frame position
     * @warning I failed to remember how is upper-bound correctly implemented at 4AM
     * @returns {{frame: number, hr:number|null}} Frame + HR pair */
    lookUp(frame){
        let low = 0
        let middle
        let high = this.data.length - 1
        while(low <= high){
            middle = Math.floor((low + high) / 2)
            if (this.data[middle].frame < frame)
                low = middle + 1
            else if (this.data[middle].frame > frame)
                high = middle - 1
            else
                return this.data[middle]
        }
        return this.data[middle]
    }
}