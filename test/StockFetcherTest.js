/**
 * Created by zhangliang on 6/30/2015.
 */
var chai = require("chai"),
    expect = chai.expect,
    chaiAsPromised = require("chai-as-promised"),
    moment = require('moment'),
    mongoskin = require('mongoskin'),
    StockFetcher = require('../StockFetcher.js');

chai.use(chaiAsPromised);

describe('test StockFetcher', function () {
    //var id;
    var stockSymbols = ['TSLA', 'BABA'];

    var stockFetcher;

    var db = mongoskin.db('mongodb://localhost:27017/stock');
    console.log("make a db connection");

    before(function setup() {
        stockFetcher = new StockFetcher(db);
    });

    after(function () {

    });

    it.skip('fetch stock quotes', function (done) {
        stockFetcher.fetch(stockSymbols, function (quotes) {
            console.log(quotes);
            expect(quotes.length).to.eql(stockSymbols.length);
            done();
        });
    });

    it('test moment', function () {
        var now = moment().utcOffset(-4);
        var current_hour = now.hours();
        var current_minutes = now.minutes();
        console.info('time: ' + current_hour + '/' + current_minutes);
    });

    it.skip('test update', function (done) {
        stockFetcher.update();
        done();
    });

    it('test db find', function (done) {

        db.collection('stocks').findOne({}, function (e, result) {
                if (e) console.log(e);
                console.log(result.symbols);
                done();
            }
        );

    });

    it('test isMarketOpen', function () {
        expect(StockFetcher.isMarketOpen()).to.be.false;
    });

    it('test insert quote promise', function () {
        var quotes = [{symbol: 'TSLA', price: 300}];
        return expect(stockFetcher.insertQuotesPromise("test_quotes", quotes)).to.eventually.equal(quotes);
    });
});
