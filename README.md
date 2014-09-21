jquery-pubsub
=============

[![Build Status](https://travis-ci.org/Digitalxero/jquery-pubsub.svg?branch=master)](https://travis-ci.org/Digitalxero/jquery-pubsub) [![Coverage Status](https://img.shields.io/coveralls/Digitalxero/jquery-pubsub.svg)](https://coveralls.io/r/Digitalxero/jquery-pubsub?branch=master)

Implementation of pubsub that allows for hierarchical categorical publish and subscribe categories are . separated.
all subscriptions to `base` or `base.item` or `base.item.action` would get messages published to `base.item.action` but subscriptions to `base.item.action` would not get messages published to `base.item`

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
