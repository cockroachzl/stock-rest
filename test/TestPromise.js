/**
 * Created by liazhang on 7/16/2015.
 */
var promise = new Promise(function(resolve, reject){
    console.log('resolving');
    resolve(100);
});

Promise.resolve().then(function(value){
    console.log("got " + value);
});

Promise.resolve('foo').then(Promise.resolve('bar')).then(function (result) {
    console.log(result);
});

Promise.resolve('foo').then(null).then(function (result) {
    console.log(result);
});