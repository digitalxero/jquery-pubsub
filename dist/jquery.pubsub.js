/*!
 * $ PubSub Plugin 1.1
 * https://github.com/Digitalxero/jquery-pubsub
 * Requires $ 1.7.2
 *
 * Copyright (c) 2012, Digitalxero LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions
 * of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

/*
Implementation of pubsub that allows for hierarchical categorical publish and subscribe categories are . separated.
all subscriptions to `base` or `base.item` or `base.item.action` would get messages published to `base.item.action` but
subscriptions to `base.item.action` would not get messages published to `base.item`

The first parameter sent to listeners is the full topic, so listeners can do their own filtering if they subscribe to a more general topic
You can (un)subscribe to multiple topics by separating them by spaces, this does limit it to events with no spaces in their names though
You can publish to multiple topics the same way, just remember that the system automatically publishes to the less specific topics

    jQuery.pubsub.subscribe('c49.filter.change', function(topic, msg){
        //Do something on filter change
    });

    jQuery.pubsub.publish('c49.filter.change', {
        "action":"add",
        "filter":{"value":1,"label":"The price filter"}
    });

    jQuery.pubsub.subscribe('c49', function(topic, msg){
        //c49 Super Listener to log all messages
        console.log(topic, ': ', msg);
    });

    jQuery.pubsub.subscribe('*', function(topic, msg){
        //Global Super Listener to log all messages regardless of topic
        console.log(topic, ': ', msg);
    });

*/

/**
 * requestAnimFrame shim layer with setTimeout fallback
 */
(function () {
    "use strict";
    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame       ||
               window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame    ||
               window.oRequestAnimationFrame      ||
               window.msRequestAnimationFrame     ||
               function (callback) {
                   //This is 24 frames per sec, if Film works here so will web animations
                   window.setTimeout(callback, 42);
               };
    }());
}());



/**
 * jQuery PubSub
 */
(function ($) {
    "use strict";

    var _public,
        _private;


    // Scope objects
    _public = {};
    _private = {};


    // Defaults
    _public.debug = false;


    // Topic cache
    _private.topics = {
        '*': $.Callbacks('unique memory')
    };



    /**
     * Publish topics and pass all additional arguments
     * @public
     * @param {String} topics Topic(s) to publish
     */
    _public.publish = function publish(topics) {
        var args;

        args = [].slice.call(arguments);
        args.unshift(window);

        _public.publishWith.apply(this, args);
    };



    /**
     * Publish topics with specified context
     * @public
     * @param {Object} context Context to be used for `this` in callbacks
     * @param {String} topics Topic(s) to publish
     */
    _public.publishWith = function publishWith(context, topics) {
        var i,
            tlen,
            topic_arr,
            topic,
            msg;

        msg = Array.prototype.slice.call(arguments);
        msg.shift(); //remove the context from the msg
        msg.shift(); //remove the topic from the msg

        topics = _private.parse_topics(topics);
        tlen = topics.length;

        for (i = 0; i < tlen; i++) {
            topic_arr = topics[i].split('.');

            while (topic_arr.length) {
                topic = topic_arr.join('.');
                topic_arr.pop();

                if (!_private.topics[topic]) {
                    //This eliminates race condition issues where something may publish before someone subscribes
                    _private.topics[topic] = $.Callbacks('unique memory');
                }

                _private.publish(context, topic, topics[i], msg);
            }

            _private.publish(context, '*', topics[i], msg);
        }
    };



    /**
     * Subscribe for callback when a topic is published
     * @public
     * @param {String} topics Topic(s) to subscribe to
     * @param {Function} cb Callback function
     */
    _public.subscribe = function subscribe(topics, cb) {
        var i,
            tlen,
            topic;

        if (!$.isFunction(cb)) {
            console.error('You must subscribe with a function', [topics, cb]);
        }

        topics = _private.parse_topics(topics);
        tlen = topics.length;

        for (i = 0; i < tlen; i++) {
            topic = topics[i];
            if (!_private.topics[topic]) {
                _private.topics[topic] = $.Callbacks('unique memory');
            }

            _private.topics[topic].add(cb);
        }
    };



    /**
     * Unsubscribe from callback when a topic is published
     * @public
     * @param {String} topics Topic(s) to subscribe to
     * @param {Function} cb Callback function
     */
    _public.unsubscribe = function unsubscribe(topics, cb) {
        var i,
            tlen,
            topic;

        if (!$.isFunction(cb)) {
            console.error('You must unsubscribe with a function');
        }

        topics = _private.parse_topics(topics);
        tlen = topics.length;

        for (i = 0; i < tlen; i++) {
            topic = topics[i];
            if (_private.topics[topic]) {
                _private.topics[topic].remove(cb);
            }
        }
    };



    /**
     * Clear all callbacks for a topic
     * @public
     * @param {String} topics Topic to clear
     */
    _public.clear = function clear(topic) {
        _private.topics[topic] = $.Callbacks('unique memory');
    };



    /**
     * Call clear on all stored topics
     * @public
     */
    _public.purge = function purge() {
        var topic;

        for (topic in _private.topics) {
            if (_private.topics.hasOwnProperty(topic)) {
                _public.clear(topic);
            }
        }
    };



    /**
     * Parse space-deliniated topics
     * @private
     * @param {String} topic_string Topic(s) separated by spaces
     * @returns List of individual topics
     * @type Array
     */
    _private.parse_topics = function parse_topics(topic_string) {
        return topic_string.split(' ');
    };



    /**
     * Execute callback for published topic
     * @private
     * @param {Object} context Context used for `this` in callback
     * @param {String} topic Current topic with a registered callback
     * @param {String} full_topic Current topic being published
     * @param {Array} msg Data to be passed to callback function
     */
    _private.publish = function publish(context, topic, full_topic, msg) {
        msg = msg.slice();
        if (_private.topics[topic] && full_topic) {
            msg.unshift(full_topic);
            window.requestAnimFrame(function () {
                _private.topics[topic].fireWith(context, msg);
            });
        }
    };



    // Subscribe to all topics for debug logging
    _public.subscribe('*', function (topic) {
        var args;

        // return if console is not defined
        if (!window.console) {
            return;
        }

        // return if not in debug mode
        if (!_public.debug) {
            return;
        }

        // Get arguments passed to the callback
        args = Array.prototype.slice.call(arguments, 1);

        // Use group logging if available
        if (console.group) {
            console.group('PubSub Super Listner');
            console.debug('Topic: ', topic);
            console.debug('Arguments: ', args);
            console.groupEnd('PubSub Super Listner');
        } else {
            console.log('PubSub Super Listner: ', topic, args);
        }
    });


    // Expose private scope for unit tests
    if (window.__karma__) {
        _public._ = _private;
    }


    // Expose scope on jQuery object
    $.pubsub = _public;

}(window.jQuery));
