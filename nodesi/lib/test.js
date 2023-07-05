const DataProvider = require('./data-provider');

const dataProvider = new DataProvider({});
console.log(dataProvider.get('https://esi-proxy.kia.com/it/mykia'));