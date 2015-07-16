/**
 * Created by zhangliang on 7/15/2015.
 */
var assert = require('assert');
var chai = require('chai')
    , expect = chai.expect
    , should = chai.should();
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe('test promise', function () {

    it('Promise.resolve', function () {
        return Promise.resolve(100).then(function (value) {
            console.log('Promise resolve callback with ' + value);
            assert.equal(100, value);
            return value;
        }, function (reason) {
            console.log('Promise reject callback with' + reason);
            assert.fail();
        }).should.eventually.equal(100);;
    });

    it('Promise.reject', function (done) {
        var q = Promise.reject(400).then(function (value) {
            console.log('Promise resolve callback with ' + value);
            assert.fail();
            done();
        }, function (reason) {
            console.log('Promise reject callback with ' + reason);
            assert.equal(400, reason);
            done();
        });
    });

});


