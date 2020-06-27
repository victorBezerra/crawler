const fs = require('fs');
const csv = require('csv-parser');
const cheerio = require('cheerio');
const request = require('request');
const csvFast = require('fast-csv');
const { head } = require('request');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const stream = fs.createReadStream('statusinvest-busca-avancada.csv');
const writeStream = fs.createWriteStream('ticker.txt',{flags:'a'});
const list = [];
const result = []
const csvFile = fs.createWriteStream('ticker.csv',{flags:'a'});
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
            console.log(`Ticker: ${acao.ticker}`);
            console.log(`Nome: ${acao.nome}`);
            console.log(`Cotação: ${acao.cotacao}`);
            console.log(`volume: ${acao.volume}`);
            console.log(`LPA: ${acao.lpa}`);
            console.log(`VPA: ${acao.vpa}`);
            console.log(`Lucro: ${acao.lucro}`);
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
            writeStream.write(`Ticker: ${acao.ticker}`)
            writeStream.write(`Ação: ${$('h1.lh-4').eq(0).text()}\n`)
            writeStream.write(`Cotação: ${$('strong.value').eq(0).text()}\n`)
            writeStream.write(`Volume: ${$('strong.value').eq(7).text()}\n`)
            writeStream.write(`LPA: ${$('strong.value.d-block.lh-4.fs-4.fw-700').eq(6).text()}\n`)
            writeStream.write(`VPA: ${ $('strong.value.d-block.lh-4.fs-4.fw-700').eq(8).text()}\n`)
            writeStream.write(`Lucro: ${$('td.level-0.value.text-right.DATA.lastTwelveMonths').eq(10).text()}\n`)
            writeStream.write(`\n`)
        }else if(err){
            console.error(`Ticker ${ticker} Error: ${err}`)
        }
    })
}

setInterval(()=>{
    if(list.length===520){
        console.log("ACABOU!!");
        process.exit()
    }else
        buscador(list.shift());
},1000);


