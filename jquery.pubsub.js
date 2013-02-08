/*
    Implementation of pubsub that allows for hierarchical categorical publish and subscribe
    categories are . seperated
        all subscriptions to `c49` or `c49.filter` or `c49.filter.change` would get messages published to `c49.filter.change`
        but subscriptions to `c49.filter.change` would not get messages published to `c49.filter`

        the first paramater sent to listeners is the full topic, so listeners can do their own filtering if they subscribe to a more general topic
        You can (un)subscribe to multiple topics by seperating them by spaces, this does limit it to events with no spaces in their names though
            You can publish to multiple topics the same way, just remember that the system automatically publishes to the less specific topics

    jQuery.pubsub.subscribe('c49.filter.change', function(topic, msg){console.log(topic, ': ', msg)});
    jQuery.pubsub.publish('c49.filter.change', {"action":"add", "filter":{"value":1,"label":"The price filter"}});
    jQuery.pubsub.subscribe('c49.filter.change c49.facet.results', function(topic, msg){console.log(topic, ': ', msg)});

*/
// requestAnimFrame shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function( callback ){
            window.setTimeout(callback, 42); //This is 24 frames per sec, if Film works here so will web animations
          };
})();

(function($){
    var _public = {};
    var _private = {};

    _private.topics = {'*':$.Callbacks('unique memory')};


    _public.publish = function publish(topics) {
        var args = [].slice.call(arguments);
        args.unshift(window);
        _public.publishWith.apply(this, args);
    };

    _public.publishWith = function publishWith(context, topics) {
        var i,tlen,topic_arr,topic, msg;

        msg = [].slice.call(arguments);
        msg.shift(); //remove the context from the msg
        msg.shift(); //remove the topic from the msg

        topics = _private.parse_topics(topics);
        tlen = topics.length;

        for(i=0; i<tlen; i++) {
            topic_arr = topics[i].split('.');

            while(topic_arr.length) {
                topic = topic_arr.join('.');
                topic_arr.pop();

                if(!_private.topics[topic]) {
                    //This eliminates race condition issues where something may publish before someone subscribes
                    _private.topics[topic] = $.Callbacks('unique memory');
                }

                _private.publish(context, topic, topics[i], msg);
            }

            _private.publish(context, '*', topics[i], msg);
        }
    };

    _public.subscribe = function subscribe(topics, cb) {
        if(!$.isFunction(cb)) {
            console.error('You must subscribe with a function', arguments);
        }

        var i,tlen,topic;

        topics = _private.parse_topics(topics);
        tlen = topics.length;

        for(i=0; i<tlen; i++) {
            topic = topics[i];
            if(!_private.topics[topic]) {
                _private.topics[topic] = $.Callbacks('unique memory');
            }

            _private.topics[topic].add(cb);
        }
    };

    _public.unsubscribe = function unsubscribe(topics, cb) {
        if(!$.isFunction(cb)) {
            console.error('You must unsubscribe with a function')
        }

        var i,tlen,topic;

        topics = _private.parse_topics(topics);
        tlen = topics.length;

        for(i=0; i<tlen; i++) {
            topic = topics[i];
            if(_private.topics[topic]) {
                _private.topics[topic].remove(cb);
            }
        }
    };

    _private.parse_topics = function parse_topics(topic_string) {
        return topic_string.split(' ');
    };

    _private.publish = function publish(context, topic, full_topic, msg) {
        msg = msg.slice();
        if(_private.topics[topic] && full_topic) {
            msg.unshift(full_topic);
            window.requestAnimFrame(function(){
                _private.topics[topic].fireWith(context, msg);
            });
        }
    };

    _public.subscribe('*', function(topic, msg) {
        console.log('PubSub Super Listner: ', topic, msg);
    });

    $.pubsub = _public;
}(jQuery));
