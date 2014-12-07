angular.module('chess.services')
.service('chessPieceService', function(){
	return function(){

		var that= this;

		this.types= {
			KING:'king',
			QUEEN:'queen',
			ROOK: 'rook',
			BISHOP: 'bishop',
			KNIGHT: 'knight',
			PAWN: 'pawn'
		};

		this.colors= {
			WHITE:'white',
			BLACK:'black'
		};

		var Piece= function(name, color, x, y){
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

			return new Piece(name, color, x, y);
		};

		this.setPosition= function(x, y){
			if (x < 0 || x > 7 || y < 0 || y > 7){
				throw "Position unauthorized : (" + x +',' + y + ')'; 
			}

			this.x= x;
			this.y= y;
		};

	};
});