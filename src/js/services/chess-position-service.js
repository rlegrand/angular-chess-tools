angular.module('chess.services')
.provider('chessPositionService', ['chessPieceService', function(PieceSerice){


	var position=[], 
		isInitialized= false;

	//Make the service configurable by setting
	//a custom position
	this.setPosition= function(initiaPosition){
		position= initiaPosition;
		isInitialized= true;
	};

	var addPiece= function(piece){

		var x= piece.x,
			y= piece.y;
			indice= y*8+x;

		position[indice]= piece;
	};

	var dropPiece= function(piece){

		var x= piece.x,
			y= piece.y;
			indice= y*8+x;

		position[indice]= undefined;
	};

	var movePiece= function(piece, x, y){

		var startX= piece.x,
			startY= piece.y;
			sourceInd= startY*8+startX;

		position[sourceInd]= undefined;
		piece.setPosition(x, y);
		addPiece(piece);
	};

	var getPiece= function(x,y){
		return position[y*8+x];
	};


	var initPosition= function(){
		if (!isInitialized){
			var x;
			//PAWNS
			for (x= 0; x< 8; x++){
				addPiece( PieceSerice.new(PieceSerice.PAWN), PieceSerice.WHITE, x, 1);
				addPiece( PieceSerice.new(PieceSerice.PAWN), PieceSerice.BLACK, x, 6);
			}
			//TOWERS
			for(x in [0, 7]){
				addPiece( PieceSerice.new(PieceSerice.ROOK), PieceSerice.WHITE, x, 0);
				addPiece( PieceSerice.new(PieceSerice.ROOK), PieceSerice.BLACK, x, 7);
			}
			//BISHOPS
			for(x in [2, 5]){
				addPiece( PieceSerice.new(PieceSerice.BISHOP), PieceSerice.WHITE, x, 0);
				addPiece( PieceSerice.new(PieceSerice.BISHOP), PieceSerice.BLACK, x, 7);
			}

			//KNIGHTS
			for(x in [1, 6]){
				addPiece( PieceSerice.new(PieceSerice.KNIGHT), PieceSerice.WHITE, x, 0);
				addPiece( PieceSerice.new(PieceSerice.KNIGHT), PieceSerice.BLACK, x, 7);
			}
			//QUEENS
			addPiece( PieceSerice.new(PieceSerice.QUEEN), PieceSerice.QUEEN, 3, 0);
			addPiece( PieceSerice.new(PieceSerice.QUEEN), PieceSerice.QUEEN, 3, 7);
			//KING
			addPiece( PieceSerice.new(PieceSerice.KING), PieceSerice.QUEEN, 4, 0);
			addPiece( PieceSerice.new(PieceSerice.KING), PieceSerice.QUEEN, 4, 7);
		}
	};


	this.$get=function(){

		initPosition();

		var ChessPositionService= function(){
			this.getPiece= getPiece;
			this.movePiece= movePiece;
			this.dropPiece= dropPiece;
		};

		return new chessPositionService();
	};

}]);