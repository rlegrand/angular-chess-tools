
var gulp= require('gulp'),
  debug= require('gulp-debug'),
  gutil= require('gulp-util'),
	karma = require('gulp-karma'),
  rimraf= require('gulp-rimraf'),
  jshint= require('gulp-jshint'),
  jshintStylish= require('jshint-stylish'),
  uglify= require('gulp-uglify'),
  cssmin= require('gulp-minify-css'),
  concat= require('gulp-concat'),
  mbf= require('main-bower-files'),
  addSrc= require('gulp-add-src'),
  gfilter= require('gulp-filter'),
  rename= require('gulp-rename'),
  protractor= require('gulp-protractor').protractor,
  webdriver_standalone = require('gulp-protractor').webdriver_standalone,
  webdriver_update = require('gulp-protractor').webdriver_update,
  glob= require('glob'),
  express = require('express'),
  http = require('http'),
  server = http.createServer(express()
    .use(express.static(__dirname + '/src/'))
    .use(express.static(__dirname + '/bower_components/'))
  );

var appJsGlobs=['src/js/**/*.js'],
    unitTestJsGlobs=['test/unit/utils.js','test/unit/**/*Spec.js'],
    e2eJsGlobs='test/e2e/**/*Spec.js',
    appCssGlobs= ['src/styles/**/*.css'],
    appImages= ['src/imgs/**/*'];

var target='dist',
    commonName='chess';


/**
* When used, this task launches the selenium
* server and let it run indefinitely
*/

gulp.task('webdriver_update', webdriver_update);
gulp.task('webdriver_standalone', webdriver_standalone);

gulp.task('express', function(cb){
  server.listen(9001, cb);
});


gulp.task('test-unit', function() {

  var unitTestFiles= glob.sync(unitTestJsGlobs[1]);

  if (unitTestFiles.length === 0){
    return;
  }

  var jsFilter= gfilter('**/*.js');
  
  //Stream all devDependencies js referenced by bower
  return gulp.src(mbf({includeDev:'exclusive'}))
  //Stream all dependencies js referenced by bower
  .pipe(addSrc.append(mbf()))
  .pipe(jsFilter)
  //Then add application specific js
  .pipe(addSrc.append(appJsGlobs))
  //Then add unit tests specific js
  .pipe(addSrc.append(unitTestJsGlobs))
  //Finally run karma unit tests
  .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run',
      singleRun: false
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});


gulp.task('jshint', function(){

  //Apply jshint rules on application files only
  return gulp.src(appJsGlobs)
  .pipe(jshint({multistr: true}))
  .pipe(jshint.reporter(jshintStylish));

});

gulp.task('test-e2e', ['webdriver_update', 'express'],  function(cb){

  var e2eSpecFiles= glob.sync(e2eJsGlobs);

  //No files to treat, end
  if (e2eSpecFiles.length === 0){
    server.close();
    cb();
    return;
  }
  
  gulp.src(e2eSpecFiles, { read:false })
      .pipe(protractor({
        configFile: './protractor.conf.js',
        // args: ['--baseUrl', 'http://' + server.address().address + ':' + server.address().port +'/e2eTemplates/']
        args: ['--baseUrl', 'http://localhost:' + server.address().port +'/e2eTemplates/']
      })).on('error', function(e) {
        server.close();
        throw e;
        cb();
      }).on('end', function() {
        server.close();
        cb();
      });
});


gulp.task('prebuild', ['test-unit', 'jshint', 'test-e2e'], function(cb){
  cb();
});


//BUILD PART

gulp.task('clean', ['prebuild'], function (cb) {
  return gulp.src('./' + target)
  .pipe(rimraf({force:true}));
});

gulp.task('minifyJs', ['prebuild', 'clean'],  function(){

  var target_name=commonName;

  gulp.src(appJsGlobs) 
  .pipe(concat( target_name + '.js'))
  .pipe(gulp.dest('./' + target + '/js/')) //not minified
  .pipe(uglify())
  .pipe(rename(target_name + '-min.js'))
  .pipe(gulp.dest('./' + target + '/js/')); //minified

});

gulp.task('minifyCss',['prebuild', 'clean'],  function(){

  var target_name= commonName;

  gulp.src(appCssGlobs)
  .pipe(concat(target_name + '.css'))
  .pipe(gulp.dest('./' + target + '/styles/'))
  .pipe(cssmin())
  .pipe(rename(target_name + '-min.css'))
  .pipe(gulp.dest('./' + target + '/styles/'));

});

gulp.task('images', ['prebuild', 'clean'],  function(){
  gulp.src(appImages)
  .pipe(gulp.dest('./' + target + '/imgs'));
});


gulp.task('build', ['minifyJs','minifyCss', 'images'], function(cb){
  cb();
});

gulp.task('default', ['build']);