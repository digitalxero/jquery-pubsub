/*jslint vars: true */
(function () {
    "use strict";


    /**
     * Libraries
     */
    var gulp    = require('gulp');
    var jshint  = require('gulp-jshint');
    var stylish = require('jshint-stylish');
    var rename  = require('gulp-rename');
    var uglify  = require('gulp-uglify');
    var karma   = require('karma');
    var coveralls = require('gulp-coveralls');


    /**
     * Paths
     */
    var paths = {
        base: './src',
        src: './src/**/*.js',
        dest: './dist/'
    };



    /**
     * Tasks
     */

    // Default
    gulp.task('default', ['lint', 'test']);


    // Lint with jshint
    gulp.task('lint', function () {
        return gulp.src(paths.src)
            .pipe(jshint())
            .pipe(jshint.reporter(stylish));
    });


    // Run tests with Karma
    gulp.task('test', function (done) {
        karma.server.start({
            configFile: __dirname + '/karma.conf.js',
            singleRun: true
        }, function () {
            // a failing test will cause an exception
            // in done without this wrapping anon fn
            done();
        });
    });

    // Watch for file changes and re-run tests on each change
    gulp.task('tdd', function (done) {
        karma.server.start({
            configFile: __dirname + '/karma.conf.js',
            singleRun: false
        }, done);
    });


    // Build: copy and minify
    gulp.task('build', ['lint', 'test', 'cover'], function () {
        return gulp.src(paths.src, { base: paths.base })
            .pipe(gulp.dest(paths.dest))
            .pipe(uglify())
            .pipe(rename('jquery.pubsub.min.js'))
            .pipe(gulp.dest('dist'));
    });


    gulp.task('cover', ['test'], function () {
        return gulp.src('coverage/**/lcov.info')
            .pipe(coveralls());
    });

}());
