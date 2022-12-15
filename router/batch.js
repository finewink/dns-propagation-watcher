const express = require('express');
const router = express.Router();

const { briefAll, briefByCountryCode } = require('../service/DataProvider');
const { triggerBatchAll, triggerBatchContinent, triggerBatchCountry } = require('../service/Batch');

router.get("/continent/:continent/:host", async (req, res, next) => {
    const continent = req.params.continent;
    const host = req.params.host;
    const sessionId = req.query.sessionId;
    //setBatchOn(true);
    triggerBatchContinent(continent, host, sessionId);
    res.send('batch executed');
});

router.get("/country/:country/:host", async (req, res, next) => {
    const country = req.params.country;
    const host = req.params.host;
    const sessionId = req.query.sessionId;

    //setBatchOn(true);
    triggerBatchCountry(country, host, sessionId);
    res.send('batch executed');
});

router.get("/:host", async (req, res, next) => {
    const host = req.params.host;
    const countries = req.query.countries;
    const sessionId = req.query.sessionId;
    //setBatchOn(true);
    triggerBatchCountry(countries, host, sessionId);
    //res.send('batch executed'); 
});

router.get("/stop", async (req, res, next) => {
    //const host = req.params.host;

    //setBatchOn(false);
    
    res.send('batch stopped'); 
});

module.exports = router;