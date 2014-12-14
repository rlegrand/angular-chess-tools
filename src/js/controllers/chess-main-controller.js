angular.module('chess.controllers')
.controller('mainController', ['$scope','chessPositionService','chessPieceService',
	function($scope, chessPositionService, chessPieceService){

	$scope.color='black';

	$scope.changeColor= function(){
		if ($scope.color == 'white'){
			$scope.color= 'black';
		}else{
			$scope.color= 'white';
		}
	}

	$scope.checkMove= function(){
			var piece= chessPieceService.new('PAWN', 'WHITE', 3, 1);
			chessPositionService.movePiece(piece, 3, 3);
	}

	//$scope.position= chessPositionService.getPosition();
     
}]);