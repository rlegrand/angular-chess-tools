angular.module('sample', ['chess'])
.config(['chessResourcesProvider', function(resourcesProvider){

	resourcesProvider.setImgsRootPath('/imgs');

}])
.controller('mainController', ['$scope','chessPositionService','chessPieceService',
	function($scope, chessPositionService, chessPieceService){

	$scope.color='white';
	$scope.changeColor= function(){
		if ($scope.color == 'white'){
			$scope.color= 'black';
		}else{
			$scope.color= 'white';
		}
	};

	$scope.accessibleMoves= false;
	$scope.switchAccessibleMoves= function(){
		$scope.accessibleMoves= !$scope.accessibleMoves;
	}

	$scope.moveMode=  'dragndrop';
	var moveModes= ['dragndrop', 'click', 'all'],
		moveindice= 0;
	$scope.switchMoveMode= function(){
		$scope.moveMode= moveModes[++moveindice % 3];
	}

	$scope.checkMove= function(){
			var piece= chessPieceService.new('KNIGHT', 'BLACK', 1, 7);
			chessPositionService.checkMove(piece, 0, 5);
	};

	$scope.control= 'user';
	$scope.setControl= function(control){
		$scope.control= control;
	};

	$scope.isEditable= function(){
		return $scope.control === 'edit';
	}

	//Buttons actions
	$scope.buttons=[
		{
			label:'change color',
			fn:$scope.changeColor,
			desc:'Rotate the chessboard and so the user color.',
			currentVal:'color'
		},
		{
			label:'Hide/display moves',
			fn:$scope.switchAccessibleMoves,
			desc:'Display or hide the accessible moves when dragging a piece.\
			If not selected, wrong moves are possible.',
			currentVal:'accessibleMoves'
		},
		{
			label:'Change move mode',
			fn:$scope.switchMoveMode,
			desc:'Moves can be done by dragNdrop or by clicking source and target squares.',
			currentVal:'moveMode'
		},
		{
			label:'check automated move',
			fn:$scope.checkMove,
			desc:'How does the piece moves when it\'s not a user action'
		},
		{
			label:'control user',
			fn:function(){$scope.setControl('user');},
			desc:'Limit the user control to its pieces',
			currentVal:'control'
		},
		{
			label:'control all',
			fn:function(){$scope.setControl('all');},
			desc:'All pieces are movable',
			currentVal:'control'
		},
		{
			label:'edit board',
			fn:function(){$scope.setControl('edit');},
			desc:'Edit a position'
		}
	];

	$scope.setButtonActive= function(button){
		for (var i in $scope.buttons){
			$scope.buttons[i].active= false;
		}
		button.active= true;
		button.fn();
		$scope.currentVal= $scope[button.currentVal];
	}

	$scope.buttonOverLeave= function(desc, currentVal,  button){
		$scope.description= desc;
		$scope.currentVal= $scope[currentVal];
		if (desc && desc.length > 0){
			button.over= true;
		}
		else{
			button.over= false;
		}
	}
     
}]);