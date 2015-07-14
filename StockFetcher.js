/**
 * Created by zhangliang on 6/29/2015.
 * Populate stock infos from Yahoo finance and store in the data store.
 */

'use strict';
var http = require('http');

//stocks: stock static info
//intraday_quotes : quotes within the current day
//interday_quotes : historicall quotes
//population: date, populated
function StockFetcher(db) {
    this.db = db;
    this.symbols = [];

    this.isMarketOpen = function () {
        var now = new Date();
        var current_hour = now.getHours();
        var current_minutes = current_hour * 60 + now.getMinutes();
        var marketOpen = 9 * 60 + 30;
        var marketClose = 16 * 60 + 30;
        if (current_minutes >= marketOpen && current_minutes <= marketClose) {
            return true;
        }
    }

    var insertQuotes = function(collectionName, quotes) {
        // Get the documents collection
        var collection = db.collection(collectionName);
        // Insert some documents
        collection.insert(quotes, function(err, result) {
            assert.equal(err, null);
        });
    }

    this.update = function(db) {
        //get stock watch list
        db.collection('stocks').find()
            .toArray(function (e, results) {
                if (e) throw e;
                this.symbols = results;
            }
        )
        //insert into intraday db every 5 seconds if the stock market is open
        if(isMarketOpen()) {
            this.fetch(this.symbols, insertQuotes.bind('intraday_quotes'));
        }
        //insert into daily db if stock market is close and today's close quote is not in the db
        else {
            var now = new Date();
            var date = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()].join('-');
            var population;
            db.collection('population').findOne({'date':date}, function (e, result) {
                if (e) throw e;
                population = result;
            });
            if (population == null) {
                this.fetch(this.symbols, insertQuotes.bind('interday_quotes'));
                population = {'date': date};
                db.collection('population').insert(population, null);
            }
        }
    }
    /**
     * Main processing function for communicating with Yahoo Finance API
     * @param symbols an array of stock symbols
     * return a list of quotes.
     */
    this.fetch = function (symbols, callback) {
        var query = encodeURIComponent('select * from yahoo.finance.quotes ' +
        'where symbol in (\'' + symbols.join(',') + '\')');
        var urlWithParams = BASE + '?' + 'q=' + query + '&format=json&diagnostics=true' + '&env=' +
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
