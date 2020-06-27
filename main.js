const fs = require('fs');
const csv = require('csv-parser');
const cheerio = require('cheerio');
const request = require('request');
const { head } = require('request');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const stream = fs.createReadStream('statusinvest-busca-avancada.csv');
const list = [];
const csvWriter = createCsvWriter({
    path:'./ticker.csv',
    header:[
        {id:'ticker',title:'Ticker'},
        {id:'nome',title:'Nome'},
        {id:'cotacao',title:'Cotacao'},
        {id:'volume',title:'Volume'},
        {id:'lpa',title:'LPA'},
        {id:'vpa',title:'VPA'},
        {id:'lucro',title:'Lucro'}
    ],
    fieldDelimiter:';',
    encoding:'utf-8'
})

stream.pipe(csv({separator:';'}))
        .on('data',(data)=>{
            list.push(data.TICKER);
        })
        .on('end', ()=>{
            console.log(list.length);
        })
function buscador(ticker){
    request(`https://statusinvest.com.br/acoes/${ticker}`,(err,res,body)=>{
        if(!err && res.statusCode === 200){
            let $ = cheerio.load(body);
            let acao = {
                    ticker:$('a.fw-900.active').eq(0).text(),
                    nome:$('h1 small').eq(0).text(),
                    cotacao:$('strong.value').eq(0).text(),
                    volume:$('strong.value').eq(7).text(),
                    lpa:$('strong.value.d-block.lh-4.fs-4.fw-700').eq(6).text(),
                    vpa:$('strong.value.d-block.lh-4.fs-4.fw-700').eq(8).text(),
                    lucro:($('td.level-0.value.text-right.DATA.lastTwelveMonths').eq(10).text()).trim()
            }
            csvWriter.writeRecords([
                {
                ticker:acao.ticker, 
                nome:acao.nome, 
                cotacao:acao.cotacao, 
                volume:acao.volume, 
                lpa:acao.lpa, 
                vpa: acao.vpa, 
                lucro:acao.lucro
                }
            ])
                        .then(()=>console.log('Inserido'))
        }else if(err){
            console.error(`Ticker ${ticker} Error: ${err}`)
        }
    })
}

setInterval(()=>{
    if(list.length===0){
        console.log("ACABOU!!");
        process.exit()
    }else
        buscador(list.shift());
},1000);


