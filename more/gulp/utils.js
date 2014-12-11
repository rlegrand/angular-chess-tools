var _= require('underscore'),
	glob=require('glob'),
  	express = require('express'),
  	http = require('http'),
  	logger= require('morgan')
  	baseProject= __dirname + '/../../';

module.exports={

	getFilesForPatterns: function(patterns){
	  return _.chain(patterns)
	  .map(function(pattern){return glob.sync(pattern); })
	  .reduce(function(memo, num){
	    return memo.concat(num);
	  }, []).value();
	},

	getServer: function(){
		return http.createServer(express()
		    .use(logger())
		    .use(express.static(baseProject + '/src/'))
		    .use(express.static(baseProject + '/bower_components/'))
		  );
	},


	getPackage: function(){
		return require(baseProject +'/package.json');
	}	

}