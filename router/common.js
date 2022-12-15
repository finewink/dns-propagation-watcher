const express = require('express');
const router = express.Router();

const { queryCommonCountry, queryCommonContinent } = require('../service/DataProvider');

router.get("/continent", async (req, res, next) => {
    queryCommonContinent((data) => {
        res.send(data);
    });
});

router.get("/country", async (req, res, next) => {
    queryCommonCountry((data) => {
        res.send(data);
    });
});

module.exports = router;