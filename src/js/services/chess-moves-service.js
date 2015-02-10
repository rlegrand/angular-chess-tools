angular.module('chess.services')
.factory('chessMoveService', ['chessPositionService', function(chessPositionService){


	var generateLeft= function(x, y){
		var res= [];
		for (var xx= x-1; xx>=0; xx--){
			res.push([xx, y]);
		}
		return res;
	};

	var generateRight= function(x, y){
		var res= [];
		for (var xx= x+1; xx<=7; xx++){
			res.push([xx, y]);
		}
		return res;
	};

	var generateBottom= function(x, y){
		var res= [];
		for (var yy= y-1; yy>=0; yy--){
			res.push([x, yy]);
		}	
		return res;	
	};

	var generateTop= function(x, y){
		var res= [];
		for (var yy= y+1; yy<=7; yy++){
			res.push([x, yy]);
		}	
		return res;	
	};

	var generateTopLeft= function(x, y){
		var res= [];
		var indice= 0;
		for(var xx= x-1; xx>=0; xx--){
			indice++;
			if (y+indice > 7){
				break;
			}
			res.push([xx, y+indice]);
		}
		return res;
	};

	var generateBottomLeft= function(x, y){
		var res= [];
		var indice= 0;
		for(var xx= x-1; xx>=0; xx--){
			indice++;
			if (y-indice < 0){
				break;
			}
			res.push([xx, y-indice]);
		}
		return res;
	};

	var generateBottomRight= function(x, y){
		var res= [];
		var indice= 0;
		for(var xx= x+1; xx<=7; xx++){
			indice++;
			if (y-indice < 0){
				break;
			}
			res.push([xx, y-indice]);
		}
		return res;
	};

	var generateTopRight= function(x, y){
		var res= [];
		var indice= 0;
		for(var xx= x+1; xx<=7; xx++){
			indice++;
			if (y+indice > 7){
				break;
			}
			res.push([xx, y+indice]);
		}
		return res;
	};	

	var generateKnight= function(x,y){

		var res= [];

		var deps= [[1,2], [1,-2], [2,1], [2,-1], [-1,2], [-1,-2],[-2,1], [-2, -1]],
			dep;

		for (var i in deps){
			dep= deps[i];
			if  ( (x + dep[0] >=0 ) && (x + dep[0] <=7 ) && (y + dep[1] >=0 ) && (y + dep[1] <=7)){
				res.push([x+dep[0], y+dep[1]]);
			};

		}
		return res;
	};

	//Is the square (defined by the position of the piece) is
	// accessible by colorType
	var isSquareAccessible= function(x, y, colorType, position){
			if (!(x >= 0 && x<8 && y >= 0 && y<8 )){
				return false;
			}
			var piece= chessPositionService.getPiece(x, y, position);
			return !piece || ( (piece.colorType !== colorType) && (piece.type !== 'KING') ) 
	};

	var kingMoves= function(colorType, coords, position){
		var res= [];
		var deps= [[-1, -1], [-1, 0], [-1, 1], [0,1], [1, 1], [1, 0], [1, -1], [0, -1]];
		for (var i in deps){
			var dep= deps[i];
				x= coords.x + dep[0], 
				y= coords.y + dep[1];

			if (isSquareAccessible(x, y, colorType, position)){
				res.push({x:x, y:y});
			}
		}

		return res;
	};

	var queenMoves= function(colorType, coords, position){
		var res= [];

		var movesByDir= [
				generateLeft(coords.x, coords.y),
				generateRight(coords.x, coords.y),
				generateTop(coords.x, coords.y),
				generateBottom(coords.x, coords.y),
				generateTopLeft(coords.x, coords.y),
				generateTopRight(coords.x, coords.y),
				generateBottomLeft(coords.x, coords.y),
				generateBottomRight(coords.x, coords.y)
			];

		for (var i in movesByDir){
			var dirMoves= movesByDir[i];
			for (var j in dirMoves){
				var currentMove= dirMoves[j],
					nextCoords= {x: currentMove[0], y: currentMove[1]};
				if (isSquareAccessible(nextCoords.x, nextCoords.y, colorType, position)){
					res.push(nextCoords);
					//TODO: modifier la valeur de retour de isSquareAccessible pour
					// gerer les cas directement
					var piece= chessPositionService.getPiece(nextCoords.x, nextCoords.y, position);
					if (piece !== undefined){
						break;
					}					
				}else{
					break;
				}
			}
		}

		return res;
	};

	var rookMoves= function(colorType, coords, position){
		var res= [];

		var movesByDir= [
				generateLeft(coords.x, coords.y),
				generateRight(coords.x, coords.y),
				generateTop(coords.x, coords.y),
				generateBottom(coords.x, coords.y)
			];

		for (var i in movesByDir){
			var dirMoves= movesByDir[i];
			for (var j in dirMoves){
				var currentMove= dirMoves[j],
					nextCoords= {x: currentMove[0], y: currentMove[1]};
				if (isSquareAccessible(nextCoords.x, nextCoords.y, colorType, position)){
					res.push(nextCoords);
					//TODO: modifier la valeur de retour de isSquareAccessible pour
					// gerer les cas directement
					var piece= chessPositionService.getPiece(nextCoords.x, nextCoords.y, position);
					if (piece !== undefined){
						break;
					}					
				}else{
					break;
				}
			}
		}

		return res;
	};

	var bishopMoves= function(colorType, coords, position){
		var res= [];

		var movesByDir= [
				generateTopLeft(coords.x, coords.y),
				generateBottomLeft(coords.x, coords.y),
				generateTopRight(coords.x, coords.y),
				generateBottomRight(coords.x, coords.y)
			];

		for (var i in movesByDir){
			var dirMoves= movesByDir[i];
			for (var j in dirMoves){
				var currentMove= dirMoves[j],
					nextCoords= {x: currentMove[0], y: currentMove[1]};
				if (isSquareAccessible(nextCoords.x, nextCoords.y, colorType, position)){
					res.push(nextCoords);
					//TODO: modifier la valeur de retour de isSquareAccessible pour
					// gerer les cas directement
					var piece= chessPositionService.getPiece(nextCoords.x, nextCoords.y, position);
					if (piece !== undefined){
						break;
					}
				}else{
					break;
				}
			}
		}

		return res;
	};

	//TODO: A commpleter, petit roque
	var knightMoves= function(colorType, coords, position){
		var res= [];
		var nextCoords= generateKnight(coords.x, coords.y);
		for (var i in nextCoords){
			var currentMove= nextCoords[i],
				x= currentMove[0], 
				y= currentMove[1];
			if (isSquareAccessible(x, y, colorType, position)){
				res.push({x:x, y:y});
			}
		}

		return res;
	};

	//TODO: A commpleter: prise en passant, etc..
	var pawnMoves= function(colorType, coords, position){
		var res= [];
		// First or last line
		if (
				(coords.y === 0 && colorType === 'BLACK') ||
				(coords.y === 7 && colorType === 'WHITE')
			){
			return res;
		}else{
			//just in front
			var newY= (colorType === 'WHITE'? coords.y + 1:coords.y - 1);
			var piece= chessPositionService.getPiece(coords.x, newY, position);
			if (!piece){
				res.push({x: coords.x, y: newY});
			}
			//Jump 2 cases?
			if ( !piece &&
					(
						(coords.y === 1 && colorType === 'WHITE') ||
						(coords.y === 6 && colorType === 'BLACK')
					)
			){
				newY= (colorType === 'WHITE'? coords.y +2: coords.y -2);
				piece= chessPositionService.getPiece(coords.x, newY, position);
				if (!piece){
					res.push({x:coords.x, y: newY});
				}
			}
			//Can take a piece?
			var leftCoord, rightCoord,
				leftPiece, rightPiece;
			if (coords.x>0){
				leftCoord= {x: coords.x-1, y: (colorType === 'WHITE'? coords.y+1: coords.y-1)};
			}
			if (coords.x<7){
				rightCoord= {x: coords.x+1, y: (colorType === 'WHITE'? coords.y+1: coords.y-1)};
			}
			if (leftCoord){
				leftPiece= chessPositionService.getPiece(leftCoord.x, leftCoord.y, position);
				if (leftPiece && leftPiece.colorType !== colorType){
					res.push(leftCoord);
				}
			}
			if (rightCoord){
				rightPiece= chessPositionService.getPiece(rightCoord.x, rightCoord.y, position);
				if (rightPiece && rightPiece.colorType !== colorType){
					res.push(rightCoord);
				}
			}
			//TODO: prise en passant
		}

		return res;
	};


	var getPotentialMoves= function(pieceType, colorType, coords, position){

		var res= [];

		switch(pieceType){
			case 'KING': 
				return kingMoves(colorType, coords, position);
			break;
			case 'QUEEN':
				return queenMoves(colorType, coords, position);
			break;
			case 'ROOK': 
				return rookMoves(colorType, coords, position);
			break;
			case 'BISHOP': 
				return bishopMoves(colorType, coords, position);
			break;
			case 'KNIGHT': 
				return knightMoves(colorType, coords, position);
			break;
			case 'PAWN': 
				return pawnMoves(colorType, coords, position);
			break;
		};

	};

	var isChess= function(position, colorType){
		var theKing= chessPositionService.getKing(colorType, position);
		var pieceTypes= ['PAWN', 'ROOK', 'BISHOP', 'KNIGHT', 'QUEEN'];
		for (var i in pieceTypes){
			var pieceType= pieceTypes[i];
			var moves= getPotentialMoves(pieceType, colorType, {x:theKing.x, y:theKing.y}, position);
			for (var i in moves){
				var move= moves[i];
				var inFrontPiece= chessPositionService.getPiece(move.x, move.y, position);
				if (inFrontPiece && inFrontPiece.colorType !== colorType && inFrontPiece.type === pieceType){
					return true;
				}
			}
		}
	};


	var getMoves= function(piece){

		var res=[];

		var moves= getPotentialMoves(piece.type, piece.colorType, {x:piece.x, y:piece.y}, chessPositionService.getPosition());
		if (moves && moves.length > 0){
			//temporarily remove the given piece
			var position= chessPositionService.clonePosition();
			chessPositionService.dropPiece(piece, position);
			//Check if thhe user is chess without this piece
			var canBeChess= undefined;
			if (piece.type !== 'KING'){
				canBeChess= isChess(position, piece.colorType);
			}
			chessPositionService.unclonePosition(position);
			var checkPossibleChess= canBeChess || piece.type === 'KING',
				clonedPiece;

			for (var i in moves){
				var move= moves[i];
				//If a chess is possible, we have to check that this move doesn't imply a chess
				if (checkPossibleChess){
					position= chessPositionService.clonePosition();
					clonedPiece= chessPositionService.getPiece(piece.x, piece.y, position);
					chessPositionService.movePiece(clonedPiece, move.x, move.y, position);
					if (!isChess(position, clonedPiece.colorType)){
						res.push(move);
					}
					chessPositionService.unclonePosition(position);
				}else{
					res.push(move);
				}
			}
		}

		return res;
	}

	var ChessMovesService= function(){
		this.getMoves= getMoves;

	};

	return new ChessMovesService();
}]);