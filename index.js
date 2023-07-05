const proxy = require('express-http-proxy-2');
const express = require('express');
const util = require('util');
const path = require('path');
const http = require('http');
const logger = require("./config/logger");


const app = express();
var ESI = require('./nodesi');
const { getCountryCode } = require("./util/common-util");
const redirect = require('./redirect');
const fs = require('fs');
const router = express.Router();

var vhost = require('vhost')

app.use(function(err, req, res, next) {
    var countryCode = getCountryCode(req.url);
    if(countryCode && countryCode != null && countryCode != ""){
        res.writeHead(301, {"Location":`${countryCode}/500.html`, "Cache-Control":"no-store"});
        res.end();
        console.error(`301 redirect to ${countryCode}/500.html <- ${req.url}`);
        return;
    }

    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});


const resHeaderLogs = ["cache-control", "content-type", "content-length", "set-cookie", "vary", "x-original_request_domain"];
const reqHeaderLogs = ["true-client-ip", "x-client-geo-location", "server-port", "dc", "x-gcp-edgescape"]; 

const getProxyLogFormat = function(userReq, userRes, proxyReq, proxyRes){
    let logLine = `${proxyRes.statusCode} ${userRes.statusCode} ${userReq.hostname}${userReq.url} `;

    for(let headerKey of resHeaderLogs){
        logLine = `${logLine} ${headerKey}=[${proxyRes.headers[headerKey]}]`;
    }

    for(let headerKey of reqHeaderLogs){
        logLine = `${logLine} ${headerKey}=[${userReq.headers[headerKey]} ]`;
    }
    // return `${proxyRes.statusCode} ${userRes.statusCode} ${userReq.hostname}${userReq.url} cache-control=[${proxyRes.headers["cache-control"]}] content-type=[${proxyRes.headers["content-type"]}] content-length=[${proxyRes.headers["content-length"]}] ${JSON.stringify(proxyRes.headers)}`;

    return logLine;
}


const esiDecorator = function(proxyRes, proxyResData, userReq, userRes) {
    //logger.info(`${proxyRes.statusCode} ${userRes.statusCode} RES(${userReq.hostname}${userReq.url}): ${JSON.stringify(proxyRes.headers)}`);
    //logger.info(`Proxy:${userReq.url}`);
    var esiParser = ESI();
    
    const response = proxyResData.toString('utf8');
    if(!response.includes("<esi:")) return response;

    return esiParser.process.bind({userReq:userReq})(response, null).then(data => {
        if(userReq.VARS){
            var DEALER_BUILD_PATH = userReq.VARS['DEALER_BUILD_PATH'];
            var BUILD_PATH = "";
            if(DEALER_BUILD_PATH && DEALER_BUILD_PATH != ""){ 
                BUILD_PATH = DEALER_BUILD_PATH; 
            } 
            else{ 
                BUILD_PATH = userReq.url; 
            } 
            // setCookie("buildPath", BUILD_PATH + ";path=/"); 
            userRes.cookie("buildPath", `${BUILD_PATH}; path=/`, { encode: (val) => {return val} });
            logger.debug(`Set-Cookie:buildPath=${BUILD_PATH}; path=/`);
        }

        if(userReq.location){
            logger.debug("ESI include 30X Found... " + `location:${userReq.location}, status:${userReq.status}`);
            throw {location:userReq.location, status:userReq.status};
        }

        return data;
    }).catch(err=> {        
        if(err.location && err.status){
            throw {location:err.location, status:err.status};
        }
        logger.error(err);
        return response.replace("$add_header('Set-Cookie', $(BUILD_PATH))", "");;
    });
}

const resHeaderDecorator = function(headers, userReq, userRes, proxyReq, proxyRes){
    try{
        logger.info(getProxyLogFormat(userReq, userRes, proxyReq, proxyRes));

        //console.log(userReq.hostname);
        const hostname = userReq.hostname;
        if(headers['location']){
            let location = headers['location'];
            if(location){
                location = location.replace('org-dealers.kia.com', hostname);
                location = location.replace('eu-www.kia.com', hostname);
                // location = location.replace('org-preprod2-eu.kia.com', 'preprod2-eu.kia.com');
                // location = location.replace('org-preprod-eu.kia.com', 'preprod-eu.kia.com');
                // location = location.replace('org-staging-eu.kia.com', 'staging-eu.kia.com');
                // location = location.replace('org-staging-dealers.kia.com', 'staging-dealers.kia.com');
                // location = location.replace('org-preprod2-dealers.kia.com', 'staging-dealers.kia.com');
                // location = location.replace('org-preprod-dealers.kia.com', 'staging-dealers.kia.com');
                // location = location.replace('org-prod2-dealers.kia.com', 'staging-dealers.kia.com');
                // location = location.replace('org-preprod-dealers.kia.com', 'staging-dealers.kia.com');
                // location = location.replace('org-staging-dealers.kia.com', 'staging-dealers.kia.com');

                //headers['Location'] = location.replace('org-dealers.kia.com', 'www.kia.com');
                headers['location'] = location;
                logger.info(`Redirect Location : ${location} <- ${userReq.url}`);
            }
        }
        //console.log(headers);
        return headers;
    }catch(err){
        logger.error("resHeaderDecorator ERROR=" + err.stack);
    }
    return headers;
}

