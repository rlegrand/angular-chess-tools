angular.module('chess.controllers')
.controller('mainController', ['$scope', function($scope){

	$scope.color='white';

	$scope.changeColor= function(){
		if ($scope.color == 'white'){
			$scope.color= 'black';
		}else{
			$scope.color= 'white';
		}
	}
     
}]);