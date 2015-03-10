
var gulp= require('gulp'),
  debug= require('gulp-debug'),
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
  greplace= require('gulp-replace'),
  gdocs= require('gulp-ngdocs'),
  usemin= require('gulp-usemin'),
  webdriver_standalone = require('gulp-protractor').webdriver_standalone,
  webdriver_update = require('gulp-protractor').webdriver_update,
  myUtils= require(__dirname + '/more/gulp/utils'),
  server= myUtils.getServer();

var appJsGlobs=['src/js/**/*.js'],
    unitTestJsGlobs=['test/unit/utils.js','test/unit/**/*Spec.js'],
    e2eJsGlobs= ['test/e2e/**/*.js'],
    appCssGlobs= ['src/styles/**/*.css'],
    appImages= ['src/imgs/**/*'];

var target='dist',
    targetAppName= myUtils.getPackage().name;

/**
* When used, this task launches the selenium
* server and let it run indefinitely
*/

gulp.task('webdriver_update', webdriver_update);
gulp.task('webdriver_standalone', webdriver_standalone);

gulp.task('express', function(cb){
  server.listen(8080, cb);
});


gulp.task('test-unit', function() {

  //Check files to test
  var filesToTest= myUtils.getFilesForPatterns(unitTestJsGlobs);
  if (!filesToTest || filesToTest.length === 0){
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
  .pipe(addSrc.append(filesToTest))
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

  //Check files to test
  var filesToTest= myUtils.getFilesForPatterns(e2eJsGlobs);
  if (!filesToTest || filesToTest.length === 0){
    server.close();
    cb();
    return;
  }

  //start protractor
  gulp.src(filesToTest, { read:false })
      .pipe(protractor({
        configFile: './protractor.conf.js',
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

  gulp.task('ngdocs', function(cb){

    return gulp.src(appJsGlobs)
    .pipe(gdocs.process())
    .pipe(gulp.dest('./reports/doc/'));

  });


gulp.task('prebuild', ['test-unit', 'jshint', 'test-e2e', 'ngdocs'], function(cb){
  cb();
});


//BUILD PART

gulp.task('clean', ['prebuild'], function (cb) {
  return gulp.src('./' + target)
  .pipe(rimraf({force:true}));
});

gulp.task('minifyJs', ['prebuild', 'clean'],  function(){

  gulp.src(appJsGlobs) 
  .pipe(concat( targetAppName + '.js'))
  .pipe(gulp.dest('./' + target + '/js/')) //not minified
  .pipe(uglify())
  .pipe(rename(targetAppName + '-min.js'))
  .pipe(gulp.dest('./' + target + '/js/')); //minified

});

gulp.task('minifyCss',['prebuild', 'clean'],  function(){

  gulp.src(appCssGlobs)
  .pipe(concat(targetAppName + '.css'))
  .pipe(gulp.dest('./' + target + '/styles/'))
  .pipe(cssmin())
  .pipe(rename(targetAppName + '-min.css'))
  .pipe(gulp.dest('./' + target + '/styles/'));

});

gulp.task('images', ['prebuild', 'clean'],  function(){
  gulp.src(appImages)
  .pipe(gulp.dest('./' + target + '/imgs'));
});


gulp.task('build', ['minifyJs','minifyCss', 'images'], function(cb){
  cb();
});

gulp.task('default', ['build', 'sample'], function(cb){
  cb();
});


gulp.task('imgssample', [ 'clean'],  function(){
  gulp.src(appImages)
  .pipe(gulp.dest('./' + target + '/sample/imgs'));
}); 

gulp.task('sample', ['clean', 'imgssample'], function(){
  return gulp.src('src/e2eTemplates/index.html')
      .pipe(usemin({
        css: [cssmin(), 'concat'],
        extjs: [uglify(), 'concat'],
        appjs: [
          greplace(/setImgsRootPath\('\/imgs'\)/, 'setImgsRootPath(\'/angular-chess-tools/imgs\')'),
          uglify(), 
          'concat'
        ]
      }))
      .pipe(gulp.dest('./' + target + '/sample'));
});