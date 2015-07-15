/**
 * Created by zhangliang on 6/29/2015.
 * Populate stock infos from Yahoo finance and store in the data store.
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

    this.isMarketOpen = function () {
        var now = moment().utcOffset(-4);
        var current_hour = now.hours();
        var current_minutes = current_hour * 60 + now.minutes();
        var marketOpen = 9 * 60 + 30;
        var marketClose = 16 * 60 + 30;
        if (current_minutes >= marketOpen && current_minutes <= marketClose) {
            return true;
        }
    }

    var insertQuotes = function(collectionName, quotes) {
        // Get the documents collection
        var collection = db.collection(collectionName);
        console.log("insert into " + collectionName);
        // Insert some documents
        collection.insert(quotes, function(err, result) {
            assert.equal(err, null);
        });
    }

    var insertIntradayQuotes = function(quotes) {
        var collectionName = 'intraday_quotes';
        // Get the documents collection
        var collection = db.collection(collectionName);
        console.log("insert into " + collectionName);
        // Insert some documents
        collection.insert(quotes, function(err, result) {
            assert.equal(err, null);
        });
    }

    this.update = function() {
        //get stock watch list
        var that = this;
        this.db.collection('stocks').findOne({}, function (e, result) {
                if (e) throw e;
                that.symbols = result.symbols;
                //insert into intraday db every 5 seconds if the stock market is open
                if(that.isMarketOpen()) {
                    that.fetch(that.symbols, insertQuotes.bind(undefined, 'intraday_quotes'));
                    //that.fetch(that.symbols, insertIntradayQuotes);
                }
                //insert into daily db if stock market is close and today's close quote is not in the db
                else {
                    var now = moment().utcOffset(-4);
                    //var date = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()].join('-');
                    if(now.hours() < 10) { //next early morning
                        now.subtract(1, 'days');
                    }
                    var date = now.format('YYYY-MM-DD');
                    var population;
                    that.db.collection('population').findOne({'date':date}, function (e, result) {
                        if (e) throw e;
                        population = result;
                        if (!population) {
                            console.log('fetching and populating interday quotes');
                            that.fetch(that.symbols, insertQuotes.bind(undefined, 'interday_quotes'));
                            population = {'date': date};
                            that.db.collection('population').insert(population, function(err, result) {
                                assert.equal(err, null);
                            });
                        }
                        else {
                            console.log('already populated ' + population.date);
                        }
                    });
                }
            }
        );

    }
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
        http.get(completeUrl, function(res) {
            console.log(completeUrl);
            res.setEncoding('utf8');
            var data = '';

            res.on('data', function (chunk){
                data += chunk;
            });

            res.on('end',function(){
                var obj = JSON.parse(data);
                console.log('Got ' + obj.query.count + ' stocks');
                callback(obj.query.results.quote);
            })

        }).on('error', function(e) {
            console.log("Got error: " + e.message);
        });
    };

}

StockFetcher.prototype.BASE = 'http://query.yahooapis.com/v1/public/yql';

module.exports = StockFetcher;
