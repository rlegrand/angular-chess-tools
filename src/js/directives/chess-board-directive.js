angular.module('chess.directives')
.directive('chessSquareDirective', function(){

	return {
		require:'^chessBoardDirective',
		replace: true,
		transclude: false,
		scope:{
			x:'@',
			y:'@',
			piece:'?='
		},
		template: 
		' <div ' +
		'	ng-class="cssClasses" ' +
		' >' +
		' 	<img ng-if="!isEmpty" src="imgSource()" draggable="true"></img>' +
		' </div>',
		link: function($scope, element, attrs, chessBoardController){

			$scope.x= parseInt($scope.x);
			$scope.y= parseInt($scope.y);

			$scope.isEmpty= ($scope.piece !== undefined);
			$scope.imgSource= function(){
				if (!$scope.isEmpty){
					return '/imgs/' + piece.name + '_' + piece.color + '.svg';
				}
			};

			chessBoardController.registerSquareScope($scope, x, y);

			$scope.cssClasses={
				blackSquare: (x + y)%2 === 0,
				whiteSquare: !black
			};

			element.on('drop', function(e){
				var data= e.target.dataTransfer;
				chessBoardController.tryMove(data.piece,$scope.x, $scope.y);
			});


		}
	};

})
.directive('chessBoardDirective', ['chessPositionService', function(chessPositionService){

	return{
		replace: true,
		transclude: false,
		scope:{
			position:'?='
		},
		template: '',
		controller: ['$scope', function($scope){

			this.squareScopes= [];

			this.registerSquareScope= function(squareScope, x, y){
				this.squareScopes[y*8+x]= squareScope;
			};

			this.tryMove= function(piece, x, y){

				

			};
		}]
	};

}]);