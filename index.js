const express = require('express');
//const http = require('http');
//const bodyParser = require("body-parser");

//const ejs = require('ejs');
const util = require('util');
const path = require('path');
const http = require('http');

const app = express();

const router = express.Router();


app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


const rootRouter = require("./router/root");
const detailRouter = require("./router/detail");
const lookerRouter = require("./router/looker");
const batchRouter = require("./router/batch");
const commonRouter = require('./router/common');

app.use("/", rootRouter)
app.use("/detail", detailRouter);
app.use("/looker", lookerRouter);
app.use("/batch", batchRouter);
app.use("/common", commonRouter);

app.set('port', process.env.PORT || 3000);
app.use(express.json);
app.use(express.urlencoded({ extended: true}));

console.log('App start');
  
http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
  
module.exports = router;
  