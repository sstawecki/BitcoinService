var CreateBitcoinService = function () {

    var Service = {};

    var is_started = false;

    /**
     * To check service status
     */
    Service.isStarted = function () {
        return is_started;
    };

    /**
     * Bitcoin price stream
     */
    var bitcoin_stream = new Rx.Subject();

    /**
     * To dispose stream's observers
     */
    var disposables = [];

    /**
     * Used by mapAverage
     */
    Service.history = [];

    /**
     * Scheduler's interval
     */
    Service.scheduler_interval = 3000;

    /**
     * Custom display functions
     */
    Service.displayBitcoinPrice = function(data) {
        console.log('Bitcoin price: ' + JSON.stringify(data));
    };

    Service.displayBitcoinAveragePrice = function(data) {
        console.log('Bitcoin Average price: ' + JSON.stringify(data));
    };

    /**
     * Checks the bitcoin value and pushes it to the bitcoin stream once the value is ready.
     * @returns void
     */
    var checkBitcoinValue = function () {
        console.log('Getting bictoin value');
        var promise = $.get('https://api.bitcoinaverage.com/ticker/global/USD/').promise();
        Rx.Observable.fromPromise(promise).subscribe(
            function (data) {
                console.log('Sending data to the bitcoin stream');
                bitcoin_stream.onNext(data);
            },
            function (err) {
                console.log('Ajax error');
            }
        );
    };

    /**
     * Start service
     */
    Service.start = function () {
        if (is_started) {
            console.log('Service already started');
            return false;
        }
        var scheduler = Rx.Scheduler.default.schedulePeriodic(0,Service.scheduler_interval,checkBitcoinValue);
        disposables.push(scheduler);

        //-----------------------------------------------
        var aux = bitcoin_stream.map(function (data) {
            return {"ask":data.ask,"bid":data.bid};
        }).subscribe(function (data) {
            Service.history.push(data);
            //Bitcoin price is ready to be displayed.
            Service.displayBitcoinPrice(data);
            //----------------------------------

            //Average from ask
            var source_avg_ask =
                Rx.Observable.from(Service.history).takeLast(5).average(function(data){
                    return data.ask;
                });

            //Average from bid
            var source_avg_bid =
                Rx.Observable.from(Service.history).takeLast(5).average(function(data){
                    return data.bid;
                });

            //Merging ask+bid average streams
            var source_avg = Rx.Observable.zip(source_avg_ask,source_avg_bid,function(ask,bid){
                return {"ask":ask,"bid":bid};
            }).subscribe(function(data){
                //Average price is ready to be displayed.
                Service.displayBitcoinAveragePrice(data);
                //----------------------------------
            });

        });
        disposables.push(aux);

        //-----------------------------------------------

        is_started = true;
        return true;
    };

    /**
     * Stop service
     */
    Service.stop = function () {
        if (!is_started) {
            return false;
        }

        //Disposes observers
        Rx.Observable.from(disposables).subscribe(function(d){
            d.dispose();
        },function(e){},function(){
            disposables = [];
            console.log('Service stopped');
            is_started = false;
        });
        return true;
    };

    return Service;
};