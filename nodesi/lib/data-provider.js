'use strict';

const logger = require('../../config/logger');
const goodGuyLib = require('good-guy-http'); // need to replace to request module.
const axios = require('axios');
const url = require('url');
const defaultHeaders = {
    Accept: 'text/html, application/xhtml+xml, application/xml',
    'Accept-Encoding' : 'gzip, deflate, br'
};

module.exports = function DataProvider(config) {
    config = config || {};

    const baseUrl = config.baseUrl || '';
    const goodGuy = config.httpClient || goodGuyLib({
        cache: config.cache,
        errorLogger: logger.error 
    });

    function extendRequestOptions(src, baseOptions) {
        return {
            url: toFullyQualifiedURL(src, baseOptions),
            headers: Object.assign({}, defaultHeaders, baseOptions.headers)
        };
    }

    function toFullyQualifiedURL(urlOrPath, baseOptions) {
        if(urlOrPath.indexOf('http') === 0) {
            return urlOrPath;
        }

        const base = baseOptions ? baseOptions.baseUrl || baseUrl : baseUrl;
        return url.resolve(base, urlOrPath);
    }

    function isMyKia(src){
        const mykiaPaths = [
            'mojekia',
            'mykia',
            'mikia',
            'boka-service',
            'mojakia',
        ];

        for(let path of mykiaPaths){
            if(src.includes(path)){
                return true;
            }
        }

        return false;
    }

    function get(src, baseOptions) {
        logger.info(`ESI include src=${src}`);
        //console.log("DataProvider.get:"+src);
        // const options = extendRequestOptions(src, baseOptions || {});
        // options.gzip = false; // For backwards-compatibility, response compression is not supported by default
        return axios.get(src, {timeout:5000, maxRedirects: isMyKia(src) ? 0 : 5, validateStatus: function (status) {
            return status >= 200 && status < 400;
          }}).then(
            response => {
                if(response.data){
                    response.body = response.data;
                }

                logger.debug({includeUrl:src, status: response.status});

                //console.log(response);
                if(response.status >= 400) {
                    throw new Error(response.statusCode);
                }
                if(response.status == 301 || response.status == 302){
                    
                    return {
                        body: response.body,
                        response: response,
                        location: response.headers['location'],
                        status: response.status
                    };
                }
                
                return {
                    body: response.body,
                    response: response
                };
            }
        ).catch(error => {
            logger.error({includeUrl:src, error:error.toJson()});
            return {includeUrl:src, error:error.toJson(), body: ''};
        });
    }

    return {toFullyQualifiedURL, get};
};
