/* global window: true, navigator: false, document: true, importScripts: false, jQuery: true */
/*!
 * $ PubSub Plugin 1.1
 * https://github.com/KanbanSolutions/jquery-pubsub
 * Requires $ 1.7.2
 *
 * Copyright (c) 2012, Kanban Solutions
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
    "use strict";

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

    _public.subscribe('*', function(topic) {
        if(!console) {
            return;
        }
        var args = Array.prototype.slice.call(arguments, 1);

        if(console.group) {
            console.group('PubSub Super Listner');
            console.debug('Topic: ', topic);
            console.debug('Arguments: ', args);
            console.groupEnd('PubSub Super Listner');
        } else {
            console.log('PubSub Super Listner: ', topic, args);
        }
    });

    $.pubsub = _public;
}(jQuery));
