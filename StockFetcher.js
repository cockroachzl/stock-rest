/**
 * Created by zhangliang on 6/29/2015.
 * Populate stock infos from Yahoo finance and store in the data store.
 * TODO: swtich to authentication token
 * TODO: switch to promise
 */

'use strict';
var http = require('http');
var moment = require('moment');
var assert = require('assert');

//stocks: stock static info: symbols
//intraday_quotes : quotes within the current day
//interday_quotes : historicall quotes
//population: date, populated
function StockFetcher(db) {
    this.db = db;
    this.symbols = [];


    //var insertQuotes = function(collectionName, quotes) {
    //    // Get the documents collection
    //    var collection = db.collection(collectionName);
    //    console.log("insert into " + collectionName);
    //    // Insert some documents
    //    collection.insert(quotes, function(err, result) {
    //        assert.equal(err, null);
    //    });
    //}


    //this.update = function() {
    //    //get stock watch list
    //    var that = this;
    //    this.db.collection('stocks').findOne({}, function (e, result) {
    //            if (e) throw e;
    //            that.symbols = result.symbols;
    //            //insert into intraday db every 5 seconds if the stock market is open
    //            if(StockFetcher.isMarketOpen()) {
    //                that.fetch(that.symbols, insertQuotes.bind(undefined, 'intraday_quotes'));
    //                //that.fetch(that.symbols, insertIntradayQuotes);
    //            }
    //            //insert into daily db if stock market is close and today's close quote is not in the db
    //            else {
    //                var now = moment().utcOffset(-4);
    //                //var date = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()].join('-');
    //                if(now.hours() < 10) { //next early morning
    //                    now.subtract(1, 'days');
    //                }
    //                var date = now.format('YYYY-MM-DD');
    //                var population;
    //                that.db.collection('population').findOne({'date':date}, function (e, result) {
    //                    if (e) throw e;
    //                    population = result;
    //                    if (!population) {
    //                        console.log('fetching and populating interday quotes');
    //                        that.fetch(that.symbols, insertQuotes.bind(undefined, 'interday_quotes'));
    //                        population = {'date': date};
    //                        that.db.collection('population').insert(population, function(err, result) {
    //                            assert.equal(err, null);
    //                        });
    //                    }
    //                    else {
    //                        console.log('already populated ' + population.date);
    //                    }
    //                });
    //            }
    //        }
    //    );
    //
    //}
    /**
     * Main processing function for communicating with Yahoo Finance API
     * @param symbols an array of stock symbols
     * return a list of quotes.
     */
    this.fetch = function (symbols, callback) {
        var query = encodeURIComponent('select * from yahoo.finance.quotes ' +
        'where symbol in (\'' + symbols.join(',') + '\')');
        var urlWithParams = this.BASE + '?' + 'q=' + query + '&format=json&diagnostics=true' + '&env=' +
            encodeURIComponent('store://datatables.org/alltableswithkeys');
        var completeUrl = urlWithParams + '&callback=';
        http.get(completeUrl, function (res) {
            console.log(completeUrl);
            res.setEncoding('utf8');
            var data = '';

            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on('end', function () {
                var obj = JSON.parse(data);
                console.log('Got ' + obj.query.count + ' stocks');
                callback(obj.query.results.quote);
            })

        }).on('error', function (e) {
            console.log("Got error: " + e.message);
        });
    };

}

StockFetcher.prototype.BASE = 'http://query.yahooapis.com/v1/public/yql';

StockFetcher.prototype.insertPromise = function (collectionName, quotes) {
    var that = this;
    var promise = new Promise(function (resolve, reject) {
        var collection = that.db.collection(collectionName);
        console.log("insert into " + collectionName);
        // Insert some documents
        collection.insert(quotes, function (err, results) {
            if (err) {
                reject(err);
            }
            resolve(results);
        });
    });
    return promise;
}

StockFetcher.prototype.findOnePromise = function (collectionName, query) {
    var that = this;
    var promise = new Promise(function (resolve, reject) {
        var collection = that.db.collection(collectionName);
        console.log("find one from " + collectionName);
        collection.findOne(query, function (err, result) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
    return promise;
}

StockFetcher.prototype.updateUsingPromise = function (stocksCollectionName, intradayQuotesCollectionname,
                                                      interdayQuotesCollectionName, populationCollectionName) {
    var that = this;
    var stocksPromise = this.findOnePromise(stocksCollectionName, {}).then(function (value) {
        return value.symbols;
    });
    if (StockFetcher.isMarketOpen()) {
        return stocksPromise.then(this.fetchPromise.bind(this)).then(this.insertPromise.bind(this, intradayQuotesCollectionname));
    }
    else {
        var now = moment().utcOffset(-4);
        //var date = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()].join('-');
        if (now.hours() < 10) { //next early morning
            now.subtract(1, 'days');
        }
        var date = now.format('YYYY-MM-DD');
        var populationPromise = this.findOnePromise(populationCollectionName, {'date': date});

        return populationPromise.then(function (value) {
            if (!value) {
                console.log('fetching and populating interday quotes');
                return stocksPromise
                    .then(that.fetchPromise.bind(that))
                    .then(that.insertPromise.bind(that, interdayQuotesCollectionName))
                    .then(function (value) {
                        var population = {'date': date};
                        return that.insertPromise(populationCollectionName, population);
                    })
                    .catch(console.log);
            }
            else {
                console.log('already populated ' + value.date);
            }
        })
    }
}

/**
 * Main processing function for communicating with Yahoo Finance API
 * @param symbols an array of stock symbols
 * return a promise of a list of quotes.
 */
StockFetcher.prototype.fetchPromise = function (symbols) {
    var query = encodeURIComponent('select * from yahoo.finance.quotes ' +
    'where symbol in (\'' + symbols.join(',') + '\')');
    var urlWithParams = this.BASE + '?' + 'q=' + query + '&format=json&diagnostics=true' + '&env=' +
        encodeURIComponent('store://datatables.org/alltableswithkeys');
    var completeUrl = urlWithParams + '&callback=';

    var promise = new Promise(function (resolve, reject) {
        http.get(completeUrl, function (res) {
            console.log(completeUrl);
            res.setEncoding('utf8');
            var data = '';

            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on('end', function () {
                try {
                    var obj = JSON.parse(data);
                    console.log('Got ' + obj.query.count + ' stocks');
                    resolve(obj.query.results.quote);
                } catch (e) {
                    reject(e);
                }
            })

        }).on('error', function (e) {
            reject(e);
        });
    });
    return promise;
};

StockFetcher.isMarketOpen = function (now) {
    var now = now ? now : moment().utcOffset(-4);
    var current_hour = now.hours();
    var current_minutes = current_hour * 60 + now.minutes();
    var marketOpen = 9 * 60 + 30;
    var marketClose = 16 * 60;
    if (current_minutes >= marketOpen && current_minutes <= marketClose) {
        return true;
    }
    else {
        return false;
    }
}


module.exports = StockFetcher;
