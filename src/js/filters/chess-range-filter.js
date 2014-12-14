angular.module('chess.filters')
.filter('range', function(){
	return function(input, range, reverse){

		var res= [];

		for (var i= 0; i< range; i++){
			var toAdd= (!reverse? i: range - 1 - i);
			res.push(toAdd);
		}

		return res;
	};
})
.filter('reverse', function(){
	return function(input, incrementBy){

		var res=[];

		for(var i= 0; i< input.length; i++){
			res.push(input[input.length - i - 1]);
		}

		return res;
	};
})
.filter('increment', function(){
	return function(input, incrementBy){

		var res=[];

		for(var i= 0; i< input.length; i++){
			res.push(input[i] + incrementBy);
		}

		return res;
	};
})
.filter('asLetter', function(){
	return function(input){

		var res= [];

		var val;
		for (var i= 0; i< input.length; i++){
			val= input[i] + 3;
    		res.push(String.fromCharCode(94 + val));
		}

		return res;
	};
});


