angular.module('chess.directives')
.directive('chessSquareMove', ['$log', 'chessDragDropMove', 'chessClickMove', 'chessConstants',
	function($log, chessDragDropMove, chessClickMove,constants){

	return {
		require:['chessSquareDirective', '^chessBoardDirective'],
		restrict:'A',
		link:function($scope, $element, $attrs, $ctrls){

			var squareCtrl= $ctrls[0],
				boardCtrl= $ctrls[1],
				moveMode= boardCtrl.getMoveMode();

			squareCtrl.getScope().applyMoveMode= function(moveMode){
				switch(moveMode){
					case constants.moveMode.dragndrop:
						chessClickMove.deactivate($element, squareCtrl, boardCtrl);
						chessDragDropMove.activate($element, squareCtrl, boardCtrl);
						break;
					case constants.moveMode.click:
						chessDragDropMove.deactivate($element, squareCtrl, boardCtrl);					
						chessClickMove.activate($element, squareCtrl, boardCtrl);
						break;
					default:
						$log.error('unknown move mode: ' + moveMode)
						break;
				}
			};

			squareCtrl.getScope().applyMoveMode(moveMode);
		}
	};

}]);
