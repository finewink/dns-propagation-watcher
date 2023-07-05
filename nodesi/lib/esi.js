'use strict';

const AllowedHosts = require('./allowed-hosts');
const DataProvider = require('./data-provider');
const Logger = require('./logger');
const { decode } = require('he');

function ESI(config) {
    config = config || {};

    const maxDepth = config.maxDepth || 3;
    const onError = config.onError || (() => {});
    const dataProvider = config.dataProvider || new DataProvider(config);
    const logger = new Logger(config);
    const allowedHosts = (config.allowedHosts && !Array.isArray(config.allowedHosts)) ?
        config.allowedHosts : new AllowedHosts(config, logger);
    const decodeUrl = config.decodeUrl !== undefined ? config.decodeUrl : true;

    function findESIAssignTags(html) {
        const re = /<esi:assign.*?(?:\/\s*>|<\/>)/gms;
        const tags = [];
        let match;
        while ((match = re.exec(html)) !== null) {
            tags.push(match[0]);
        }
        return tags;
    }

    function makeFullpath(V_TRG_HOST, V_TRG_PATH){ 
        var V_FLL_PATH = ""; 
    
        if(V_TRG_HOST == ""){ 
            V_FLL_PATH = V_TRG_PATH; 
        } 
        else if(V_TRG_PATH.indexOf("?") >= 0){ 
            V_FLL_PATH = V_TRG_PATH + "&t_host=" + V_TRG_HOST; 
        } 
        else{ 
            V_FLL_PATH = V_TRG_PATH + "?t_host=" + V_TRG_HOST; 
        } 
    
        return V_FLL_PATH; 
    
    } 
    
    //
    // route-esi src
    //
    function makeSrc(VARS){
        //log( log.INFO, 'esi:VARS', VARS );
        var fullPath = makeFullpath(VARS['TRG_HOST'], VARS['TRG_PATH']);
        var protocol = "https";
        return `${protocol}://${VARS['AKM_HOST']}${makeFullpath(VARS['TRG_HOST'], VARS['TRG_PATH'])}`;
    }

    function removeQuote(value, quote){
        if(value.endsWith(quote)){
            value = value.substr(0, value.length - 1);
        }
        if(value.startsWith(quote)){
            value = value.substr(1, value.length);
        }
        return value;
    }

    function processHtmlText(html, options, state) {
        options = options || {};
        state = state || {};
        state.currentDepth = state.currentDepth || 0;
        const subtasks = [];
        const maxDepthReached = state.currentDepth > maxDepth;
        //console.log(`${html}, ${options}, ${state}`);

        // in current module, esi:remove are simply removed
        html = handleESIRemove(html);
        html = handleESIChoose(html);
        html = handleESIFunction(html);

        //find assign vars
        
        const vars = findESIAssignTags(html);
        //console.log("vars=" + vars);
        if(!vars.length){
            return Promise.resolve(html);
        }

        const VARS = {};
        var userReq = this.userReq;
        userReq.VARS=VARS;

        let idx = 0;

        html = html.replace("$add_header('Set-Cookie', $(BUILD_PATH))", "");

        vars.forEach(assign => {
            //console.log("ASSIGN=" + assign);
            const placeholder = '';
            html = html.replace(assign, placeholder);
            const name = removeQuote(getDoubleQuotedName(assign) || getSingleQuotedName(assign) || getUnquotedName(assign), "\'");
            const value = removeQuote(getDoubleQuotedValue(assign) || getSingleQuotedValue(assign) || getUnquotedValue(assign), "\'");
            //console.log(`ESI:${name}=${value}`);
            VARS[name] = value;
            idx++;
        });
        // for(let ii in VARS){
        //     console.log(`${ii} = ${VARS[ii]}`);
        // }
        
        const src = makeSrc(VARS);
        options['src'] = src;
        options['userReq']= userReq;

        // for(let ii in options){
        //     console.log(`${ii} = ${options[ii]}`);
        // }

        let i = 0;
        const tags = findESIIncludeTags(html);
        if (!tags.length) {
            //console.log("No ESI tags exist");
            return Promise.resolve(html);
        }

        //console.log(`tags.length=${tags.length}`);
        tags.forEach(tag => {
            //console.log("TAG=" + tag);
            const placeholder = '<!-- esi-placeholder-' + i + ' -->';

            if(maxDepthReached) {
                html = html.replace(tag, '');
            } else if(tag.includes('<esi:include')) {
                html = html.replace(tag, placeholder);
                subtasks[i] = getIncludeContents(tag, options)
                    .then(result => { 
                        //console.log({debug:'################',result:result});
                        html = html.replace(placeholder, () => result);
                    });
                i++;
            }
        });

        //console.log("subtasks=" + subtasks);
        // in current module, esi:remove are simply removed
        // html = handleESIRemove(html);
        //html = handleESIChoose(html);
        //html = handleESIFunction(html);

        return Promise.all(subtasks)
            .then(() => {
                if(hasESITag(html)) {
                    state.currentDepth++;
                    return processHtmlText(html, options, state);
                }
                //console.log("return html=" + html);
                return html;
            });
    }

    function process(html, options) {
        return processHtmlText.bind({userReq:this.userReq})(html, options);
    }

    function hasESITag(html) {
        return html.match(/<esi:include.*?(?:\/\s*>|<\/esi:include>)/gms)
    }

    function findESIIncludeTags(html) {
        const re = /<esi:include.*?(?:\/\s*>|<\/esi:include>)/gms;
        const tags = [];
        let match;
        while ((match = re.exec(html)) !== null) {
            tags.push(match[0]);
        }
        return tags;
    }

    function handleESIRemove(html) {
        const re = /<esi:remove>([\s\S]*?)<\/esi:remove>/gms;
        return html.replace(re, '');
    }
    function handleESIChoose(html) {
        const re = /<esi:choose>([\s\S]*?)<\/esi:choose>/gms;
        return html.replace(re, '');
    }
    function handleESIFunction(html) {
        const re = /<esi:function>([\s\S]*?)<\/esi:function>/gms;
        return html.replace(re, '');
    }

    function getIncludeContents(tag, options) {
        // const src = getDoubleQuotedSrc(tag) || getSingleQuotedSrc(tag) || getUnquotedSrc(tag);
        // console.log(`ESI:src=${src}`);
        // const alt = getDoubleQuotedAlt(tag) || getSingleQuotedAlt(tag) || getUnquotedAlt(tag);
        // console.log(`ESI:alt=${alt}`);
        let src = options['src'];
        let alt = options['src'];
        //console.log(`${src}, ${alt}`);
        return get([src, alt], options);
    }

    function getBoundedString(open, close) {
        return str => {
            const before = str.indexOf(open);
            let strFragment;
            let after;

            if(before > -1) {
                strFragment = str.substr(before + open.length);
                after = strFragment.indexOf(close);
                return strFragment.substr(0, after);
            }
            return '';
        };
    }

    const getDoubleQuotedName = getBoundedString('name="', '"');
    const getSingleQuotedName = getBoundedString("name='", "'");
    const getUnquotedName = getBoundedString('name=', '>');

    const getDoubleQuotedValue = getBoundedString('value="', '"');
    const getSingleQuotedValue = getBoundedString("value='", "'");
    const getUnquotedValue = getBoundedString('value=', '>');


    const getDoubleQuotedSrc = getBoundedString('src="', '"');
    const getSingleQuotedSrc = getBoundedString("src='", "'");
    const getUnquotedSrc = getBoundedString('src=', '>');

    const getDoubleQuotedAlt = getBoundedString('alt="', '"');
    const getSingleQuotedAlt = getBoundedString("alt='", "'");
    const getUnquotedAlt = getBoundedString('alt=', '>');

    function get([src, alt], options) {
        if (decodeUrl) {
            src = decode(src);
        }
        //console.log("get=" + `${src}, ${alt}, ${options}`);
        src = dataProvider.toFullyQualifiedURL(src, options);
        //console.log("toFullyQualifiedURL=" + src);
        return Promise.resolve()
            .then(() => {
                // if(!allowedHosts.includes(src)) {
                //     const err = new Error(`${src} is not included in allowedHosts or baseUrl.`);
                //     err.blocked = true;
                //     console.log(err);
                //     throw err;
                // }
            })
            .then(() => dataProvider.get(src, options))
            .then(result => {
                if(result.location){
                    var userReq = options['userReq'];
                    userReq.location=result.location;
                    userReq.status=result.status;
                }
                return result.body;
            })
            .catch(error => alt ? get([alt], options) : handleError(src, error));
    }

    function handleError(src, error) {
        logger(error);
        const handlerResult = onError(src, error);

        if (typeof handlerResult === 'string') return handlerResult;
        return '';
    }

    return {process, handleError, logger, findESIIncludeTags};
}

ESI.DataProvider = DataProvider;
ESI.Logger = Logger;

module.exports = ESI;
