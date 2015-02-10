var     lazy    = require("lazy"),
        fs  = require("fs");

var notFound= [];

var movesPatterns= /(?:[0-9]+\.(([TCFRDtcfrdabegh]?x?[abcdefgh][1-8]\+?|O-O-O|O-O)[ ]*){1,2})(?![ ]*\))/g,
	ecoPattern= /^[ABCDEF][0-9][0-9]/;
	lineNumber= 0;


var parseMove= function(move){
	var singleMovePattern=/([0-9]+)\.([TCFRDtcfrdabegh]?x?[abcdefgh][1-8]\+?|O-O-O|O-O)[ ]*([TCFRDtcfrdabegh]?x?[abcdefgh][1-8]\+?|O-O-O|O-O)?/;
	var parsed= move.match(singleMovePattern);

	if (!parsed || parsed.length!==4){
		console.log('invalid move: ' + move);
		return;
	}

	return {
		nb: parseInt(parsed[1]),
		white: parsed[2],
		black: parsed[3]
	};
}	


var res={
	maxMoves: 0
};

new lazy(fs.createReadStream('src/data/corrected.txt'))
.lines.forEach(function(line) {
	lineNumber++;
	var lineStr= line.toString();
	var movesArray= lineStr.match(movesPatterns);
	if (!movesArray || movesArray.length === 0){
		notFound.push('NOTHING FOUND FOR THIS LINE (' + lineNumber + '): ' + lineStr);
	}else{
		res.maxMoves= Math.max(res.maxMoves, movesArray.length);

		var index= lineStr.search(movesPatterns),
			text= lineStr.substr(0, index), 
			desc,
			ecos= lineStr.match(ecoPattern),
			eco;
		if (ecos){
			eco= ecos[0];
			desc= text.substr(eco.length);
		}

		var currentEntry={
			eco: eco,
			desc: desc
		}

		for (var i= 0; i< movesArray.length; i++){
			var currentMove= parseMove(movesArray[i]);
			if (currentMove.nb !== (i+1)){
				console.log('i= :' + i);
				console.log('Move :' + movesArray[i]);
				console.log(movesArray.join(' '));
				console.log('ERROR LINE ' + lineNumber);
				break;
			}

			currentEntry[i]= movesArray[i];
		}

		res[lineNumber]= currentEntry;

/*		for (var i in movesArray){
			console.log(movesArray[i] + ' ');
		}
		console.log('\n');*/
	}
}).on('pipe', function(){
		for (var i in notFound){
			console.log(notFound[i] + ' ');
		}

		fs.writeFile('src/data/ouvertures.json', JSON.stringify(res, null, 4), function (err) {
		  if (err) throw err;
		  console.log('Done!');
		});


		console.log('\n');
});

