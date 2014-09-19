/*jslint vars: true*/
/*global jasmine, beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit */
(function () {
    "use strict";


    /**
     * Test requestAnimationFrame shim
     */
    describe("Shim for requestAnimationFrame", function () {
        it("should create a function on the window object", function () {
            expect(typeof window.requestAnimFrame).toBe('function');
        });

        it("should fire a callback", function (done) {
            window.requestAnimFrame(function () {
                done();
            });
        });
    });



    /**
     * Test jQuery PubSub
     */
    describe("jQuery PubSub", function () {

        describe('Required libraries', function () {
            it('Should find jQuery in scope', function () {
                expect(window.jQuery).toBeDefined();
            });
        });


        /**
         * Private scope
         */
        describe('Private', function () {

            it('Private scope should be testable', function () {
                expect(typeof jQuery.pubsub._).toBe('object');
            });


            describe('Topics', function () {
                it('should store topics on a private object', function () {
                    expect(typeof jQuery.pubsub._.topics).toBe('object');
                });

                it('should contain a default `*` topic pointing to a Callbacks object', function () {
                    expect(typeof jQuery.pubsub._.topics['*']).toBe('object');
                    expect(JSON.stringify(Object.keys(jQuery.pubsub._.topics['*']))).toBe(JSON.stringify(Object.keys(jQuery.Callbacks())));
                });
            });


            describe('parse_topics()', function () {
                it('should provide a method to parse topics from a string', function () {
                    expect(typeof jQuery.pubsub._.parse_topics).toBe('function');
                });

                it('it should split a space-separated string into an array of topics', function () {
                    expect(jQuery.pubsub._.parse_topics('one')).toEqual(['one']);
                    expect(jQuery.pubsub._.parse_topics('one two three four')).toEqual(['one', 'two', 'three', 'four']);
                });
            });


            // Private publish method
            describe('publish()', function () {
                it('should provide a private publish() method', function () {
                    expect(typeof jQuery.pubsub._.publish).toBe('function');
                });

                it('should expect 4 named parameters', function () {
                    expect(jQuery.pubsub._.publish.length).toBe(4);
                });

                it('should execute a callback stored in the private topics object', function (done) {
                    var topics = jQuery.pubsub._.topics;
                    var testData = ['Hello World', { 'one': 1 }];
                    var testTopic = 'test-private-publish';
                    var testFullTopic = 'some.test.topic';
                    var callbacks = topics[testTopic] = jQuery.Callbacks();

                    callbacks.add(function (topic, data) {
                        expect(this.foo).toBe('bar');
                        expect(topic).toBe(testFullTopic);
                        expect(data).toEqual(testData);

                        delete jQuery.pubsub._.topics[testTopic];
                        expect(topics[testTopic]).toBeUndefined();

                        done();
                    });

                    jQuery.pubsub._.publish({'foo': 'bar'}, testTopic, testFullTopic, [ testData ]);
                });
            });

        });
        // end: private scope



        /**
         * Public scope
         */
        describe('Public API', function () {

            describe('publish()', function () {
                it('should have a publish() method', function () {
                    expect(typeof jQuery.pubsub.publish).toBe('function');
                });

                it('should trigger callbacks for a topic', function (done) {
                    var topics = jQuery.pubsub._.topics;
                    var testTopic = 'test-public-publish';
                    var testData = ['Hello World', { 'one': 1 }];
                    var callbacks = topics[testTopic] = jQuery.Callbacks();

                    callbacks.add(function (topic, data) {
                        expect(topic).toBe(testTopic);
                        expect(data).toEqual(testData);

                        jQuery.pubsub.clear(testTopic);
                        expect(topics[testTopic].has()).toBe(false);

                        done();
                    });

                    jQuery.pubsub.publish(testTopic, testData);
                });
            });


            describe('publishWith()', function () {

                it('should have a publishWith() method', function () {
                    expect(typeof jQuery.pubsub.publishWith).toBe('function');
                });

                it('should execute namespaced topics', function (done) {
                    var topics = jQuery.pubsub._.topics;
                    var count = 0;

                    var ns = 'test-publish-with';
                    var testTopic = [ns + '.one', ns + '.two'];

                    function callback(topic) {
                        count++;

                        if (count === 5) {
                            jQuery.pubsub.clear(topics[ns]);
                            jQuery.pubsub.clear(topics[testTopic[0]]);
                            jQuery.pubsub.clear(topics[testTopic[1]]);

                            done();
                        }
                    }

                    jQuery.pubsub.subscribe(ns, callback);
                    jQuery.pubsub.subscribe(testTopic[0], callback);
                    jQuery.pubsub.subscribe(testTopic[1], callback);
                    jQuery.pubsub.subscribe('*', callback);

                    jQuery.pubsub.publishWith(window, testTopic.join(' '));
                });

                it('creates a new Callbacks object for topic(s) not found', function () {
                    expect(jQuery.pubsub._.topics['unknown-topic']).toBeUndefined();
                    jQuery.pubsub.publishWith(window, 'unknown-topic');
                    expect(typeof jQuery.pubsub._.topics['unknown-topic']).toBe('object');
                    expect(typeof jQuery.pubsub._.topics['unknown-topic'].fireWith).toBe('function');
                });
            });


            describe('subscribe()', function () {
                it('should have a subscribe() method', function () {
                    expect(typeof jQuery.pubsub.subscribe).toBe('function');
                });

                it('should log an error when missing required callback', function () {
                    spyOn(window.console, 'error');
                    jQuery.pubsub.subscribe('foo');
                    expect(window.console.error).toHaveBeenCalled();
                });

                it('should register a callback for a topic', function (done) {
                    var topics = jQuery.pubsub._.topics;
                    var testTopic = 'test-subscribe';
                    var testData = ['Hello World', { 'one': 1 }];

                    function callback(topic, data) {
                        expect(topic).toBe(testTopic);
                        expect(data).toEqual(testData);

                        delete topics[testTopic];
                        expect(topics[testTopic]).toBeUndefined();

                        done();
                    }

                    expect(topics[testTopic]).toBeUndefined();

                    jQuery.pubsub.subscribe(testTopic, callback);
                    expect(topics[testTopic].has()).toBe(true);

                    jQuery.pubsub.publish(testTopic, testData);
                });

                it('should register a callback for a multiple topics', function (done) {
                    var topics = jQuery.pubsub._.topics;
                    var idx = 0;
                    var testTopic = ['test-subscribe-1', 'test-subscribe-2'];
                    var testData = ['Hello World', { 'one': 1 }];

                    var callback = function (topic, data) {
                        expect(topic).toBe(testTopic[idx]);
                        expect(data).toEqual(testData[idx]);

                        delete topics[testTopic[idx]];
                        expect(topics[testTopic[idx]]).toBeUndefined();

                        if (idx < 1) {
                            idx++;
                        } else {
                            done();
                        }
                    };

                    expect(topics[testTopic[0]]).toBeUndefined();
                    expect(topics[testTopic[1]]).toBeUndefined();

                    jQuery.pubsub.subscribe(testTopic.join(' '), callback);

                    expect(topics[testTopic[0]].has()).toBe(true);
                    expect(topics[testTopic[1]].has()).toBe(true);

                    jQuery.pubsub.publish(testTopic[0], testData[0]);
                    jQuery.pubsub.publish(testTopic[1], testData[1]);
                });
            });


            describe('unsubscribe()', function () {
                it('should have an unsubscribe() method', function () {
                    expect(typeof jQuery.pubsub.unsubscribe).toBe('function');
                });

                it('should log an error when missing required callback', function () {
                    spyOn(window.console, 'error');
                    jQuery.pubsub.unsubscribe('foo');
                    expect(window.console.error).toHaveBeenCalled();
                });

                it('should be fully tested', function () {
                    var topics = jQuery.pubsub._.topics;
                    var testTopic = 'test-unsubscribe';
                    var callback = function () {};

                    expect(topics[testTopic]).toBeUndefined();

                    jQuery.pubsub.subscribe(testTopic, callback);
                    expect(topics[testTopic].has()).toBe(true);

                    jQuery.pubsub.unsubscribe(testTopic, callback);
                    expect(topics[testTopic].has()).toBe(false);
                });
            });


            describe('clear()', function () {
                it('should have a clear() method', function () {
                    expect(typeof jQuery.pubsub.clear).toBe('function');
                });

                it('should reset a given topic to an empty Callbacks object', function () {
                    var testTopic = 'test-clear';
                    var topics = jQuery.pubsub._.topics;
                    topics[testTopic] = jQuery.Callbacks();

                    topics[testTopic].add(function () {
                        throw 'A callback should not be executed after calling clear()';
                    });

                    expect(topics[testTopic].has()).toBe(true);

                    jQuery.pubsub.clear(testTopic);
                    expect(topics[testTopic].has()).toBe(false);

                    jQuery.pubsub.publish(testTopic);
                });
            });


            describe('purge()', function () {
                it('should have a purge() method', function () {
                    expect(typeof jQuery.pubsub.purge).toBe('function');
                });

                it('should clear all topics', function () {
                    var topics = jQuery.pubsub._.topics;

                    var i;
                    for (i = 1; i <= 3; i++) {
                        topics['test' + i] = jQuery.Callbacks();
                        topics['test' + i].add(function () {
                            throw 'test[' + i + ']: A callback should not be executed after calling clear()';
                        });
                        expect(topics['test' + i].has()).toBe(true);
                    }

                    jQuery.pubsub.purge();

                    for (i = 1; i <= 3; i++) {
                        expect(topics['test' + i].has()).toBe(false);
                    }
                });
            });


        });
        // end: public api



        /**
         * Debug settings and console output
         */
        describe('Debug', function () {
            it('has a private debug object', function () {
                expect(typeof jQuery.pubsub._.debug).toBe('object');
            });

            describe('log()', function () {

                it('has a private debug.log() method', function () {
                    expect(typeof jQuery.pubsub._.debug.log).toBe('function');
                });

                it('suppresses output if window.console is not defined', function () {
                    var origConsole = window.console;
                    window.console = undefined;

                    var logMethod = origConsole.group ? 'debug' : 'log';

                    spyOn(origConsole, logMethod);
                    jQuery.pubsub._.debug.log();
                    expect(origConsole[logMethod]).not.toHaveBeenCalled();

                    window.console = origConsole;
                    expect(window.console).toBe(origConsole);
                });

                it('suppresses output if public debug property is not set', function () {
                    jQuery.pubsub.debug = false;

                    var logMethod = window.console.group ? 'debug' : 'log';

                    spyOn(window.console, logMethod);
                    jQuery.pubsub._.debug.log();
                    expect(window.console[logMethod]).not.toHaveBeenCalled();
                });

                it('successful output if public debug property is set', function () {
                    jQuery.pubsub.debug = true;

                    var logMethod = window.console.group ? 'debug' : 'log';

                    spyOn(window.console, logMethod);
                    jQuery.pubsub._.debug.log();
                    expect(window.console[logMethod]).toHaveBeenCalled();
                });

                it('uses console.group and console.debug if defined', function () {
                    jQuery.pubsub.debug = true;

                    var origGroup = window.console.group;
                    if (!window.console.group) {
                        window.console.group = function () {};
                    }

                    var origDebug = window.console.debug;
                    if (!window.console.debug) {
                        window.console.debug = function () {};
                    }

                    spyOn(window.console, 'group');
                    spyOn(window.console, 'debug');

                    jQuery.pubsub._.debug.log();

                    expect(window.console.group).toHaveBeenCalled();
                    expect(window.console.debug).toHaveBeenCalled();

                    window.console.group = origGroup;
                    expect(window.console.group).toBe(origGroup);
                    window.console.debug = origDebug;
                    expect(window.console.debug).toBe(origDebug);
                });

                it('falls back to console.log if console.group is undefined', function () {
                    jQuery.pubsub.debug = true;

                    var origGroup = window.console.group;
                    window.console.group = undefined;

                    spyOn(window.console, 'log');
                    jQuery.pubsub._.debug.log();
                    expect(window.console.log).toHaveBeenCalled();

                    window.console.group = origGroup;
                    expect(window.console.group).toBe(origGroup);
                });
            });

            describe('subscribe()', function () {
                it('has a subscribe method', function () {
                    expect(typeof jQuery.pubsub._.debug.subscribe).toBe('function');
                });

                it('log is subscribed for all topics', function (done) {
                    spyOn(jQuery.pubsub._.debug, 'log').and.callFake(function () {
                        done();
                    });

                    jQuery.pubsub._.debug.subscribe();
                    jQuery.pubsub.publish('*');
                });

            });

        });

    });

}());
