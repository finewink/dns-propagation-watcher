const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '127.0.0.1', 
    user:'finewink', 
    password: 'resafse2',
    connectionLimit: 5,
    database: 'nslooker'
});

// function syncQuery(query, callback) {
//   let conn;
//   try {
//     conn = await pool.getConnection();
    
//     console.log(`MariaDb query : ${query}`);
//     const rows = await conn.query(query);
//     //console.log(rows); //[ {val: 1}, meta: ... ]
//   //   const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
//   //   console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
//     //console.log(rows);
//     //callback(rows.filter(item => item !== 'meta'));
//     return rows.filter(item => item !== 'meta');
//   } catch (err) {
//       console.log(err);
//     throw err;
//   } finally {
//     if (conn) return conn.end();
//   }
// }

async function asyncQuery(query, callback) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      console.log(`MariaDb query : ${query}`);
      const rows = await conn.query(query);
      //console.log(rows); //[ {val: 1}, meta: ... ]
    //   const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
    //   console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
      //console.log(rows);
      callback(rows.filter(item => item !== 'meta'));
    } catch (err) {
        console.log(err);
      throw err;
    } finally {
      if (conn) return conn.end();
    }
  }

 async function asyncUpdate(sql, param, callback) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const res = await conn.query(sql, param);
      //console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
      if(callback){
        callback(res);
      }
      
    } catch (err) {
        console.log(err);
      throw err;
    } finally {
      if (conn) return conn.end();
    }
 }

  async function asyncInsertDnsQueryResult(query_key, ip_address, a_record, country_code, callback) {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const res = await conn.query("INSERT INTO dns_query_result(query_key, ip_address, a_record, country_code, query_ts) value (?, ?, ?, ?, CURRENT_TIMESTAMP)", [query_key, ip_address, a_record, country_code]);
      //console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
      callback(res);
    } catch (err) {
        console.log(err);
      throw err;
    } finally {
      if (conn) return conn.end();
    }
  }

module.exports = {
    pool,
    asyncQuery,
    asyncUpdate,
    //syncQuery
}