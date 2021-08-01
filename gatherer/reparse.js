const fs = require('fs')

const data = fs.readdirSync(__dirname + '/data').map(x => ({
    real: __dirname + '/data/' + x,
    name: x
})).filter(x => x.name.toLowerCase().endsWith('.csv'))

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
    fs.writeFileSync(__dirname + '/../web/assets/json/' + csv.name.replace('.csv', '') + '.json', JSON.stringify({
        peak: file.reduce((acc,val) => val.hr ? Math.max(acc, val.hr) : acc, 0),
        avg: file.reduce((acc,val) => {if(!val.hr){empty_hr_count++; return acc} return acc + val.hr}, 0) / (file.length - empty_hr_count),
        min: file.reduce((acc,val) => val.hr ? Math.min(acc, val.hr) : acc, 9999),
        data: file
    }))
}