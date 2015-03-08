angular.module('chess.services')
.factory('clickTracker', function(){
	var ClickTracker= function(){
		var x, y;

		this.setX= function(val){x= val;};
		this.getX= function(){return x;};
		this.setY= function(val){y= val;};
		this.getY= function(){return y;};

		this.reset= function(){x=y= undefined;}

	};

	return new ClickTracker();
})
.factory('chessClickMove', ['clickTracker', function(clickTracker){

	var ClickMove= function(){

		this.activate= function($element, squareCtrl, boardCtrl){

			$element.on('click', function(e){
				var prevX= clickTracker.getX(),
					prevY= clickTracker.getY(),
					squareScope= squareCtrl.getScope(),
					piece= squareScope.content.piece;

				//Ne piece where user click,
				// Either destination for the previous piece,
				// or nothing to do
				if ( prevX===undefined || prevY===undefined){
					//No sense, nothing to do
					if (!piece){
						return;
					}
					//Initiate a move
					else{
						if (squareScope.isMovable()){
							clickTracker.setX(piece.x);
							clickTracker.setY(piece.y);
							squareScope.$apply(function(){
								boardCtrl.displayAccessibleMoves(squareScope.content.piece);
							});
						}
					}
				}

				else{
					//Try click coords as a destination
					clickTracker.reset();
					boardCtrl.tryMove(prevX, prevY, squareScope.content.x, squareScope.content.y);
				}
			});

		};

		this.deactivate= function($element, squareCtrl, boardCtrl){

			$element.off('click');

		};
		
	};

	return new ClickMove();
}]);