angular.module('chess.services')
.factory('chessPieceService', function(){
	var ChessPieceService= function(){

		var that= this;

		this.types= {
			'KING':'king',
			'QUEEN':'queen',
			'ROOK': 'rook',
			'BISHOP': 'bishop',
			'KNIGHT': 'knight',
			'PAWN': 'pawn'
		};

		this.colors= {
			WHITE:'white',
			BLACK:'black'
		};

		var getType= function(typeValue){
			for (var key in that.types){
				if (that.types[key] === typeValue){
					return key;
				}
			}
		};

		var getColor= function(colorValue){
			for (var key in that.colors){
				if (that.colors[key] === colorValue){
					return key;
				}
			}
		};

		var Piece= function(name, color, x, y){
			this.type=getType(name);
			this.colorType= getColor(color);
			this.name= name;
			this.color= color;
			this.x= x;
			this.y= y;
		};

		this.new= function(name, color, x, y){

			if (that.types[name] === undefined){
				throw "Unknown piece name :" + name;
			}

			if (that.colors[color] === undefined){
				throw 'Unknown color :' + color;
			}

			if (x < 0 || x > 7 || y < 0 || y > 7){
				throw "Position unauthorized : (" + x +',' + y + ')'; 
			}
			//TODO, revoir les constructeur: type -> valeur -> type...
			return new Piece(that.types[name], that.colors[color], x, y);
		};

		this.clone= function(piece){
			return that.new(piece.type, piece.colorType, piece.x, piece.y);
		}

		this.fromData= function(pieceData){
			return new Piece(pieceData.name, pieceData.color, pieceData.x, pieceData.color);
		}

		this.setPosition= function(piece, x, y){
			if (x < 0 || x > 7 || y < 0 || y > 7){
				throw "Position unauthorized : (" + x +',' + y + ')'; 
			}

			piece.x= x;
			piece.y= y;
		};

	};

	return new ChessPieceService();
});