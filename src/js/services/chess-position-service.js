angular.module('chess.services')
.provider('chessPositionService', function(){


	var position=[], 
		isInitialized= false,
		whiteKing, blackKing,
		clonnedStates= [];



	//Make the service configurable by setting
	//a custom position
	this.setPosition= function(initiaPosition){
		position= initiaPosition;
		isInitialized= true;
	};


	this.$get=['chessPieceService', function(PieceService){

		var initPosition= function(){
			if (!isInitialized){
				var x, i, set;

				//Default to undefined
				for(i= 0; i< 64; i++){
					position.push(undefined);
				}

				//PAWNS
				for (x= 0; x< 8; x++){
					addPiece( PieceService.new('PAWN', 'WHITE', x, 1));
					addPiece( PieceService.new('PAWN', 'BLACK', x, 6));
				}
				//ROOKS
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
				whiteKing= PieceService.new('KING', 'WHITE', 4, 0);
				blackKing= PieceService.new('KING', 'BLACK', 4, 7);
				addPiece(whiteKing);
				addPiece(blackKing);
			}
		};

		var addPiece= function(piece, extPos){

			var posToUse= extPos? extPos: position;

			var x= piece.x,
				y= piece.y;
				indice= y*8+x;

			posToUse[indice]= piece;
		};

		var dropPosition= function(x, y, extPos){
			var posToUse= extPos? extPos: position;

			posToUse[y*8+x]= undefined;
		};		

		var dropPiece= function(piece, extPos){
			dropPosition(piece.x, piece.y, extPos);
		};

		var getLastMove= function(){
			return this.lastMove;
		};

		var moveAccepted= false;
		var isMoveAccepted= function(){
			return moveAccepted;
		};

		var checkMove= function(piece, x, y){
			this.lastMove= {
				from: {x: piece.x, y: piece.y},
				to:{x: x, y: y}
			};

			moveAccepted= true;
		};

		var movePiece= function(piece, x, y, extPos){
			var posToUse= extPos? extPos: position,
				startX= piece.x,
				startY= piece.y;
				sourceInd= startY*8+startX;

			posToUse[sourceInd]= undefined;
			PieceService.setPosition(piece, x, y);
			addPiece(piece, posToUse);
			moveAccepted= false;
		};

		var getPosition= function(){
			return position
		};

		var getPiece= function(x,y, extPos){
			posToUse= extPos? extPos: position;
			return posToUse[y*8+x];
		};

		//TODO: Utliser extPos
		//TODO: utiliser une structure {position: position, whiteKing: whiteKing ...}
		//TODO: Rajouter une methode pour supprimer cette strucutre
		//TODO: utiliser cette structure aussi pour la position standard
		var getKing= function(colorType, extPos){
			var useWhiteKing, useBlackKing;
			if (extPos){
				for (var i in clonnedStates){
					var clonedState= clonnedStates[i];
					if (clonedState.position === extPos){
						useWhiteKing= clonedState.whiteKing;
						useBlackKing= clonedState.blackKing;
					}
				}
			}else{
				useWhiteKing= whiteKing;
				useWhiteKing= blackKing;
			}

			if (colorType === 'WHITE'){
				return useWhiteKing;
			}else{
				return useBlackKing;
			}
		}

		var setNewPosition= function(newPosition){
			position= newPosition;
		}

		var clearPosition= function(){
			for (var i in position){
				position[i]= undefined;
			}
		}

		var clonePosition= function(){
			var newPos= [],
				piece,
				newBlackKing,
				newWhiteKing;

			for (var i in position){
				piece= position[i];
				if (piece){
					piece= PieceService.clone(piece);

					if (piece.type === 'KING'){
						if (piece.colorType === 'WHITE'){
							newWhiteKing= piece;
						}
						else{
							newBlackKing= piece;
						}
					}
				}
				newPos.push(piece);
			}

			clonnedStates.push({
				whiteKing: newWhiteKing,
				blackKing: newBlackKing,
				position: newPos
			});

			return newPos;
		}

		var unclonePosition= function(position){
			for (var i in clonnedStates){
				var clonedState= clonnedStates[i];
				if (clonedState.position === position){
					clonnedStates.splice(i, 1);
					break;
				}
			}
		};

		//The service definition methods
		var ChessPositionService= function(){
			initPosition();
			this.addPiece= addPiece;
			this.dropPosition= dropPosition;
			this.dropPiece= dropPiece;
			this.getLastMove= getLastMove;
			this.isMoveAccepted= isMoveAccepted;
			this.checkMove= checkMove;
			this.movePiece= movePiece;
			this.getPosition= getPosition;
			this.getPiece= getPiece;
			this.getKing= getKing;
			this.setNewPosition= setNewPosition;
			this.clearPosition= clearPosition;
			this.clonePosition= clonePosition;
			this.unclonePosition= unclonePosition;
		};

		return new ChessPositionService();
	}];

});