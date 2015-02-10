angular.module('chess.directives')
.directive('chessDraggablePieceDirective', [ function(){

	return {
		restrict:'A',
		scope:{
			type:'@',
			color:'@'
		},
		link:function($scope, element, attrs){
			element.on('dragstart', function(e){
				var data='out ' + $scope.type + ' ' + $scope.color;
				e.dataTransfer.setData('piece', data);
			});
		}
	};
}])
.directive('chessDroppableTrash', ['chessPositionService', function(chessPositionService){

	return {
		restrict:'A',
		scope:{},
		link:function($scope, element, attrs){

			element.on('dragover', function(e){
			  if (e.preventDefault) {
			    e.preventDefault(); // Necessary. Allows us to drop.
			  }
			});

			//Update the chessboard when the piece is dropped
			element.on('drop', function(e){
				e.stopPropagation();
				var data= e.dataTransfer.getData('piece');
				if (data !== undefined){
					var splited= data.split(' '),
						mode= splited[0];
					
					//The piece comes from the board
					if (mode === 'in'){
						var prevX= parseInt(splited[1]),
							prevY= parseInt(splited[2]);
						// And the user can only move its pieces
						$scope.$apply(function(){
							chessPositionService.dropPosition(prevX, prevY);
						});
					}
				}
			});
		}
	};
}])
.directive('chessEditBoardDirective', ['chessPieceService','chessPositionService',
	function(chessPieceService, chessPositionService, $animate){

	return{
		restrict:'E',
		replace: true,
		transclude: false,
		scope:{},
		template:
		'<ul class="editBoardContainer"style="list-style-type: none;">' +
		'	<button ng-click="clearBoard()">clear board</button>' +
		'	<li ng-repeat="(keyType, type) in types">' +
		'		<ul> ' +
		'			<li ' +
		'				class="editsquare" ' +
		'				style="display:inline-block;" '+
		'				ng-repeat="(keyColor, color) in colors" ' +
		'			> ' +
		'           	<img ' +
		'					ng-src="{{imgSource(type, color)}}" ' +
		'					draggable="true" ' +
		'					chess-draggable-piece-directive ' +
		'					type="{{keyType}}" ' +
		'					color="{{keyColor}}" ' +
		'				/> ' +
		'			</li>' +
		'		</ul> ' +
		'	</li>' +
		'	<li class="trash" chess-droppable-trash>' +
		'		<img src="/imgs/trash.svg" />' +
		'	</li>' +
		'</div>'
		,
		link: function($scope, element){
			$scope.types= chessPieceService.types;
			$scope.type='KING';
			$scope.colors= chessPieceService.colors;

			$scope.imgSource= function(type, color){
				return '/imgs/' + type + '_' + color + '.svg';
			};

			$scope.clearBoard= function(){
				chessPositionService.clearPosition();
			};

		}
	};

}]);