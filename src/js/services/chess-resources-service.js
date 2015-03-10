angular.module('chess.services')
.provider('chessResources', function(){

	var params= {
		imgsRootPath: '/imgs'
	};

	this.setImgsRootPath= function(val){
		var toSet= val;
		if (toSet !== undefined){
			if (val.substring(val.length - 1) === '/'){
				toSet= val.substring(0, val.length-1);
			}

			params.imgsRootPath= toSet;
		}
	};

	this.$get= [function(){

		var ServiceInstance= function(){
			this.getImgsRootPath= function(){
				return params.imgsRootPath;
			};


			this.getPieceImage= function(type, color){
				return this.getImgsRootPath() + '/' + type + '_' + color + '.svg';
			};

			this.getTrash= function(){
				return this.getImgsRootPath() + '/trash.svg';
			};
		};

		return new ServiceInstance();

	}];





});