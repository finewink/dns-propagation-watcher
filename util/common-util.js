const getCountryCode = (requestPath) => {
    var indexSecondSlash = requestPath.indexOf("/", 1);
    if(indexSecondSlash >= 0){
        var countryCode = requestPath.substring(0, requestPath.indexOf("/", 1));
        return countryCode;
        // res.writeHead(302, {"Location":`${countryCode}/500.html`});
        // res.end();
    }
    else{
        return null;
    }
}


module.exports = {
    getCountryCode
}