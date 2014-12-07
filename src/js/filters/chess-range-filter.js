angular.module('chess.filters')
.filter('range', function(){
	return function(input, range){
		for (var i= 0; i< range; i++){
			input.push(i);
		}

		return input;
	}
})