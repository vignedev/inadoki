const fs = require('fs')

const data = fs.readdirSync(__dirname + '/data').map(x => ({
    real: __dirname + '/data/' + x,
    name: x
})).filter(x => x.name.endsWith('.csv'))

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
    fs.writeFileSync(__dirname + '/../web/assets/json/' + csv.name + '.json', JSON.stringify({
        peak: file.reduce((acc,val) => Math.max(acc, val.hr), 0),
        avg: file.reduce((acc,val) => acc + val.hr, 0) / file.length,
        data: file
    }))
}