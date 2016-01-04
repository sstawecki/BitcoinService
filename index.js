var domready = Rx.Observable.fromPromise($(document).ready().promise());
var s;
domready.subscribe(function(d){
    console.log('domready');
    s = CreateBitcoinService();
    //Overriding functions
    s.displayBitcoinPrice = function (data) {
        console.log('Bitcoin price: ' + JSON.stringify(data));
        $('#bc_price_ask').html(data.ask.toFixed(3));
        $('#bc_price_bid').html(data.bid.toFixed(3));
        $('#history').append(JSON.stringify(data) + ' - ');
    };
    s.displayBitcoinAveragePrice = function (data) {
        console.log('Average price: ' + JSON.stringify(data));
        $('#bc_average_ask').html(data.ask.toFixed(3));
        $('#bc_average_bid').html(data.bid.toFixed(3));
    };
    //--------------------

    var service_btn = $('#service');
    var btn_click_source = Rx.Observable.fromEvent(service_btn,'click');


    btn_click_source.subscribe(function(d){
        var aux;
        if (s.isStarted()) {
            aux = s.stop();
            if (aux) {
                service_btn.val('Start service');
            }
        } else {
            aux = s.start();
            if (aux) {
                service_btn.val('Stop service');
            }
        }
    });
});
