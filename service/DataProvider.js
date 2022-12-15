const { pool, asyncQuery, asyncUpdate } = require('../service/MariaDb');




const briefAll = (callback) => {
    const query_sql = `
        select ip_address
             , country_code
        from   dns_server_info
        where    nvl(use_yn, 'Y') = 'Y'
      `;
    asyncQuery(query_sql, callback);
}

const briefByContinentCode = (continent_code, callback) => {
    let query_sql = `
        select ip_address
             , country_code
        from   dns_server_info
        where  1=1 
        and    nvl(use_yn, 'Y') = 'Y'

      `;
    if(continent_code == 'EU'){
        //query_sql += ' and country_code in ("BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR","HR","IT","CY","LV","LT","LU","HU","MT","NL","AT","PL","PT","RO","SI","SK","FI","SE","IS","LI","NO","CH","UK","ME","MK","AL","RS","TR","BA","XK","AM","AZ","BY","MD","GE","UA","DZ","EG","IL","JO","LB","LY","MA","PS","SY","TN")';
        query_sql += 'and country_code in ("AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FO","FI","FR","DE","GI","GR","HU","IS","IE","IM","IT","RS","LV","LI","LT","LU","MK","MT","MD","MC","ME","NL","NO","PL","PT","RO","RU","SM","RS","SK","SI","ES","SE","CH","UA","GB","VA","RS")';
    }
    else if(continent_code == 'NA'){
        query_sql += 'and country_code in ("AI","AG","AW","BS","BB","BZ","BM","BQ","VG","CA","KY","CR","CU","CW","DM","DO","SV","GL","GD","GP","GT","HT","HN","JM","MQ","MX","PM","MS","CW","KN","NI","PA","PR","BQ","BQ","SX","KN","LC","PM","VC","TT","TC","US","VI")';
    }
    else if(continent_code == 'AS'){
        query_sql += 'and country_code in ("AF","AM","AZ","BH","BD","BT","BN","KH","CN","CX","CC","IO","GE","HK","IN","ID","IR","IQ","IL","JP","JO","KZ","KW","KG","LA","LB","MO","MY","MV","MN","MM","NP","KP","OM","PK","PS","PH","QA","SA","SG","KR","LK","SY","TW","TJ","TH","TR","TM","AE","UZ","VN","YE")';
    }
    else if(continent_code == 'SA'){
        query_sql += 'and country_code in ("AR","BO","BR","CL","CO","EC","FK","GF","GY","GY","PY","PE","SR","UY","VE")';
    }
    else if(continent_code == 'AF'){
        query_sql += 'and country_code in ("DZ","AO","SH","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","DJ","EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","CI","KE","LS","LR","LY","MG","MW","ML","MR","MU","YT","MA","MZ","NA","NE","NG","ST","RE","RW","ST","SN","SC","SL","SO","ZA","SS","SH","SD","SZ","TZ","TG","TN","UG","CD","ZM","TZ","ZW")';
    }
    else if(continent_code == 'AU'){ // 호주(오세아니아), 남극
        query_sql += 'and country_code in ("AQ", "AS","AU","NZ","CK","TL","FM","FJ","PF","GU","KI","MP","MH","UM","NR","NC","NZ","NU","NF","PW","PG","MP","WS","SB","TK","TO","TV","VU","UM","WF")';
    }
    asyncQuery(query_sql, (data) => {callback(data)});
}

const briefByCountryCode = (country_code, callback) => {
    let countries = country_code ? country_code.split(',') : [];
    let query_sql = `
        select ip_address
             , country_code
        from   dns_server_info
        where  1=1 
        and    nvl(use_yn, 'Y') = 'Y' 
      `;

    if(countries | countries != null | countries.length > 0){
      query_sql += 'and country_code in ('
      for( let item in countries ) {
        query_sql += `'${countries[item]}', `
      }
      query_sql += `'*')`;
    }
    asyncQuery(query_sql, (data) => {callback(data)});
}