function getProxyOptions(path, ssl){
    const proxyOptions = {
        https : ssl,
        limit: '10mb',
        proxyReqOptDecorator: function(proxyReqOpts, originalReq) {
            proxyReqOpts.rejectUnauthorized = false;
            return proxyReqOpts;
        },
        proxyReqPathResolver: function(req){
            //logger.info(req.headers);
            if(path){
                //logger.info(`Proxy(${req.hostname}): ${path}${req.url}`);
                return `${path}${req.url}`;                    
            }
            else{
                //logger.info(`Proxy(${req.hostname}):${req.url}`);
                return req.url;
            }

        },
        userResDecorator:esiDecorator,
        userResHeaderDecorator: resHeaderDecorator,
        proxyErrorHandler: function(err, res, next) {            
            if(err.location && err.status){
                res.status(err.status).redirect(err.location);
                return;
            }

            logger.error(`ERROR:" + ${JSON.stringify(err)}`);
            switch (err && err.code) {
            case 'ECONNRESET':    { return res.status(405).send('Connection Reset'); }
            case 'ECONNREFUSED':  { return res.status(200).send('Connection Refused'); }
            default:              { return res.status(500).send('Internal Server Error'); }
            }
        }
    }
    return proxyOptions;
}

const stagings = [
    {requestHost:'www.kia.com', proxyHost:'www.kia.com'},
    {requestHost:'staging-eu.kia.com', proxyHost:'staging-eu.kia.com'},
    {requestHost:'preprod2-eu.kia.com', proxyHost:'preprod2-eu.kia.com'},
    {requestHost:'preprod-eu.kia.com', proxyHost:'preprod-eu.kia.com'},
    {requestHost:'staging-dealers.kia.com', proxyHost:'staging-dealers.kia.com'},
    {requestHost:'preprod2-predajca.kia.com', proxyHost:'preprod2-predajca.kia.com'},
    {requestHost:'preprod2-concessionaria.kia.com', proxyHost:'preprod2-concessionaria.kia.com'},
    {requestHost:'preprod2-forhandler.kia.com', proxyHost:'preprod2-forhandler.kia.com'},
    {requestHost:'preprod2-aterforsaljare.kia.com', proxyHost:'preprod2-aterforsaljare.kia.com'},
    {requestHost:'preprod-predajca.kia.com', proxyHost:'preprod-predajca.kia.com'},
    {requestHost:'preprod-concessionaria.kia.com', proxyHost:'preprod-concessionaria.kia.com'},
    {requestHost:'preprod-forhandler.kia.com', proxyHost:'preprod-forhandler.kia.com'},
    {requestHost:'preprod-aterforsaljare.kia.com', proxyHost:'preprod-aterforsaljare.kia.com'},
    {requestHost:'prod2-eu.kia.com', proxyHost:'prod2-eu.kia.com'},
    {requestHost:'prod2-predajca.kia.com', proxyHost:'prod2-predajca.kia.com'},
    {requestHost:'prod2-concessionaria.kia.com', proxyHost:'prod2-concessionaria.kia.com'},
    {requestHost:'prod2-forhandler.kia.com', proxyHost:'prod2-forhandler.kia.com'},
    {requestHost:'prod2-aterforsaljare.kia.com', proxyHost:'prod2-aterforsaljare.kia.com'},
    {requestHost:'concessionaria.kia.com', proxyHost:'concessionaria.kia.com'},
    {requestHost:'predajca.kia.com', proxyHost:'predajca.kia.com'},
    {requestHost:'forhandler.kia.com', proxyHost:'forhandler.kia.com'},
    {requestHost:'aterforsaljare.kia.com', proxyHost:'aterforsaljare.kia.com'},
    {requestHost:'connect.kia.com', proxyHost:'connect.kia.com'},
];

for(let stg of stagings){
    app.use(vhost(stg.requestHost, proxy(stg.proxyHost, getProxyOptions(path.path, false))));

}

// const dealers = [
//     {country:'cz', language:'', path: '/cz/dealer'},
//     {country:'ie', language:'', path: '/ie/dealer'},
//     {country:'hu', language:'', path: '/hu/markakereskedok'},
//     {country:'es', language:'', path: '/es/concesionarios'},
//     {country:'dk', language:'', path: '/dk/forhandler'},
//     {country:'fr', language:'', path: '/fr/concessions'},
//     {country:'pl', language:'', path: '/pl/dealers'},
//     {country:'be', language:'fr', path: '/be/fr/dealers'},
//     {country:'be', language:'nl', path: '/be/nl/dealers'},
//     {country:'lu', language:'', path: '/lu/dealers'},
//     {country:'nl', language:'', path: '/nl/dealers'},
//     {country:'uk', language:'', path: '/uk/dealers'},
//     {country:'sk', language:'', path: '/sk/predajca'},
//     {country:'fi', language:'', path: '/fi/jalleenmyyjat'},
//     {country:'at', language:'', path: '/at/haendler'},
    
// ];

// for(let path of dealers){
//     app.use(path.path, redirect(path).mykia, redirect(path).dealer, proxy('https://org-dealers.kia.com', getProxyOptions(path.path, true)));
// }

app.use('/', proxy('https://concessionaria.kia.com', getProxyOptions('/', true)));
// const consessionarias = [
//     {country:'it', language:'', path: '/it'}
// ]

// for(let path of consessionarias){
//     app.use(path.path, redirect(path).mykia, redirect(path).consessionaria, proxy('https://org-dealers.kia.com', getProxyOptions(path.path, true)));
// }

//app.use('/', proxy('https://eu-www.kia.com', getProxyOptions(null, true)));



app.set('port', process.env.PORT || 3000);
app.use(express.json);
app.use(express.urlencoded({ extended: true}));

logger.info('App start');
  
http.createServer(app).listen(app.get('port'), function(){
    logger.info("Express server listening on port " + app.get('port'));
});
  
module.exports = router;
exports.esi_proxy = app;
exports.app = app;