const express = require('express');


const router = express.Router();

const  looker = require('../service/NsLooker');
const  { queryDnsQueryResult } = require('../service/DataProvider'); 
const { triggerBatchCountry } = require('../service/Batch');

router.get("/:host/:dns", function(req, res, next){
    const host = req.params.host;
    const dns = req.params.dns;
    // console.log(typeof looker.dnsLookUp);
    aRecord = looker.dnsLookUp(host, dns, function(data){
        res.send({host:host, dns:dns, addresses:data});
    });
});

router.get("/result/:host/:compare", function(req, res, next){
    
    const host = req.params.host;
    const compare = req.params.compare;
    const countries = req.query.countries;
    const sessionId = req.query.sessionId;
    // if(countries && countries != null && countries != ''){
    //     countries.split(',').map(item => {
    //         triggerBatchCountry(item, host);
    //     });
    // }
    
    
    //console.log({host:host, compare:compare});
    queryDnsQueryResult(host, sessionId, compare, countries, (lookupResult) => {
        //console.log(lookupResult);
        let result = [];
        let obj = {};
        //obj[compare] = {};
        //obj['not'] = {};

        //let notKey = `not ${compare}`
        //console.log({lookupResult:lookupResult, length: lookupResult.length});
        if(!lookupResult){
            res.send(result); 
            return;
        } 
        if(lookupResult.length == 0) {
            res.send(result);
            return;
        }

        lookupResult.reduce((json, cur, idx) => {
            if(cur.country_code && cur.country_code != ''){
                if(obj.hasOwnProperty(cur.country_code)){
                    if(obj[cur.country_code].hasOwnProperty(cur.a_record)){
                        obj[cur.country_code][cur.a_record] = obj[cur.country_code][cur.a_record] + 1;
                    }
                    else{
                        obj[cur.country_code][cur.a_record] = 1;
                    }
                }
                else{
                    obj[cur.country_code] = {}
                    obj[cur.country_code][cur.a_record] = 1;
                }
            }
        });

        for( let country_code in obj ) {
            let okCount = 0;
            let notCount = 0;
            let dataName = `${country_code} `;
            let html = `
            <h3>COUNTRY_NAME</h3>
            <table>            
                <tr>
                    <td>A Record</td>
                    <td>Count</td>
                </tr>
                
                    
            `
            let aRecords = [];
            for( let a_record in obj[country_code] ) {
                aRecords.push({a:a_record, count:obj[country_code][a_record]});
                if(a_record == compare){
                    dataName += `\n ${a_record} : ${obj[country_code][a_record]} ` 
                    okCount += obj[country_code][a_record];
                }
                else{
                    dataName += `\n ${a_record} : ${obj[country_code][a_record]} ` 
                    notCount += obj[country_code][a_record];
                }
                html += `
                <tr>
                    <td>${a_record}</td>
                    <td>${obj[country_code][a_record]}</td>
                </tr>
                `
            }
            html += `    
            </table>
            ${okCount} updated out of ${okCount + notCount}, ${Math.round(okCount / (okCount + notCount) * 1000) / 10}%
            `
            
            dataName += `\n ${Math.round(okCount / (okCount + notCount) * 1000) / 10}% `;
            result.push({
                id: country_code,
                name: `${country_code} ${Math.round(okCount / (okCount + notCount) * 1000) / 10}%, ${okCount}/${okCount+notCount}`,
                value: Math.round(okCount / (okCount + notCount) * 100),
                //circleTemplate: { fill: `colors.getIndex(${okCount / (okCount + notCount) * 100})` },
                tooltipDetail : dataName,
                tooltipHTML : html,
                userData: {a_records:aRecords, ok:okCount, not:notCount}
                //orderInList: aRecordCount,
                //aRecord: a_record
            });
        }
        
        //console.log(result);
        res.send(result);
    })
})


module.exports = router;
