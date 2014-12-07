angular.module('chess.services')
.provider('chessPositionService', function(){


	var position=[], 
		isInitialized= false;

	//Make the service configurable by setting
	//a custom position
	this.setPosition= function(initiaPosition){
		position= initiaPosition;
		isInitialized= true;
	};


	this.$get=['chessPieceService', function(PieceService){

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
				var x, i, set;
				//PAWNS
				for (x= 0; x< 8; x++){
					addPiece( PieceService.new('PAWN', 'WHITE', x, 1));
					addPiece( PieceService.new('PAWN', 'BLACK', x, 6));
				}
				//TOWERS
				for(i= 0, set=[0, 7]; i < set.length; i++){
					addPiece( PieceService.new('ROOK', 'WHITE', set[i], 0));
					addPiece( PieceService.new('ROOK', 'BLACK', set[i], 7));
				}
				//BISHOPS
				for(i= 0, set=[2, 5];  i < set.length; i++){
					addPiece( PieceService.new('BISHOP', 'WHITE', set[i], 0));
					addPiece( PieceService.new('BISHOP', 'BLACK', set[i], 7));
				}

				//KNIGHTS
				for(i= 0, set=[1, 6];  i < set.length; i++){
					addPiece( PieceService.new('KNIGHT', 'WHITE', set[i], 0));
					addPiece( PieceService.new('KNIGHT', 'BLACK', set[i], 7));
				}

				//QUEENS
				addPiece( PieceService.new('QUEEN', 'WHITE', 3, 0));
				addPiece( PieceService.new('QUEEN', 'BLACK', 3, 7));

				//KING
				addPiece( PieceService.new('KING', 'WHITE', 4, 0));
				addPiece( PieceService.new('KING', 'BLACK', 4, 7));
			}
		};		

		var ChessPositionService= function(){
			initPosition();
			this.getPiece= getPiece;
			this.movePiece= movePiece;
			this.dropPiece= dropPiece;
		};

		return new ChessPositionService();
	}];

});