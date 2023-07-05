const logger = require("./config/logger");

const mykiaPaths = [
    'mojekia',
    'mykia',
    'mikia',
    'boka-service',
    'mojakia',
];


const redirectRules = require("./config/redirect_eu_dealers_20230524161328.json");
const consessionariaRules = require("./config/redirect_eu_concessionaria_20230612122629.json");

const getFullURL = (hostname, url) => {
    //test for localhost
    // if(hostname === 'localhost'){
    //     //logger.error(`getFullURL: https://www.kia.com${url}`);
    //     return `https://www.kia.com${url}`; 
    // }
    // logger.error(`getFullURL: https://${hostname}${url}`);
    return `https://${hostname}${url}`;
}

// middleware to redirect
const redirect = (prefix) => {
    return {
        mykia: function(req, res, next){
            try{
                for(let path of mykiaPaths){
                    if(req.url.includes("/" + path)){
                        let location = "";
                        if(prefix.language && prefix.language != ''){
                            location = `/${prefix.country}/${prefix.language}/${path}`;
                        }
                        else{
                            location = `/${prefix.country}/${path}`;
                        }
                        logger.info(`301 Redirect : ${location} <- ${prefix.path + req.url}`);
                        res.set('location', location);
                        res.status(301).send();
                        return;
                    }
                }
            }catch(err){
                logger.error(err);
            }
            
            next();
        },
        dealer: function(req, res, next){
            try{
                let reqUrl = prefix.path + req.url;
                //logger.error(`${req.hostname} ${reqUrl}`);
                for(let rule of redirectRules){
                    //console.log(`URL:${reqUrl} COMPARE:${rule.path}`);
                    let match = false;

                    let regExp = null;
                    if(rule.regex  && rule.regex !== ""){
                        regExp = RegExp(rule.regex);
                    }
                    if(rule.path.endsWith("*")){
                        //logger.error("trim:"+rule.path.substring(0, rule.path.length - 1));
                        if(reqUrl.startsWith(rule.path.substring(0, rule.path.length - 1))){
                            match = true;
                        }
                        
                    }
                    else if(reqUrl == rule.path){
                        match = true;
                    }
                    else if(regExp && regExp.test(getFullURL(req.hostname, reqUrl))){
                        match = true;
                    }

                    if(match){
                        //logger.error("match rule:" + JSON.stringify(rule));
                        let location = rule.redirectURL;
                        let statusCode = Number(rule.statusCode) ? Number(rule.statusCode) : 301;
                        //logger.error("search:" + location.search(/\\[2-3]/) > -1);
                        if(rule.regex && location.search(/\\[2-3]/) > -1){
                            let input = getFullURL(req.hostname, reqUrl);
                            let reg = RegExp(rule.regex);
                            let result = reg.exec(input);
                            //logger.error(`REG:${reg} COMPARE:${input} RESULT:${result}`);
                            
                            for(let order = 2; order <= 3; order++){
                                if(location.includes("\\" + order)){
                                    location = location.replace("\\" + order, result[order]);
                                }
                            }
                        }
                        logger.info(`${statusCode} Redirect : ${location} <- ${reqUrl}`);
                        res.set('location', location);
                        res.status(statusCode).send();
                        return;
                    }
                }

                
            }catch(err){
                logger.error(err);
            }
            next();
        },
        consessionaria: function(req, res, next){
            try{
                let reqUrl = prefix.path + req.url;
                //logger.error(`${req.hostname} ${reqUrl}`);
                for(let rule of consessionariaRules){
                    //console.log(`URL:${reqUrl} COMPARE:${rule.path}`);
                    let match = false;
                    if(rule.path.endsWith("*")){
                        //logger.error("trim:"+rule.path.substring(0, rule.path.length - 1));
                        if(reqUrl.startsWith(rule.path.substring(0, rule.path.length - 1))){
                            match = true;
                        }
                        
                    }
                    else if(reqUrl == rule.path){
                        match = true;
                    }

                    if(match){
                        //logger.error("match rule:" + JSON.stringify(rule));
                        let location = rule.redirectURL;
                        let statusCode = Number(rule.statusCode) ? Number(rule.statusCode) : 301;
                        //logger.error("search:" + location.search(/\\[2-3]/) > -1);
                        if(rule.regex && location.search(/\\[2-3]/) > -1){
                            let input = getFullURL(req.hostname, reqUrl);
                            let reg = RegExp(rule.regex);
                            let result = reg.exec(input);
                            //logger.error(`REG:${reg} COMPARE:${input} RESULT:${result}`);
                            
                            for(let order = 2; order <= 3; order++){
                                if(location.includes("\\" + order)){
                                    location = location.replace("\\" + order, result[order]);
                                }
                            }
                        }
                        logger.info(`${statusCode} Redirect : ${location} <- ${reqUrl}`);
                        res.set('location', location);
                        res.status(statusCode).send();
                        return;
                    }
                }

                
            }catch(err){
                logger.error(err);
            }
            next();
        }
    }
}

module.exports = redirect;