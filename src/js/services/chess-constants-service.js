angular.module('chess.services')
.constant('chessConstants', {
	moveMode:{
		dragndrop:'dragndrop',
		click:'click'
	},
	control:{
		all:'all',
		edit:'edit',
		user:'user'
	},
	user:{
		white:'white',
		black:'black'
	}
});