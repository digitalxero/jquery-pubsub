/*global beforeEach, afterEach, describe, expect, it, spyOn, xdescribe, xit */
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
        it("should have tests", function () {
            expect(true).toBe(false);
        });
    });

}());
