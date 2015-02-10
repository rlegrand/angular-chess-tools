var fs  = require("fs");

var LineManager= function(){

	var lines= [];
	var content='';

	var conformLineRegex= /^[ABCDEF][0-9][0-9]/;
	var returnRegex=/\r/;

	var correctContent= function(){
		var tab= content.split(returnRegex),
			res='';
		for (var i in tab){
			res+= tab[i];
		}
		content= res;
	}

	var registerContent= function(){
		//Check if this new line has to be a new line...
		correctContent();
		var lastLine= lines[lines.length-1];
		if (content.search(conformLineRegex) != -1){
			lines.push(content);
			content='';
		}
		else{
			lines[lines.length-1]+=' ' + content;
			content= '';
		}
	}

	var newLineRegex= /\n/g;
	this.add= function(bfr){
		var splited= bfr.split(newLineRegex);
		content+= splited[0];
		if (splited.length > 1){
			registerContent();
			for (var i= 1; i< splited.length; i++){
				if ( i+1 == splited.length){
					if (splited[i] != ''){
						content+= splited[i];
					}
				} else{
					content+= splited[i];
					registerContent();
				}
			}
		}
	}

	this.getLines= function(){
		return lines;
	}

	this.getContent= function(){
		return content;
	}

	this.toString= function(){
		var res='';
		for (var i in lines){
			res+= lines[i] + '\n';
		}

		return res;
	}
}

var lineManager= new LineManager();

fs.createReadStream('src/data/ouvertures.txt')
.on('open', function(data){
	console.log('file opened');
})
.on('data', function(bfr){
	lineManager.add(bfr.toString());
})
.on('end', function(){
	console.log('read ended');
	console.log('nb lines: ' + lineManager.getLines().length );
	console.log('Starting write');

	fs.writeFile('src/data/corrected.txt', lineManager.toString(), function (err) {
	  if (err) throw err;
	  console.log('Done!');
	});
});