async function insertDnsQueryResult(query_key, ip_address, a_record, country_code, err_cd, err_msg, sessionId, callback) {
    if(typeof a_record == 'undefined' || a_record == 'undefined' || a_record == null || a_record == ''){
      callback({error:'A record is invalid'});
      return;
    }
    let conn;
    try {
      conn = await pool.getConnection();
      let query_sql = `
        INSERT INTO dns_query_result
        (query_key, ip_address, a_record, country_code, query_ts, query_err_cd, query_err_msg, session_id)
        values (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?) 
        on duplicate key update 
        a_record = ?,
        query_ts = CURRENT_TIMESTAMP,
        query_err_cd = ?,
        query_err_msg = ?,
        session_id = ?
      
      `;

      asyncUpdate(query_sql, [query_key, ip_address, a_record ? a_record: '', country_code, err_cd, err_msg, sessionId, a_record, err_cd, err_msg, sessionId], callback);
      //const res = await conn.query("INSERT INTO dns_query_result(query_key, ip_address, a_record, country_code, query_ts) value (?, ?, ?, ?, CURRENT_TIMESTAMP)", [query_key, ip_address, a_record, country_code]);
      //console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
      //callback(res);
    } catch (err) {
        console.log(err);
      throw err;
    } finally {
      if (conn) return conn.end();
    }
  }

async function updateDnsServerInfoUseYn(ip_address, use_yn, callback){
  let conn;
  try {
    conn = await pool.getConnection();
    let query_sql = `
    update dns_server_info set use_yn = ? where ip_address = ?

    `;
    asyncUpdate(query_sql, [use_yn, ip_address], callback);
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) return conn.end();
  } 

}
async function deleteDnsQueryResult(query_key, ip_address, sessionId, callback){
    let conn;
    try {
      conn = await pool.getConnection();
      let res= asyncUpdate("DELETE FROM dns_query_result where query_key = ? and ip_address = ? and session_id = ?", [query_key, ip_address, sessionId]);
      callback(res);
    } catch (err) {
        console.log(err);
        callback(err);
      throw err;
    } finally {
      if (conn) return conn.end();
    }
}

async function queryDnsQueryResult(query_key, sessionId, compare, country, callback){
  //console.log({country:country})
    let countries = country ? country.split(',') : [];
    let query_sql = `
      select ip_address
            , a_record
            , country_code
      from   dns_query_result
      where  query_key = '${query_key}'
      and    session_id = '${sessionId}'
      and    query_err_cd = '0'
      
      `;
      //console.log({countries:countries})
      if(countries | countries != null | countries.length > 0){
        query_sql += 'and country_code in ('
        for( let item in countries ) {
          query_sql += `'${countries[item]}', `
        }
        query_sql += `'*')`;
      }
    asyncQuery(query_sql, (data) => { callback(data)});
}

async function queryCommonContinent(callback){
  const query_sql = `
  select continent_name
       , continent_code
       
  from   continent_info
  order by display_order
    
  `;
  asyncQuery(query_sql, (data) => {callback(data)});
}

async function queryCommonCountry(callback){
  const query_sql = `
  select country_name
       , country_code
       , continent_code
  from   country_continent_map t
  where  exists(select '1' from dns_server_info t where country_code = t.country_code and nvl(use_yn, 'Y') = 'Y')
  `;
  asyncQuery(query_sql, (data) => {callback(data)});
}

async function detailQueryResult(host, sessionId, country, callback){
  let countries = country ? country.split(',') : [];
    // let query_sql = `
    //   select ip_address
    //         , a_record
    //         , country_code
    //   from   dns_query_result
    //   where  query_key = '${host}'
    //   and    session_id = '${sessionId}'
    //   and    query_err_cd = '0'
      
    //   `;
    let query_sql = `
      select t2.name
          , t1.ip_address
          , t1.a_record
          , t1.country_code
          , t2.as_org
          , t2.city
          , t2.version
      from   dns_query_result t1
          , dns_server_info t2
      where  t1.query_key = '${host}'
      and    t1.session_id = '${sessionId}'
      and    t1.query_err_cd = '0'
      and    t2.ip_address = t1.ip_address
    `
      //console.log({countries:countries})
      if(countries | countries != null | countries.length > 0){
        query_sql += 'and t1.country_code in ('
        for( let item in countries ) {
          query_sql += `'${countries[item]}', `
        }
        query_sql += `'*')`;
      }
    asyncQuery(query_sql, (data) => { callback(data)});
}

// function queryDnsQueryCoolTime(host, dns){
//   const query_sql = `
//   select '1'
//   where not exists(
//   select '1'
//     from dns_query_result
//    where query_key = ?
//    and   ip_address = ?
//    and   query_ts >= SUBTIME(current_timestamp, '0 0:0:10.000000')  
//    )

//   `
//   let res = syncQuery(query_sql, [host, dns]);
//   return res[0] == '1'
// }

module.exports = {
    briefAll,
    briefByCountryCode,
    insertDnsQueryResult,
    queryDnsQueryResult,
    briefByContinentCode,
    updateDnsServerInfoUseYn,
    queryCommonContinent,
    queryCommonCountry,
    deleteDnsQueryResult,
    detailQueryResult
    //queryDnsQueryCoolTime
}
