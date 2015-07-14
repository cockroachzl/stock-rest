/**
 * Created by zhangliang on 6/30/2015.
 */
var expect = require('expect.js'),
    moment = require('moment'),
    mongoskin = require('mongoskin'),
    StockFetcher = require('../StockFetcher.js');

describe.only('', function () {
    //var id;
    var stockSymbols = ['TSLA', 'BABA'];

    var stockFetcher;

    var db = mongoskin.db('mongodb://localhost:27017/stock');

    before(function () {
        stockFetcher = new StockFetcher(db);
    });

    after(function () {
        //shutdown();
    });

    it('fetch stock quotes', function (done) {
        stockFetcher.fetch(stockSymbols, function(quotes) {
            console.log(quotes);
            expect(quotes.length).to.eql(stockSymbols.length);
            done();
        });
    });

    it('test moment', function(){
        var now = moment().utcOffset(-4);
        var current_hour = now.hours();
        var current_minutes = now.minutes();
        console.info('time: ' + current_hour + '/' + current_minutes);
    });

    it('test update', function(done) {
        stockFetcher.update();
        done();
    });

    it('test db', function(done){

        db.collection('stocks').findOne({}, function (e, result) {
                if (e) console.log(e);
                console.log(result.symbols);
                console.log('XXX');
            }
        );
        console.log('???');

        db.collection('stocks').find({}, {limit: 10, sort: [['_id', -1]]})
            .toArray(function (e, results) {
                if (e) console.log(e);
                console.log(results);
            }
        )
        console.log('???');
        db.collectionNames(function(err, items) {
            items.forEach(function(item) {
                console.log(item.name);
            });
        });
        done();
    });
});
