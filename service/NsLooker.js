
// const dns = require('dns');
const { Resolver } = require('node:dns');

const dnsLookUp = (host, dns, callback) => {
    try{
        // this will timeout for (1000 * 3 * 2) ms
        process.env.RES_OPTIONS='ndots:3 retrans:1000 retry:3 rotate';
        //console.log(callback);
        const resolver = new Resolver();
        resolver.setServers([dns]);
        resolver.resolve4(host, 'A', (err, addresses) => {
            //console.log("resolve result");
            if(err){
                console.log(err);
                callback('', 9999, err);
            }
            else{
                //console.log(addresses[0]);
                callback(addresses[0], 0, 'ok');
            }
        });
    }catch(err){
        console.log(err);
        callback('', 9999, err);
    }
};

module.exports = {
    dnsLookUp
}

