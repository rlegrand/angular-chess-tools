angular.module('chess.directives')
.directive('chessSquareDirective', function(){

	return {
		require:'^chessBoardDirective',
		replace: true,
		transclude: false,
		scope:{
			x:'@',
			y:'@',
			piece:'=?'
		},
		template: 
		' <div ' +
		'	ng-class="cssClasses" ' +
		' >' +
		' 	<img ng-if="!isEmpty" ng-src="{{imgSource()}}" draggable="true"></img>' +
		' </div>',
		link: function($scope, element, attrs, chessBoardController){

			$scope.x= parseInt($scope.x);
			$scope.y= parseInt($scope.y);

			$scope.cssClasses={
				square: true,
				blackSquare: ( ($scope.x + $scope.y)%2 === 0 ),
				whiteSquare: ( ($scope.x + $scope.y)%2 === 1 ),
				firstOfLine: ( $scope.x === 0 )
			};

			$scope.isEmpty= ($scope.piece === undefined);

			$scope.imgSource= function(){
				if (!$scope.isEmpty){
					return '/imgs/' + $scope.piece.name + '_' + $scope.piece.color + '.svg';
				}
			};


			chessBoardController.registerSquareScope($scope);

			//ABOUT DRAG AND DROP

			element.on('dragover', function(e){

			  if (e.preventDefault) {
			    e.preventDefault(); // Necessary. Allows us to drop.
			  }

			});

			var imgElement= element.find('img');

			//Set the current piece as data
			imgElement.on('dragstart', function(e){
				e.dataTransfer.setData('piece', next);
			});

			//Change the style when dragging on top of a square

			element.on('dragenter', function(e){
			  this.classList.add('overSquare');
			});		

			//Remove the style when leaving the square
			element.on('dragleave', function(e) {
				console.log('dragleave');
			  this.classList.remove('overSquare'); 
			});

			//Update the chessboard when the piece is dropped
			element.on('drop', function(e){
				e.stopPropagation();
				this.classList.remove('overSquare');
				var data= e.dataTransfer.getData('piece');
				if (data !== undefined){
					chessBoardController.tryMove(data.piece,$scope.x, $scope.y);
				}
			});

		}
	};

})
.directive('chessBoardDirective', ['chessPositionService', function(chessPositionService){

	return{
		replace: true,
		transclude: false,
		scope:{
			position:'=?'
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

			this.registerSquareScope= function(squareScope){
				var x= squareScope.x,
					y= squareScope.y;
				this.squareScopes[y*8+x]= squareScope;
			};

			this.tryMove= function(piece, x, y){

				console.log('try move');

			};
		}]
	};

}]);