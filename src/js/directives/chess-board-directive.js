angular.module('chess.directives')
/**
* TODO: use ngdoc
* Directive params:
* -> user: 'white' | 'black'
* 	 defines the user position.
*	 Impact draggable pieces (if control = user) and board position (choosen color is at bottom)
* 
* -> control: 'user' | 'all' | edit
*    if 'user', the current user can only control its pieces
*    if 'all', all pieces are draggable
*    'edit' is a special mode to edit the board, no controls are done
*/
.directive('chessBoardDirective', ['$animate', '$log', 'chessConstants', 'chessPositionService', 'chessMoveService', 
	function($animate, $log, constants, chessPositionService, chessMoveService){

	return{
		replace: true,
		transclude: false,
		scope:{
			user:'=',
			displayCoordinates:'=',
			moveMode:'=',
			displayAccessibleSquares:'=?',
			control:'=',
		},
		template:
		'<div id="chessBoardContainer">' +
		'	<div id="chessBoard" ng-class="cssClasses()">' +
		'		<chess-square-directive ' +
		'			chess-square-move ' +
		'			ng-repeat="piece in getPosition() track by $index" ' +
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
		controller: ['$scope', '$element', function($scope, $element){
			var that= this;

			$scope.getPosition= chessPositionService.getPosition;
			$scope.position= chessPositionService.getPosition();

			//Check position changes
			$scope.$watch(chessPositionService.isMoveAccepted, 
				function(newVal, oldVal){

					if (newVal === true){

						var lastMove= chessPositionService.getLastMove();

						if (lastMove){
							var sourceIndex= getIndex(lastMove.from.x, lastMove.from.y);
							var squareScope= that.squareScopes[sourceIndex];
							var imgElement= squareScope.getImage();
							var piece= $scope.position[sourceIndex];

							var diffX= (lastMove.to.x - lastMove.from.x) * imgElement[0].width;
							var diffY= (lastMove.from.y - lastMove.to.y) * imgElement[0].height;

							$animate.animate(imgElement, {top:0, left: 0}, {top: diffY + 'px', left: diffX + 'px'})
							.then(function(data){
								$scope.$apply(
									function(){
										chessPositionService.movePiece(piece, lastMove.to.x, lastMove.to.y);
									}
								);
							});
						}
					}

				});

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
			};

			this.squareScopes= [];

			$scope.isReverse= function(user){
				if (user){
					return (user === constants.user.white);
				}
			};

			this.getControl= function(){
				return $scope.control;
			};

			this.getMoveMode= function(){
				return $scope.moveMode;
			};

			this.isMovable= function(squareScope){
				if (!squareScope.isEmpty && $scope.user){

					return ($scope.control === constants.control.all) || 
						   ($scope.control === constants.control.edit) ||
						   ($scope.control === constants.control.user && squareScope.content.piece.color == $scope.user);
				}
			};

			this.registerSquareScope= function(squareScope){
				var x= squareScope.content.x,
					y= squareScope.content.y;
					this.squareScopes[y*8+x]= squareScope;
			};

			this.needCheckMoves= function(){
				return $scope.control !== constants.control.edit;
			}

			this.tryMove= function(prevX, prevY, x, y){
				var sourceIndex= getIndex(prevX, prevY);
				var piece= $scope.position[sourceIndex];
				$scope.$apply(function(){
					chessPositionService.checkMove(piece, x, y, $scope.accessibleMoves);
					that.hidePreviousMoves(true);
				});
			};

			this.addPiece= function(piece){
				$scope.$apply(function(){
					chessPositionService.addPiece(piece);
				});
			};


			//HIDE AND DISPLAY MOVES
			$scope.accessibleMoves;

			this.displayMoves= function(moves){
				if (moves){
					moves.forEach(function(move,i){
						that.squareScopes[move.y*8+move.x].content.highlight= true;
					});
				}
			};

			this.displayAccessibleMoves= function(piece){
				if (!this.needCheckMoves() || !$scope.displayAccessibleSquares){
					return;
				}
				$scope.accessibleMoves= chessMoveService.getMoves(piece);
				this.displayMoves($scope.accessibleMoves);
			};

			this.hidePreviousMoves= function(removeAccessibleMoves){
				if (!this.needCheckMoves() || !$scope.displayAccessibleSquares){
					return;
				}
				if ($scope.accessibleMoves){
					for (var i in $scope.accessibleMoves){
						move= $scope.accessibleMoves[i];
						this.squareScopes[move.y*8+move.x].content.highlight= false;
					}
					if (removeAccessibleMoves){
						$scope.accessibleMoves= undefined;
					}
				}
			};


			var leavedBoardContent= false;
			this.applyMoveMode= function(newVal, oldVal){

				if (newVal){

					switch(newVal){
						//DRAGNDROP
						case constants.moveMode.dragndrop:
							//For the board itself
							$element.on('dragenter', function(e){

								var target = e.target || e.srcElement;
								if (target === $element[0]){
									// console.log('hide');
									leavedBoardContent= true;
									$scope.$apply(function(){
										that.hidePreviousMoves(false);
									});
								}
								else{
									if (leavedBoardContent){
										leavedBoardContent= false;
										// console.log('display');
										$scope.$apply(function(){
											that.displayMoves($scope.accessibleMoves);
										});
									}
								}
							});

							break;
						//SIMPLE CLICK
						case constants.moveMode.click:
							$element.off('dragenter');
							break;
						default:
							$log.error('Unknow move mode: ' + newVal);
					}

					//For each square
					var squareScope;
					for (var i in that.squareScopes){
						squareScope= that.squareScopes[i];
						if (squareScope.applyMoveMode){
							squareScope.applyMoveMode(newVal);
						}
						else{
							$log.error('applyMoveMode undefined on square scope');
						}
					}
				}

			};

			//TREATMENTS CONCERNING MOVE MODE
			$scope.$watch('moveMode', this.applyMoveMode);
			$scope.$watch('control', function(newVal, oldVal){
				if (newVal === constants.control.edit){
					$scope.moveMode= constants.moveMode.dragndrop;
				}
			});


		}]
	};

}]);