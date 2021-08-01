const fs = require('fs')

fs.mkdirSync(__dirname + '/json/videos/', { recursive: true })

const data = fs.readdirSync(__dirname + '/data').map(x => ({
    real: __dirname + '/data/' + x,
    name: x
})).filter(x => x.name.toLowerCase().endsWith('.csv'))

let sum = 0, count = 0
let total_stats = {
    peak: 0, avg: 0, min: Number.MAX_VALUE
}

for(const csv of data){
    let file = fs.readFileSync(csv.real, 'utf8')
        .split('\n')
        .slice(1)
        .filter(x => x)
        .map(x => {
            const [ frame, hr ] = x.split(';')
            return { frame: parseInt(frame), hr: parseInt(hr) }
        })
        .sort((a,b) => a.frame - b.frame)
    
    let empty_hr_count = 0
    
    let v_sum = file.reduce((acc,val) => {
        if(!val.hr){
            empty_hr_count++;
            return acc
        }
        return acc + val.hr
    }, 0)
    let v_count = (file.length - empty_hr_count)
    sum += v_sum
    count += v_count

    let peak = file.reduce((acc,val) => val.hr ? Math.max(acc, val.hr) : acc, 0)
    let avg = v_sum / v_count
    let min = file.reduce((acc,val) => val.hr ? Math.min(acc, val.hr) : acc, Number.MAX_VALUE)

    total_stats.peak = Math.max(peak, total_stats.peak)
    total_stats.min = Math.min(min, total_stats.min)

    fs.writeFileSync(__dirname + '/json/videos/' + csv.name.replace('.csv', '') + '.json', JSON.stringify({
        peak, avg, min,
        data: file
    }))
}

total_stats.avg = sum / count
fs.writeFileSync(__dirname + '/json/stats.json', JSON.stringify(total_stats))