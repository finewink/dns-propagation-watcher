const express = require('express');
const path = require('path');

const router = express.Router();

const { pool, asyncQuery } = require('../service/MariaDb');
// const { briefAll, briefByCountryCode } = require('../service/DataProvider');
// const { triggerBatchAll, triggerBatchContinent, triggerBatchCountry } = require('../service/Batch');

router.get("/", function(req, res, next){
    res.sendFile(path.join(__dirname, "../front/cdn.html"));
});

router.get("/front/:filename", function(req, res, next){
    const filename = req.params.filename;
    res.sendFile(path.join(__dirname, `../front/${filename}`));
});

router.get("/now", function(req, res, next){
    asyncQuery('select CURRENT_TIMESTAMP', (data) => {res.send(data)});
});

// router.get("/:host", function(req, res, next){
//     const host = req.params.host;
//     asyncQuery('select CURRENT_TIMESTAMP', (data) => {res.send(data)});
// });

// router.get("/brief/all", async (req, res, next) => {
//     briefAll((data) => {
//         res.send(JSON.stringify(data));
//     });

// });

// router.get("/brief/:country_code", async (req, res, next) => {
//     const country_code = req.params.country_code;

//     briefByCountryCode(country_code, (data) => {
//         res.send(JSON.stringify(data));
//     });
// });


// router.get("/batch/continent/:continent/:host", async (req, res, next) => {
//     const continent = req.params.continent;
//     const host = req.params.host;
//     triggerBatchContinent(continent, host);
//     res.send('batch executed');
// });

// router.get("/batch/country/:country/:host", async (req, res, next) => {
//     const country = req.params.country;
//     const host = req.params.host;
//     triggerBatchCountry(country, host);
//     res.send('batch executed');
// });

// router.get("/batch/:host", async (req, res, next) => {
//     const host = req.params.host;
//     triggerBatchAll(host);
//     res.send('batch executed'); 
// });

module.exports = router;
