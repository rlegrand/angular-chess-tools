angular.module('chess.directives')
.directive('chessSquareDirective', function(){

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
		' 	<img ng-if="!isEmpty" ng-src="{{imgSource()}}" class="toMove" draggable="{{isDraggable()}}"></img>' +
		' </div>',
		link: function($scope, element, attrs, chessBoardController){


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
				return {
					square: true,
					blackSquare: ( ($scope.content.x + $scope.content.y)%2 === 1 ),
					whiteSquare: ( ($scope.content.x + $scope.content.y)%2 === 0 ),
					firstOfLine: $scope.content.x === 0,
					reverse: $scope.reverse == 'true'
				};
			};

			$scope.imgSource= function(){
				if (!$scope.isEmpty){
					return '/imgs/' + $scope.content.piece.name + '_' + $scope.content.piece.color + '.svg';
				}
			};

			$scope.getImage= function(){
				if (!$scope.isEmpty){
					return element.find('img');
				}
			}

			//ABOUT DRAG AND DROP

			element.on('dragover', function(e){

			  if (e.preventDefault) {
			    e.preventDefault(); // Necessary. Allows us to drop.
			  }

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

			element.on('dragstart', function(e){
				var currentPos=$scope.content.piece.x + ' ' + $scope.content.piece.y;
				e.dataTransfer.setData('piece', currentPos);
			});

			//Update the chessboard when the piece is dropped
			element.on('drop', function(e){
				e.stopPropagation();
				this.classList.remove('overSquare');
				var prevPos= e.dataTransfer.getData('piece');
				if (prevPos !== undefined){
					var splited= prevPos.split(' '),
						prevX= parseInt(splited[0]),
						prevY= parseInt(splited[1]);

					chessBoardController.tryMove(prevX, prevY, $scope.content.x, $scope.content.y);
				}
			});

			$scope.isDraggable= function(){
				return chessBoardController.isDraggable($scope);
			};

			chessBoardController.registerSquareScope($scope);
		}
	};

});