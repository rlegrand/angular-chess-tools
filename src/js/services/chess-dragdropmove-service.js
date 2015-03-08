angular.module('chess.services')
.factory('chessDragDropMove', ['chessPieceService', 'chessConstants',
	 function(chessPieceService, constants){

	var DragAndDropMove= function(){

		this.activate= function($element, squareCtrl, boardCtrl){

			//ABOUT DRAG AND DROP
			$element.on('dragover', function(e){

			  if (e.preventDefault) {
			    e.preventDefault(); // Necessary. Allows us to drop.
			  }

			});
			//Change the style when dragging on top of a square

			$element.on('dragenter', function(e){
			  this.classList.add('overSquare');
			  // e.stopPropagation();
			});

			//Remove the style when leaving the square
			$element.on('dragleave', function(e) {
			  this.classList.remove('overSquare');
			  e.stopPropagation();
			});

			$element.on('dragstart', function(e){
				var squareScope= squareCtrl.getScope(),
					data='in ' + squareScope.content.piece.x + ' ' + squareScope.content.piece.y,
					img= squareScope.getImage()[0],
					offsetx= img.width/2,
					offsetY= img.height/2;

				e.dataTransfer.setData('piece', data);
				e.dataTransfer.setDragImage(img, offsetx, offsetY);
				squareScope.$apply(function(){
					boardCtrl.displayAccessibleMoves(squareScope.content.piece);
				});
			});

			//Update the chessboard when the piece is dropped
			$element.on('drop', function(e){
				if (e.preventDefault){e.preventDefault();}
				if (e.stopPropagation){e.stopPropagation();}

				this.classList.remove('overSquare');
				var prevPos= e.dataTransfer.getData('piece');

				if (prevPos !== undefined){
					var splited= prevPos.split(' '),
						mode= splited[0],
						control= boardCtrl.getControl(),
						squareScope= squareCtrl.getScope();
					
					//The piece comes from the board
					if (mode === 'in'){
						var prevX= parseInt(splited[1]),
							prevY= parseInt(splited[2]);
						// And the user can only move its pieces
						boardCtrl.tryMove(prevX, prevY, squareScope.content.x, squareScope.content.y);
					}else if (mode === 'out' && control === constants.control.edit){
						var type= splited[1],
							color= splited[2];
							piece= chessPieceService.new(type, color,  squareScope.content.x, squareScope.content.y);
						boardCtrl.addPiece(piece);
					}
				}
			});			

		};


		this.deactivate= function($element, squareCtrl, boardCtrl){

			$element.off('dragover');
			$element.off('dragenter');
			$element.off('dragleave');
			$element.off('dragstart');
			$element.off('drop');
		};

	};


	return new DragAndDropMove();

}])