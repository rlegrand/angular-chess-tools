angular.module('chess.directives')
.directive('chessSquareDirective', function(){

	return {
		require:'^chessBoardDirective',
		replace: true,
		transclude: false,
		scope:{
			x:'@',
			y:'@',
			piece:'=?'
		},
		template: 
		' <div ' +
		'	ng-class="cssClasses" ' +
		' >' +
		' 	<img ng-if="!isEmpty" ng-src="{{imgSource()}}" draggable="{{draggable}}"></img>' +
		' </div>',
		link: function($scope, element, attrs, chessBoardController){

			$scope.x= parseInt($scope.x);
			$scope.y= parseInt($scope.y);

			$scope.cssClasses={
				square: true,
				blackSquare: ( ($scope.x + $scope.y)%2 === 0 ),
				whiteSquare: ( ($scope.x + $scope.y)%2 === 1 ),
				firstOfLine: ( $scope.x === 0 )
			};

			$scope.isEmpty= ($scope.piece === undefined);

			$scope.imgSource= function(){
				if (!$scope.isEmpty){
					return '/imgs/' + $scope.piece.name + '_' + $scope.piece.color + '.svg';
				}
			};

			//ABOUT DRAG AND DROP

			element.on('dragover', function(e){

			  if (e.preventDefault) {
			    e.preventDefault(); // Necessary. Allows us to drop.
			  }

			});

			//Change the style when dragging on top of a square

			element.on('dragenter', function(e){
			  this.classList.add('overSquare');
			});

			//Remove the style when leaving the square
			element.on('dragleave', function(e) {
				console.log('dragleave');
			  this.classList.remove('overSquare'); 
			});

			//Update the chessboard when the piece is dropped
			element.on('drop', function(e){
				e.stopPropagation();
				this.classList.remove('overSquare');
				var data= e.dataTransfer.getData('piece');
				if (data !== undefined){
					chessBoardController.tryMove(data.piece,$scope.x, $scope.y);
				}
			});

			$scope.activateDrag= function(){
				$scope.draggable= true;
				/*
				var fn= function(){$scope.draggable= true;};
				if (withApply){$scope.$apply(fn);}
				else{
					fn();
				}*/
			};

			$scope.disableDrag= function(){
				$scope.draggable= false;
				/*
				var fn= function(){$scope.draggable= false;};
				if (withApply){$scope.$apply(fn);}
				else{
					fn();
				}*/
			};



			chessBoardController.registerSquareScope($scope);


		}
	};

});