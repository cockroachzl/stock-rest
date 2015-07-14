/**
 * Created by zhangliang on 6/30/2015.
 */
var expect = require('expect.js'),
    stockFetcher = require('../StockFetcher.js')();

describe('', function () {
    //var id;
    var stockSymbols = ['TSLA', 'BABA'];

    before(function () {
        //boot();
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
});
