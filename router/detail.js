const express = require('express');
const router = express.Router();

const { asyncQuery } = require('../service/MariaDb');
const { detailQueryResult } = require('../service/DataProvider');


router.get("/", function(req, res, next){
    res.send("hello request");
});

router.get("/all", async (req, res, next) => {
    const query_sql = `
        select ip_address
             , name
             , country_code
             , city
             , version
             , dnssec
             , reliability
        from   dns_server_info
      `;
    asyncQuery(query_sql, (data) => {res.send(JSON.stringify(data))});
});

router.get("/:host", async (req, res, next) => {
  const host = req.params.host;
  const sessionId = req.query.sessionId;
  const countries = req.query.countries;

  detailQueryResult(host, sessionId, countries, (data) => {
    //console.log({detailQueryResult:data})
    res.send(data);
  })
  // const query_sql = `
  //     select ip_address
  //          , name
  //          , country_code
  //          , city
  //          , version
  //          , dnssec
  //          , reliability
  //     from   dns_server_info
  //     where  ip_address = '${ip_address}'
  //   `;
  // asyncQuery(query_sql, (data) => {res.send(data)});


});

// router.get("/country/:country_code", async (req, res, next) => {
//     const country_code = req.params.country_code;
//     const query_sql = `
//         select ip_address
//              , name
//              , country_code
//              , city
//              , version
//              , dnssec
//              , reliability
//         from   dns_server_info
//         where  country_code = '${country_code}'
        
//       `;
//     asyncQuery(query_sql, (data) => {res.send(data)});


// });

module.exports = router;
