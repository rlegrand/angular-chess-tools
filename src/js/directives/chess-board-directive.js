angular.module('chess.directives')
/**
* TODO: use ngdoc
* Directive params:
* -> user: 'white' | 'black'
* 	 defines the user position.
*	 Impact draggable pieces and color position
* 
* -> 
*/
.directive('chessBoardDirective', ['chessPositionService', '$animate', 
	function(chessPositionService, $animate){

	return{
		replace: true,
		transclude: false,
		scope:{
			user:'=',
			displayCoordinates:'='
		},
		template:
		'<div>' +
		'	<div id="chessBoard" ng-class="cssClasses()">' +
		'		<chess-square-directive ' +
		'			ng-repeat="piece in position track by $index" ' +
		'			x="{{getX($index)}}" ' +
		'			y="{{getY($index)}}" ' +
		'			piece="{{piece}}" ' +
		'			reverse="{{isReverse(user)}}" ' +
		'		> ' +
		'	</div> ' +
		'	<div id="rightCoordinates" ng-if="displayCoordinates" ng-class="cssClasses()"> ' +
		'		<div ng-repeat="indice in [] | range:8 | increment:1" ng-class="cssClasses()">{{indice}}</div> ' +
		'	</div> ' +
		'	<div id="bottomCoordinates"  ng-if="displayCoordinates" ng-class="cssClasses()"> ' +
		'		<div ng-repeat="indice in [] | range:8 | asLetter | reverse" ng-class="cssClasses()">{{indice}}</div> ' +
		'	</div> ' +
		'</div>'
		,
		controller: ['$scope', function($scope){
			var that= this;

			$scope.position= chessPositionService.getPosition();

			//Check position changes
			$scope.$watch(chessPositionService.getPosition, 
				function(newVal, oldVal){
					$scope.position= newVal;
				}, true);

			$scope.cssClasses= function(){
				return {
					reverse:$scope.isReverse($scope.user)
				};
			};

			$scope.getX= function(index){
				return index % 8;
			};

			$scope.getY= function(index){
				return Math.floor(index / 8);
			};

			var getIndex= function(x, y){
				return y*8+x;
			}

			this.squareScopes= [];

			$scope.isReverse= function(user){
				if (user){
					return (user === 'white');
				}
			}


			this.isDraggable= function(squareScope){
				if (!squareScope.isEmpty && $scope.user){
					return squareScope.content.piece.color == $scope.user;
				}
			}

			this.registerSquareScope= function(squareScope){
				var x= squareScope.content.x,
					y= squareScope.content.y;
					this.squareScopes[y*8+x]= squareScope;
			};

			this.tryMove= function(prevX, prevY, x, y){

				var sourceIndex= getIndex(prevX, prevY);

				var squareScope= this.squareScopes[sourceIndex];
				var imgElement= squareScope.getImage();
				var piece= $scope.position[sourceIndex];
				//imgElement.addClass('toMove');
				var prevTop= imgElement[0].style.top,
					prevLeft= imgElement[0].style.left;
				imgElement.css({top: (prevTop - 200) + 'px', left: (prevLeft + 200) + 'px'});

				// $animate.animate(imgElement, {top:'0px'}, {top: '300px'});
				// .then(function(){
				// 	console.log('animation ended');
				// 	chessPositionService.movePiece(piece, x, y);
				// 	$scope.$apply();
				// }, function(){console.log('error');});
				


				
				// $scope.$apply(function(){

				// });

			};
		}]
	};

}]);