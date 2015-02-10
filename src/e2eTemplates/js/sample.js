angular.module('sample', ['chess'])
.config(function(){})
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

	$scope.checkMove= function(){
			var piece= chessPieceService.new('PAWN', 'WHITE', 3, 1);
			chessPositionService.checkMove(piece, 3, 3);
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
			desc:'Rotate the chessboard and use the color at bottom'
		},
		{
			label:'Hide/display moves',
			fn:$scope.switchAccessibleMoves,
			desc:'Display or hide the accessible moves when dragging a piece'
		},
		{
			label:'check automated move',
			fn:$scope.checkMove,
			desc:'How does the piece moves when it\s not a user action'
		},
		{
			label:'control user',
			fn:function(){$scope.setControl('user');},
			desc:'Limit the user control to its pieces'
		},
		{
			label:'control all',
			fn:function(){$scope.setControl('all');},
			desc:'All pieces are movable'
		},
		{
			label:'edit board',
			fn:function(){$scope.setControl('edit');},
			desc:'Edit a pospition'
		}
	];

	$scope.setButtonActive= function(button){
		for (var i in $scope.buttons){
			$scope.buttons[i].active= false;
		}
		button.active= true;
	}

	$scope.buttonOverLeave= function(desc, button){
		$scope.description= desc;
		if (desc && desc.length > 0){
			button.over= true;
		}
		else{
			button.over= false;
		}
	}
     
}]);