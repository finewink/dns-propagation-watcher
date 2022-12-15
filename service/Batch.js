
//const { pool, asyncQuery, asyncInsertDnsQueryResult } = require('./MariaDb');
const  looker = require('../service/NsLooker');
const {briefAll, insertDnsQueryResult, deleteDnsQueryResult, briefByContinentCode, briefByCountryCode, updateDnsServerInfoUseYn} = require('./DataProvider');

//let batchOn = false;

const triggerBatchAll = async (batch_key, sessionId) => {
    //await deleteDnsQueryResult(batch_key);
    briefAll((data) => {
        dnsQueryByList(batch_key, sessionId, data);
    });
}

const dnsQueryByList = async (batch_key, sessionId, data) => {
    for(let i = 0 ; i < data.length ; i++){
        let item = data[i];
        //if(!batchOn) break;
        //
        //const cool = queryDnsQueryCoolTime(batch_key, item.ip_address);
        //if(!cool) continue;
        //console.log(item);
        
        aRecord = looker.dnsLookUp(batch_key, item.ip_address, (cbAddress, cbErrCd, cbErrMsg) => {
            //console.log({dnsLookupResult:{dns:item.ip_address, a:cbAddress, errCd:cbErrCd, errMsg:cbErrMsg}});
            if(cbErrCd == 0){
                insertDnsQueryResult(batch_key, item.ip_address, cbAddress, item.country_code, cbErrCd, cbErrMsg, sessionId, (result) => { console.log({updateResult:result}) } );
            }
            else{
                insertDnsQueryResult(batch_key, item.ip_address, cbAddress, item.country_code, cbErrCd, cbErrMsg, sessionId, (result) => { console.log({updateResult:result}) } );
                // if(cbErrMsg.Error.inclues("REFUSE") | cbErrMsg.Error.inclues("TIMEOUT")){
                //updateDnsServerInfoUseYn(item.ip_address, 'N', (result) => { console.log({updateResult:result}) });
                //deleteDnsQueryResult(batch_key, item.ip_address, sessionId, (result) => { console.log({updateResult:result}) })
                // }
            }
            
        });
        
        //callback({total: data.length, current: i+1});
        await sleep(200);

    }

}

const triggerBatchContinent = async (continent, batch_key, sessionId) => {
    //await deleteDnsQueryResult(batch_key);
    briefByContinentCode(continent, (data) => {
        dnsQueryByList(batch_key, sessionId, data);
    });
}

const triggerBatchCountry = async (country, batch_key, sessionId, callback) => {
    //await deleteDnsQueryResult(batch_key);
    //console.log({triggerBatchCountry:{country:country, batch_key:batch_key}});
    briefByCountryCode(country, (data) => {
        dnsQueryByList(batch_key,sessionId, data, callback);
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

module.exports = {
    triggerBatchAll,
    triggerBatchContinent,
    triggerBatchCountry
    
}