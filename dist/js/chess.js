angular.module('chess', [
	'chess.services', 'chess.controllers', 
	'chess.directives','ui.bootstrap'
])
.config([function(){}]);

angular.module('chess.controllers', []);
angular.module('chess.controllers')
.controller('mainController', ['$scope', function($scope){

	
     
}]);
angular.module('chess.directives', ['chess.services']);
angular.module('chess.directives')
.directive('chessSquareDirective', function(){

	return {
		require:'^chessBoardDirective',
		replace: true,
		transclude: false,
		scope:{
			x:'@',
			y:'@',
			piece:'?='
		},
		template: 
		' <div ' +
		'	ng-class="cssClasses" ' +
		' >' +
		' 	<img ng-if="!isEmpty" src="imgSource()" draggable="true"></img>' +
		' </div>',
		link: function($scope, element, attrs, chessBoardController){

			$scope.x= parseInt($scope.x);
			$scope.y= parseInt($scope.y);

			$scope.isEmpty= ($scope.piece !== undefined);
			$scope.imgSource= function(){
				if (!$scope.isEmpty){
					return '/imgs/' + piece.name + '_' + piece.color + '.svg';
				}
			};

			chessBoardController.registerSquareScope($scope, x, y);

			$scope.cssClasses={
				blackSquare: (x + y)%2 === 0,
				whiteSquare: !black
			};

			element.on('drop', function(e){
				var data= e.target.dataTransfer;
				chessBoardController.tryMove(data.piece,$scope.x, $scope.y);
			});


		}
	};

})
.directive('chessBoardDirective', ['chessPositionService', function(chessPositionService){

	return{
		replace: true,
		transclude: false,
		scope:{
			position:'?='
		},
		template: '',
		controller: ['$scope', function($scope){

			this.squareScopes= [];

			this.registerSquareScope= function(squareScope, x, y){
				this.squareScopes[y*8+x]= squareScope;
			};

			this.tryMove= function(piece, x, y){

				

			};
		}]
	};

}]);
angular.module('chess.services', []);
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