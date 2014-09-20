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
        scripts: {
            base: './src',
            src: './src/**/*.js',
            dest: './dist/'
        },
        test: {
            coverage: './coverage/**/lcov.info'
        }
    };



    /**
     * Tasks
     */

    // Default
    gulp.task('default', ['lint', 'test']);


    // Lint with jshint
    gulp.task('lint', function () {
        return gulp.src(paths.scripts.src)
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
            gulp.run('cover');
            // Run is deprecated -- @TODO : find a way to use watch in the future
            // gulp.watch(paths.test.coverage, ['cover']);
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
    gulp.task('build', ['lint', 'test'], function () {
        return gulp.src(paths.scripts.src, { base: paths.scripts.base })
            .pipe(gulp.dest(paths.scripts.dest))
            .pipe(uglify())
            .pipe(rename('jquery.pubsub.min.js'))
            .pipe(gulp.dest('dist'));
    });


    gulp.task('cover', function () {
        return gulp.src(paths.test.coverage)
            .pipe(coveralls());
    });

}());
