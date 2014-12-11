angular.module('chess.directives')
/**
* TODO: use ngdoc
* Directive params:
* -> user: 'white' | 'black' | 'both'
* 	 defines the user position. Both means that the user can independently move any piece.
*/
.directive('chessBoardDirective', ['chessPositionService', function(chessPositionService){

	return{
		replace: true,
		transclude: false,
		scope:{
			user:'='
		},
		template: 
		'<div id="chessBoard">' +
		'	<chess-square-directive ' +
		'		ng-repeat="indice in [] | range:64" ' +
		'		x="{{getX($index)}}" ' +
		'		y="{{getY($index)}}" ' +
		'		y="{{getY($index)}}" ' +
		'		piece="getPiece($index)" ' +
		'	> ' +
		'</div> ',
		controller: ['$scope', function($scope){
			var that= this;

			$scope.getX= function(index){
				return index % 8;
			}

			$scope.getY= function(index){
				return 7 - Math.floor(index / 8);
			}

			$scope.getPiece= function(index){
				return chessPositionService.getPiece($scope.getX(index), $scope.getY(index));
			}

			this.squareScopes= [];


			this.adaptDraggablePiece= function(squareScope){
				if (!squareScope.isEmpty && $scope.user){

					if (squareScope.piece.color == $scope.user){
						squareScope.activateDrag();
					}else{
						squareScope.disableDrag();
					}
				}
			}

			$scope.$watch('user', function(newVal, oldVal){
				if (newVal !== undefined && oldVal !== undefined){
					for(var i= 0; i< that.squareScopes.length; i++){
						that.adaptDraggablePiece(that.squareScopes[i]);
					}
				}
			})


			this.registerSquareScope= function(squareScope){
				var x= squareScope.x,
					y= squareScope.y;
				this.squareScopes[y*8+x]= squareScope;
				this.adaptDraggablePiece(squareScope);
			};

			this.tryMove= function(piece, x, y){


				console.log('try move');

			};
		}]
	};

}]);