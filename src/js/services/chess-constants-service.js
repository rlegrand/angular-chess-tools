angular.module('chess.services')
.constant('chessConstants', {
	moveMode:{
		dragndrop:'dragndrop',
		click:'click',
		all:'all'
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