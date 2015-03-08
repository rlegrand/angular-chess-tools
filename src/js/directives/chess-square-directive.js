angular.module('chess.directives')
.directive('chessSquareDirective', [ function(){

	return {
		require:'^chessBoardDirective',
		replace: true,
		transclude: false,
		scope:{
			x:'@',
			y:'@',
			piece:'@?',
			reverse: '@'
		},
		template: 
		' <div ' +
		'	ng-class="cssClasses()" ' +
		' >' +
		// '	({{x}},{{y}}) ' +
		' 	<img ng-if="!isEmpty" ng-src="{{imgSource()}}" draggable="{{isMovable()}}"></img>' +
		' </div>',
		controller:['$scope', function($scope){ 
			this.getScope= function(){return $scope;} 
		}],
		link: function($scope, element, attrs, chessBoardController){

			//TODO: check if $scope.content is still needed
			var updateScopeContent= function(){
				$scope.content= {
					x: parseInt($scope.x),
					y: parseInt($scope.y),
					piece: ($scope.piece !== undefined && $scope.piece !==''? JSON.parse($scope.piece): undefined)
				}

				$scope.isEmpty= ($scope.content.piece === undefined);
			}

			//We need to set scope content at init
			updateScopeContent();

			//we need to update scope content when a modif appears on
			//a piece
			$scope.$watch('piece', function(newVal, oldVal){
				updateScopeContent();
			});

			$scope.cssClasses= function(){
				var square= true,
					blackSquare= ( ($scope.content.x + $scope.content.y)%2 === 0 )
					whiteSquare= !blackSquare,
					firstOfLine= ($scope.content.x === 0),
					reverse= ($scope.reverse === 'true'),
					highlightSquareEmpty= $scope.content.highlight && $scope.isEmpty,
					highlightSquareFilled= $scope.content.highlight && !$scope.isEmpty;

				return {
					square: square, 
					blackSquare: blackSquare,
					whiteSquare: whiteSquare, 
					firstOfLine: firstOfLine,
					reverse: reverse,
					highlightSquareEmpty:highlightSquareEmpty, 
					highlightSquareFilled: highlightSquareFilled
				};
			};

			$scope.imgSource= function(){
				if (!$scope.isEmpty){
					return 'imgs/' + $scope.content.piece.name + '_' + $scope.content.piece.color + '.svg';
				}
			};

			$scope.getImage= function(){
				if (!$scope.isEmpty){
					return element.find('img');
				}
			};



			$scope.isMovable= function(){
				return chessBoardController.isMovable($scope);
			};

			chessBoardController.registerSquareScope($scope);
		}
	};

}]);