var express = require('express'),
    http = require('http'),
    assert = require('assert'),
    mongoskin = require('mongoskin'),
    bodyParser = require('body-parser'),
    logger = require('morgan'),
    StockFetcher = require('./StockFetcher.js');

var app = express();

app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.use(logger())

var db = mongoskin.db('mongodb://@localhost:27017/stock', {safe: true})
var id = mongoskin.helper.toObjectID

app.param('collectionName', function (req, res, next, collectionName) {
    req.collection = db.collection(collectionName)
    return next()
})

app.get('/', function (req, res, next) {
    res.send('Select a collection, e.g., /collections/messages')
})
app.get('/collections', function (req, res, next) {
    db.collectionNames(function(err, collections){
        if (err) return next(err);
        res.send(collections);
    });
})


app.get('/collections/:collectionName', function (req, res, next) {
    req.collection.find({}, {limit: 10, sort: [['_id', -1]]})
        .toArray(function (e, results) {
            if (e) return next(e)
            res.send(results)
        }
    )
})

app.post('/collections/:collectionName', function (req, res, next) {
    req.collection.insert(req.body, {}, function (e, results) {
        if (e) return next(e)
        res.send(results)
    })
})

app.get('/collections/:collectionName/:id', function (req, res, next) {
    req.collection.findOne({_id: id(req.params.id)}, function (e, result) {
        if (e) return next(e)
        res.send(result)
    })
})

app.put('/collections/:collectionName/:id', function (req, res, next) {
    req.collection.update({_id: id(req.params.id)},
        {$set: req.body},
        {safe: true, multi: false}, function (e, result) {
            if (e) return next(e)
            res.send((result === 1) ? {msg: 'success'} : {msg: 'error'})
        })
})

app.del('/collections/:collectionName/:id', function (req, res, next) {
    req.collection.remove({_id: id(req.params.id)}, function (e, result) {
        if (e) return next(e)
        res.send((result === 1) ? {msg: 'success'} : {msg: 'error'})
    })
})

var stockFetcher = new StockFetcher(db);
setInterval(stockFetcher.updateUsingPromise.bind(stockFetcher, 'stocks', 'intraday_quotes', 'interday_quotes', 'population'), 5000);

app.set('port', process.env.PORT || 3000);
var server = http.createServer(app);
var boot = function () {
    server.listen(app.get('port'), function(){
        console.info('Express server listening on port ' + app.get('port'));
    });
}
var shutdown = function() {
    server.close();
}
if (require.main === module) {
    boot();
} else {
    console.info('Running app as a module')
    exports.boot = boot;
    exports.shutdown = shutdown;
    exports.port = app.get('port');
}

