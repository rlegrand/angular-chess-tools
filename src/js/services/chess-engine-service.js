angular.module('chess.services')
.factory('chessEngineService', [function(){

	var ChessEngineService= function(){

		var gameStarted= false;

		var worker= new Worker('/ext/lozza.js');

		//answers
		worker.onmessage= function(message){

			var answer= message.data.trim().replace(/\s+/g,' ');
			var splitedAnswer= answer.split(' ');




		}

		//treatments
		this.play= function(piece, toX, toY){

			
			
		}




	}

	return new ChessEngineService();
}]);