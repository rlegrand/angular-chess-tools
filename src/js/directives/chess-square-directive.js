angular.module('chess.directives')
.directive('chessSquareDirective', ['chessPieceService', function(chessPieceService){

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
		' 	<img ng-if="!isEmpty" ng-src="{{imgSource()}}" draggable="{{isDraggable()}}"></img>' +
		' </div>',
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
					highlightSquare= $scope.content.highlight;

				return {
					square: square, 	blackSquare: blackSquare,
					whiteSquare: whiteSquare, firstOfLine: firstOfLine,
					reverse: reverse,highlightSquare: highlightSquare
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
			};


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
			  this.classList.remove('overSquare'); 
			});

			element.on('dragstart', function(e){
				var data='in ' + $scope.content.piece.x + ' ' + $scope.content.piece.y;
				e.dataTransfer.setData('piece', data);
				$scope.$apply(function(){
					chessBoardController.displayAccessibleMoves($scope.content.piece);
				});
			});

			//Update the chessboard when the piece is dropped
			element.on('drop', function(e){
				e.stopPropagation();
				this.classList.remove('overSquare');
				var prevPos= e.dataTransfer.getData('piece');

				if (prevPos !== undefined){
					var splited= prevPos.split(' '),
						mode= splited[0],
						control= chessBoardController.getControl();
					
					//The piece comes from the board
					if (mode === 'in'){
						var prevX= parseInt(splited[1]),
							prevY= parseInt(splited[2]);
						// And the user can only move its pieces
						chessBoardController.tryMove(prevX, prevY, $scope.content.x, $scope.content.y);
					}else if (mode === 'out' && control === 'edit'){
						var type= splited[1],
							color= splited[2];
							piece= chessPieceService.new(type, color,  $scope.content.x, $scope.content.y);
						chessBoardController.addPiece(piece);
					}
				}
			});

			$scope.isDraggable= function(){
				return chessBoardController.isDraggable($scope);
			};

			chessBoardController.registerSquareScope($scope);
		}
	};

}]);