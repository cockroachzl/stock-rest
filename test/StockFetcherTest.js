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

describe.only('test StockFetcher', function () {
    //var id;
    var stockSymbols = ['TSLA', 'BABA'];

    var quotes = [{symbol: 'TSLA', price: 300}];

    var stockFetcher;

    var db = mongoskin.db('mongodb://localhost:27017/stock');
    console.log("make a db connection");

    beforeEach(function setup() {
        stockFetcher = new StockFetcher(db);
    });

    it.skip('fetch stock quotes', function (done) {
        stockFetcher.fetch(stockSymbols, function (quotes) {
            console.log(quotes);
            expect(quotes.length).to.eql(stockSymbols.length);
            done();
        });
    });

    it.skip('fetch stock quotes promise', function(done) {
        //return expect(stockFetcher.fetchPromise(stockSymbols)).to.eventually.have.length(stockSymbols.length);

        stockFetcher.fetchPromise(stockSymbols).then(function(value) {
            console.log(value);
            expect(value).to.have.length(stockSymbols.length);
            done();
        }, function(reason) {
            expect.fail();
            done();
        });
    });

    it('test moment', function () {
        var now = moment().utcOffset(-4);
        var current_hour = now.hours();
        var current_minutes = now.minutes();
        console.info('time: ' + current_hour + '/' + current_minutes);
    });

    it('test db find', function (done) {

        db.collection('stocks').findOne({}, function (e, result) {
                if (e) console.log(e);
                console.log(result.symbols);
                done();
            }
        );

    });

    it.skip('test find one promise', function(){
        expect(stockFetcher.findOnePromise('test_quotes', {})).to.eventually.equal(quotes);
    });



    it.skip('test isMarketOpen', function () {
        expect(StockFetcher.isMarketOpen()).to.be.false;
    });

    it.only('test update using promise', function (done) {
        stockFetcher.updateUsingPromise('stocks', 'TestIntradayQuotes', 'TestInterdayQuotes', 'TestPopulation').then(
            function (value) {
                console.log('Log quotes');
                console.log(value);
                done();
            },
            function (reason) {
                expect.fail();
                done();
            });
    });

    it.skip('test insert quote promise', function () {

        return expect(stockFetcher.insertPromise("test_quotes", quotes)).to.eventually.equal(quotes);
    });
});
