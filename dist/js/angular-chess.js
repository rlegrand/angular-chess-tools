angular.module('chess', [
	'chess.services', 'chess.controllers', 
	'chess.directives','chess.filters',
	'ngAnimate'
])
.config([function(){}]);

angular.module('chess.controllers', []);
angular.module('chess.directives', ['chess.services']);
angular.module('chess.directives')
/**
* TODO: use ngdoc
* Directive params:
* -> user: 'white' | 'black'
* 	 defines the user position.
*	 Impact draggable pieces (if control = user) and board position (choosen color is at bottom)
* 
* -> control: 'user' | 'all' | edit
*    if 'user', the current user can only control its pieces
*    if 'all', all pieces are draggable
*    'edit' is a special mode to edit the board, no controls are done
*/
.directive('chessBoardDirective', ['$animate', '$log', 'chessConstants', 'chessPositionService', 'chessMoveService', 
	function($animate, $log, constants, chessPositionService, chessMoveService){

	return{
		replace: true,
		transclude: false,
		scope:{
			user:'=',
			displayCoordinates:'=',
			moveMode:'=',
			displayAccessibleSquares:'=?',
			control:'=',
		},
		template:
		'<div id="chessBoardContainer">' +
		'	<div id="chessBoard" ng-class="cssClasses()">' +
		'		<chess-square-directive ' +
		'			chess-square-move ' +
		'			ng-repeat="piece in getPosition() track by $index" ' +
		'			x="{{getX($index)}}" ' +
		'			y="{{getY($index)}}" ' +
		'			piece="{{piece}}" ' +
		'			reverse="{{isReverse(user)}}" ' +
		'		> ' +
		'	</div> ' +
		'	<div id="rightCoordinates" ng-if="displayCoordinates" ng-class="cssClasses()"> ' +
		'		<div ng-repeat="indice in [] | range:8 | increment:1" ng-class="cssClasses()">{{indice}}</div> ' +
		'	</div> ' +
		'	<div id="bottomCoordinates"  ng-if="displayCoordinates" ng-class="cssClasses()"> ' +
		'		<div ng-repeat="indice in [] | range:8 | asLetter | reverse" ng-class="cssClasses()">{{indice}}</div> ' +
		'	</div> ' +
		'</div>'
		,
		controller: ['$scope', '$element', function($scope, $element){
			var that= this;

			$scope.getPosition= chessPositionService.getPosition;
			$scope.position= chessPositionService.getPosition();

			//Check position changes
			$scope.$watch(chessPositionService.isMoveAccepted, 
				function(newVal, oldVal){

					if (newVal === true){

						var lastMove= chessPositionService.getLastMove();

						if (lastMove){
							var sourceIndex= getIndex(lastMove.from.x, lastMove.from.y);
							var squareScope= that.squareScopes[sourceIndex];
							var imgElement= squareScope.getImage();
							var piece= $scope.position[sourceIndex];

							var diffX= (lastMove.to.x - lastMove.from.x) * imgElement[0].width;
							var diffY= (lastMove.from.y - lastMove.to.y) * imgElement[0].height;

							$animate.animate(imgElement, {top:0, left: 0}, {top: diffY + 'px', left: diffX + 'px'})
							.then(function(data){
								$scope.$apply(
									function(){
										chessPositionService.movePiece(piece, lastMove.to.x, lastMove.to.y);
									}
								);
							});
						}
					}

				});

			$scope.cssClasses= function(){
				return {
					reverse:$scope.isReverse($scope.user)
				};
			};

			$scope.getX= function(index){
				return index % 8;
			};

			$scope.getY= function(index){
				return Math.floor(index / 8);
			};

			var getIndex= function(x, y){
				return y*8+x;
			};

			this.squareScopes= [];

			$scope.isReverse= function(user){
				if (user){
					return (user === constants.user.white);
				}
			};

			this.getControl= function(){
				return $scope.control;
			};

			this.getMoveMode= function(){
				return $scope.moveMode;
			};

			this.isMovable= function(squareScope){
				if (!squareScope.isEmpty && $scope.user){

					return ($scope.control === constants.control.all) || 
						   ($scope.control === constants.control.edit) ||
						   ($scope.control === constants.control.user && squareScope.content.piece.color == $scope.user);
				}
			};

			this.registerSquareScope= function(squareScope){
				var x= squareScope.content.x,
					y= squareScope.content.y;
					this.squareScopes[y*8+x]= squareScope;
			};

			this.needCheckMoves= function(){
				return $scope.control !== constants.control.edit;
			}

			this.tryMove= function(prevX, prevY, x, y){
				var sourceIndex= getIndex(prevX, prevY);
				var piece= $scope.position[sourceIndex];
				$scope.$apply(function(){
					chessPositionService.checkMove(piece, x, y, $scope.accessibleMoves);
					that.hidePreviousMoves(true);
				});
			};

			this.addPiece= function(piece){
				$scope.$apply(function(){
					chessPositionService.addPiece(piece);
				});
			};


			//HIDE AND DISPLAY MOVES
			$scope.accessibleMoves;

			this.displayMoves= function(moves){
				if (moves){
					moves.forEach(function(move,i){
						that.squareScopes[move.y*8+move.x].content.highlight= true;
					});
				}
			};

			this.displayAccessibleMoves= function(piece){
				if (!this.needCheckMoves() || !$scope.displayAccessibleSquares){
					return;
				}
				$scope.accessibleMoves= chessMoveService.getMoves(piece);
				this.displayMoves($scope.accessibleMoves);
			};

			this.hidePreviousMoves= function(removeAccessibleMoves){
				if (!this.needCheckMoves() || !$scope.displayAccessibleSquares){
					return;
				}
				if ($scope.accessibleMoves){
					for (var i in $scope.accessibleMoves){
						move= $scope.accessibleMoves[i];
						this.squareScopes[move.y*8+move.x].content.highlight= false;
					}
					if (removeAccessibleMoves){
						$scope.accessibleMoves= undefined;
					}
				}
			};


			var leavedBoardContent= false;
			this.applyMoveMode= function(newVal, oldVal){

				if (newVal){

					switch(newVal){
						//DRAGNDROP
						case constants.moveMode.dragndrop:
							//For the board itself
							$element.on('dragenter', function(e){

								var target = e.target || e.srcElement;
								if (target === $element[0]){
									// console.log('hide');
									leavedBoardContent= true;
									$scope.$apply(function(){
										that.hidePreviousMoves(false);
									});
								}
								else{
									if (leavedBoardContent){
										leavedBoardContent= false;
										// console.log('display');
										$scope.$apply(function(){
											that.displayMoves($scope.accessibleMoves);
										});
									}
								}
							});

							break;
						//SIMPLE CLICK
						case constants.moveMode.click:
							$element.off('dragenter');
							break;
						default:
							$log.error('Unknow move mode: ' + newVal);
					}

					//For each square
					var squareScope;
					for (var i in that.squareScopes){
						squareScope= that.squareScopes[i];
						if (squareScope.applyMoveMode){
							squareScope.applyMoveMode(newVal);
						}
						else{
							$log.error('applyMoveMode undefined on square scope');
						}
					}
				}

			};

			//TREATMENTS CONCERNING MOVE MODE
			$scope.$watch('moveMode', this.applyMoveMode);
			$scope.$watch('control', function(newVal, oldVal){
				if (newVal === constants.control.edit){
					$scope.moveMode= constants.moveMode.dragndrop;
				}
			});


		}]
	};

}]);
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
angular.module('chess.directives')
.directive('chessSquareDirective', [ function(){

	return {
		require:'^chessBoardDirective',
		replace: true,
		transclude: false,
		scope:{
			x:'@',
			y:'@',
			piece:'@?',
			reverse: '@'
		},
		template: 
		' <div ' +
		'	ng-class="cssClasses()" ' +
		' >' +
		// '	({{x}},{{y}}) ' +
		' 	<img ng-if="!isEmpty" ng-src="{{imgSource()}}" draggable="{{isMovable()}}"></img>' +
		' </div>',
		controller:['$scope', function($scope){ 
			this.getScope= function(){return $scope;} 
		}],
		link: function($scope, element, attrs, chessBoardController){

			//TODO: check if $scope.content is still needed
			var updateScopeContent= function(){
				$scope.content= {
					x: parseInt($scope.x),
					y: parseInt($scope.y),
					piece: ($scope.piece !== undefined && $scope.piece !==''? JSON.parse($scope.piece): undefined)
				}

				$scope.isEmpty= ($scope.content.piece === undefined);
			}

			//We need to set scope content at init
			updateScopeContent();

			//we need to update scope content when a modif appears on
			//a piece
			$scope.$watch('piece', function(newVal, oldVal){
				updateScopeContent();
			});

			$scope.cssClasses= function(){
				var square= true,
					blackSquare= ( ($scope.content.x + $scope.content.y)%2 === 0 )
					whiteSquare= !blackSquare,
					firstOfLine= ($scope.content.x === 0),
					reverse= ($scope.reverse === 'true'),
					highlightSquareEmpty= $scope.content.highlight && $scope.isEmpty,
					highlightSquareFilled= $scope.content.highlight && !$scope.isEmpty;

				return {
					square: square, 
					blackSquare: blackSquare,
					whiteSquare: whiteSquare, 
					firstOfLine: firstOfLine,
					reverse: reverse,
					highlightSquareEmpty:highlightSquareEmpty, 
					highlightSquareFilled: highlightSquareFilled
				};
			};

			$scope.imgSource= function(){
				if (!$scope.isEmpty){
					return '/imgs/' + $scope.content.piece.name + '_' + $scope.content.piece.color + '.svg';
				}
			};

			$scope.getImage= function(){
				if (!$scope.isEmpty){
					return element.find('img');
				}
			};



			$scope.isMovable= function(){
				return chessBoardController.isMovable($scope);
			};

			chessBoardController.registerSquareScope($scope);
		}
	};

}]);
angular.module('chess.directives')
.directive('chessSquareMove', ['$log', 'chessDragDropMove', 'chessClickMove', 'chessConstants',
	function($log, chessDragDropMove, chessClickMove,constants){

	return {
		require:['chessSquareDirective', '^chessBoardDirective'],
		restrict:'A',
		link:function($scope, $element, $attrs, $ctrls){

			var squareCtrl= $ctrls[0],
				boardCtrl= $ctrls[1],
				moveMode= boardCtrl.getMoveMode();

			squareCtrl.getScope().applyMoveMode= function(moveMode){
				switch(moveMode){
					case constants.moveMode.dragndrop:
						chessClickMove.deactivate($element, squareCtrl, boardCtrl);
						chessDragDropMove.activate($element, squareCtrl, boardCtrl);
						break;
					case constants.moveMode.click:
						chessDragDropMove.deactivate($element, squareCtrl, boardCtrl);					
						chessClickMove.activate($element, squareCtrl, boardCtrl);
						break;
					default:
						$log.error('unknown move mode: ' + moveMode)
						break;
				}
			};

			squareCtrl.getScope().applyMoveMode(moveMode);
		}
	};

}]);


var MAJOR = '1';   // click F5 a few time to make
var MINOR = '13';  // sure your browser cache
var BUILD = 6701;  // updates to the latest build.

//{{{  seed
/**

seedrandom.js
=============

Seeded random number generator for Javascript.

version 2.3.10
Author: David Bau
Date: 2014 Sep 20

Can be used as a plain script, a node.js module or an AMD module.

Script tag usage
----------------

<script src=//cdnjs.cloudflare.com/ajax/libs/seedrandom/2.3.10/seedrandom.min.js>
</script>

// Sets Math.random to a PRNG initialized using the given explicit seed.
Math.seedrandom('hello.');
console.log(Math.random());          // Always 0.9282578795792454
console.log(Math.random());          // Always 0.3752569768646784

// Sets Math.random to an ARC4-based PRNG that is autoseeded using the
// current time, dom state, and other accumulated local entropy.
// The generated seed string is returned.
Math.seedrandom();
console.log(Math.random());          // Reasonably unpredictable.

// Seeds using the given explicit seed mixed with accumulated entropy.
Math.seedrandom('added entropy.', { entropy: true });
console.log(Math.random());          // As unpredictable as added entropy.

// Use "new" to create a local prng without altering Math.random.
var myrng = new Math.seedrandom('hello.');
console.log(myrng());                // Always 0.9282578795792454


Node.js usage
-------------

npm install seedrandom

// Local PRNG: does not affect Math.random.
var seedrandom = require('seedrandom');
var rng = seedrandom('hello.');
console.log(rng());                  // Always 0.9282578795792454

// Autoseeded ARC4-based PRNG.
rng = seedrandom();
console.log(rng());                  // Reasonably unpredictable.

// Global PRNG: set Math.random.
seedrandom('hello.', { global: true });
console.log(Math.random());          // Always 0.9282578795792454

// Mixing accumulated entropy.
rng = seedrandom('added entropy.', { entropy: true });
console.log(rng());                  // As unpredictable as added entropy.


Require.js usage
----------------

Similar to node.js usage:

bower install seedrandom

require(['seedrandom'], function(seedrandom) {
  var rng = seedrandom('hello.');
  console.log(rng());                  // Always 0.9282578795792454
});


Network seeding
---------------

<script src=//cdnjs.cloudflare.com/ajax/libs/seedrandom/2.3.10/seedrandom.min.js>
</script>

<!-- Seeds using urandom bits from a server. -->
<script src=//jsonlib.appspot.com/urandom?callback=Math.seedrandom">
</script>

<!-- Seeds mixing in random.org bits -->
<script>
(function(x, u, s){
  try {
    // Make a synchronous request to random.org.
    x.open('GET', u, false);
    x.send();
    s = unescape(x.response.trim().replace(/^|\s/g, '%'));
  } finally {
    // Seed with the response, or autoseed on failure.
    Math.seedrandom(s, !!s);
  }
})(new XMLHttpRequest, 'https://www.random.org/integers/' +
  '?num=256&min=0&max=255&col=1&base=16&format=plain&rnd=new');
</script>

Reseeding using user input
--------------------------

var seed = Math.seedrandom();        // Use prng with an automatic seed.
document.write(Math.random());       // Pretty much unpredictable x.

var rng = new Math.seedrandom(seed); // A new prng with the same seed.
document.write(rng());               // Repeat the 'unpredictable' x.

function reseed(event, count) {      // Define a custom entropy collector.
  var t = [];
  function w(e) {
    t.push([e.pageX, e.pageY, +new Date]);
    if (t.length &lt; count) { return; }
    document.removeEventListener(event, w);
    Math.seedrandom(t, { entropy: true });
  }
  document.addEventListener(event, w);
}
reseed('mousemove', 100);            // Reseed after 100 mouse moves.

The "pass" option can be used to get both the prng and the seed.
The following returns both an autoseeded prng and the seed as an object,
without mutating Math.random:

var obj = Math.seedrandom(null, { pass: function(prng, seed) {
  return { random: prng, seed: seed };
}});


Version notes
-------------

The random number sequence is the same as version 1.0 for string seeds.
* Version 2.0 changed the sequence for non-string seeds.
* Version 2.1 speeds seeding and uses window.crypto to autoseed if present.
* Version 2.2 alters non-crypto autoseeding to sweep up entropy from plugins.
* Version 2.3 adds support for "new", module loading, and a null seed arg.
* Version 2.3.1 adds a build environment, module packaging, and tests.
* Version 2.3.4 fixes bugs on IE8, and switches to MIT license.
* Version 2.3.6 adds a readable options object argument.
* Version 2.3.10 adds support for node.js crypto (contributed by ctd1500).

The standard ARC4 key scheduler cycles short keys, which means that
seedrandom('ab') is equivalent to seedrandom('abab') and 'ababab'.
Therefore it is a good idea to add a terminator to avoid trivial
equivalences on short string seeds, e.g., Math.seedrandom(str + '\0').
Starting with version 2.0, a terminator is added automatically for
non-string seeds, so seeding with the number 111 is the same as seeding
with '111\0'.

When seedrandom() is called with zero args or a null seed, it uses a
seed drawn from the browser crypto object if present.  If there is no
crypto support, seedrandom() uses the current time, the native rng,
and a walk of several DOM objects to collect a few bits of entropy.

Each time the one- or two-argument forms of seedrandom are called,
entropy from the passed seed is accumulated in a pool to help generate
future seeds for the zero- and two-argument forms of seedrandom.

On speed - This javascript implementation of Math.random() is several
times slower than the built-in Math.random() because it is not native
code, but that is typically fast enough.  Some details (timings on
Chrome 25 on a 2010 vintage macbook):

* seeded Math.random()          - avg less than 0.0002 milliseconds per call
* seedrandom('explicit.')       - avg less than 0.2 milliseconds per call
* seedrandom('explicit.', true) - avg less than 0.2 milliseconds per call
* seedrandom() with crypto      - avg less than 0.2 milliseconds per call

Autoseeding without crypto is somewhat slower, about 20-30 milliseconds on
a 2012 windows 7 1.5ghz i5 laptop, as seen on Firefox 19, IE 10, and Opera.
Seeded rng calls themselves are fast across these browsers, with slowest
numbers on Opera at about 0.0005 ms per seeded Math.random().


LICENSE (MIT)
-------------

Copyright 2014 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

/**
 * All code is in an anonymous closure to keep the global namespace clean.
 */
(function (
    global, pool, math, width, chunks, digits, module, define, rngname) {

//
// The following constants are related to IEEE 754 limits.
//
var startdenom = math.pow(width, chunks),
    significance = math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1,
    nodecrypto;

//
// seedrandom()
// This is the seedrandom function described above.
//
var impl = math['seed' + rngname] = function(seed, options, callback) {
  var key = [];
  options = (options == true) ? { entropy: true } : (options || {});

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    options.entropy ? [seed, tostring(pool)] :
    (seed == null) ? autoseed() : seed, 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Calling convention: what to return as a function of prng, seed, is_math.
  return (options.pass || callback ||
      // If called as a method of Math (Math.seedrandom()), mutate Math.random
      // because that is how seedrandom.js has worked since v1.0.  Otherwise,
      // it is a newer calling convention, so return the prng directly.
      function(prng, seed, is_math_call) {
        if (is_math_call) { math[rngname] = prng; return seed; }
        else return prng;
      })(

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.
  function() {
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  }, shortseed, 'global' in options ? options.global : (this == math));
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability, the function call below automatically
    // discards an initial batch of values.  This is called RC4-drop[256].
    // See http://google.com/search?q=rsa+fluhrer+response&btnI
  })(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj), prop;
  if (depth && typ == 'object') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 'string' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto if available.
//
/** @param {Uint8Array|Navigator=} seed */
function autoseed(seed) {
  try {
    if (nodecrypto) return tostring(nodecrypto.randomBytes(width));
    global.crypto.getRandomValues(seed = new Uint8Array(width));
    return tostring(seed);
  } catch (e) {
    return [+new Date, global, (seed = global.navigator) && seed.plugins,
      global.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math[rngname](), pool);

//
// Nodejs and AMD support: export the implementation as a module using
// either convention.
//
if (module && module.exports) {
  module.exports = impl;
  try {
    // When in node.js, try using crypto package for autoseeding.
    nodecrypto = require('crypto');
  } catch (ex) {}
} else if (define && define.amd) {
  define(function() { return impl; });
}

//
// Node.js native crypto support.
//

// End anonymous scope, and pass initial values.
})(
  this,   // global window object
  [],     // pool: entropy pool starts empty
  Math,   // math: package containing random, pow, and seedrandom
  256,    // width: each RC4 output is 0 <= x < 256
  6,      // chunks: at least six RC4 outputs for each double
  52,     // digits: there are 52 significant digits in a double
  (typeof module) == 'object' && module,    // present in node.js
  (typeof define) == 'function' && define,  // present with an AMD loader
  'random'// rngname: name for Math.random and Math.seedrandom
);

Math.seedrandom('Lozza rules OK');  //always generates the same sequence of PRNs

//}}}
//{{{  constants

var MAX_PLY         = 100;                // limited by lozza.board.ttDepth bits.
var MAX_MOVES       = 220;
var INFINITY        = 30000;              // limited by lozza.board.ttScore bits.
var MATE            = 20000;
var MINMATE         = MATE - 2*MAX_PLY;
var CONTEMPT        = 0;
var NULL_Y          = 1;
var NULL_N          = 0;
var INCHECK_UNKNOWN = MATE + 1;
var TTSCORE_UNKNOWN = MATE + 2;
var ASP_MAX         = 75;
var ASP_DELTA       = 3;
var ASP_MIN         = 10;
var EMPTY           = 0;
var UCI_FMT         = 0;
var SAN_FMT         = 1;

var WHITE   = 0x0;                // toggle with ~turn & COLOR_MASK
var BLACK   = 0x8;
var I_WHITE = 0;                  // turn >>> 3
var I_BLACK = 1;
var M_WHITE = 1;
var M_BLACK = -1;                 // (-turn >> 31) | 1

var PIECE_MASK = 0x7;
var COLOR_MASK = 0x8;

var TT_EMPTY  = 0;
var TT_EXACT  = 1;
var TT_BETA   = 2;
var TT_ALPHA  = 3;

var MOVE_TO_BITS      = 0;
var MOVE_FR_BITS      = 8;
var MOVE_TOOBJ_BITS   = 16;
var MOVE_FROBJ_BITS   = 20;
var MOVE_PROMAS_BITS  = 29;

var MOVE_TO_MASK       = 0x000000FF;
var MOVE_FR_MASK       = 0x0000FF00;
var MOVE_TOOBJ_MASK    = 0x000F0000;
var MOVE_FROBJ_MASK    = 0x00F00000;
var MOVE_PAWN_MASK     = 0x01000000;
var MOVE_EPTAKE_MASK   = 0x02000000;
var MOVE_EPMAKE_MASK   = 0x04000000;
var MOVE_CASTLE_MASK   = 0x08000000;
var MOVE_PROMOTE_MASK  = 0x10000000;
var MOVE_PROMAS_MASK   = 0x60000000;  // NBRQ.
var MOVE_SPARE2_MASK   = 0x80000000;

var MOVE_SPECIAL_MASK  = MOVE_CASTLE_MASK | MOVE_PROMOTE_MASK | MOVE_EPTAKE_MASK | MOVE_EPMAKE_MASK; // need extra work in make move.
var KEEPER_MASK        = MOVE_CASTLE_MASK | MOVE_PROMOTE_MASK | MOVE_EPTAKE_MASK | MOVE_TOOBJ_MASK;  // futility etc.

var NULL   = 0;
var PAWN   = 1;
var KNIGHT = 2;
var BISHOP = 3;
var ROOK   = 4;
var QUEEN  = 5;
var KING   = 6;
var EDGE   = 7;
var NO_Z   = 8;

var W_PAWN   = PAWN;
var W_KNIGHT = KNIGHT;
var W_BISHOP = BISHOP;
var W_ROOK   = ROOK;
var W_QUEEN  = QUEEN;
var W_KING   = KING;

var B_PAWN   = PAWN   | BLACK;
var B_KNIGHT = KNIGHT | BLACK;
var B_BISHOP = BISHOP | BLACK;
var B_ROOK   = ROOK   | BLACK;
var B_QUEEN  = QUEEN  | BLACK;
var B_KING   = KING   | BLACK;

var PPHASE = 0;
var NPHASE = 1;
var BPHASE = 1;
var RPHASE = 2;
var QPHASE = 4;
var VPHASE = [0,PPHASE,NPHASE,BPHASE,RPHASE,QPHASE,0];
var TPHASE = PPHASE*16 + NPHASE*4 + BPHASE*4 + RPHASE*4 + QPHASE*2;
var EPHASE = 180;

var A1 = 110;
var B1 = 111;
var C1 = 112;
var D1 = 113;
var E1 = 114;
var F1 = 115;
var G1 = 116;
var H1 = 117;

var A8 = 26;
var B8 = 27;
var C8 = 28;
var D8 = 29;
var E8 = 30;
var F8 = 31;
var G8 = 32;
var H8 = 33;

var MOVE_E1G1 = MOVE_CASTLE_MASK | (W_KING << MOVE_FROBJ_BITS) | (E1 << MOVE_FR_BITS) | G1;
var MOVE_E1C1 = MOVE_CASTLE_MASK | (W_KING << MOVE_FROBJ_BITS) | (E1 << MOVE_FR_BITS) | C1;
var MOVE_E8G8 = MOVE_CASTLE_MASK | (B_KING << MOVE_FROBJ_BITS) | (E8 << MOVE_FR_BITS) | G8;
var MOVE_E8C8 = MOVE_CASTLE_MASK | (B_KING << MOVE_FROBJ_BITS) | (E8 << MOVE_FR_BITS) | C8;

var WHITE_RIGHTS_KING  = 0x00000001;
var WHITE_RIGHTS_QUEEN = 0x00000002;
var BLACK_RIGHTS_KING  = 0x00000004;
var BLACK_RIGHTS_QUEEN = 0x00000008;
var WHITE_RIGHTS       = WHITE_RIGHTS_QUEEN | WHITE_RIGHTS_KING;
var BLACK_RIGHTS       = BLACK_RIGHTS_QUEEN | BLACK_RIGHTS_KING;

var MASK_RIGHTS =   [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                     15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                     15, 15, ~8, 15, 15, 15, ~12,15, 15, ~4, 15, 15,
                     15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                     15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                     15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                     15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                     15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                     15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                     15, 15, ~2, 15, 15, 15, ~3, 15, 15, ~1, 15, 15,
                     15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
                     15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15];

var WP_OFFSET_ORTH  = -12;
var WP_OFFSET_DIAG1 = -13;
var WP_OFFSET_DIAG2 = -11;

var BP_OFFSET_ORTH  = 12;
var BP_OFFSET_DIAG1 = 13;
var BP_OFFSET_DIAG2 = 11;

var KNIGHT_OFFSETS  = [25,-25,23,-23,14,-14,10,-10];
var BISHOP_OFFSETS  = [11,-11,13,-13];
var ROOK_OFFSETS    =               [1,-1,12,-12];
var QUEEN_OFFSETS   = [11,-11,13,-13,1,-1,12,-12]; // must be diag then orth - see isAttacked.
var KING_OFFSETS    = [11,-11,13,-13,1,-1,12,-12];

var OFFSETS = [0,0,KNIGHT_OFFSETS,BISHOP_OFFSETS,ROOK_OFFSETS,QUEEN_OFFSETS,KING_OFFSETS];
var LIMITS  = [0,1,1,8,8,8,1];

var VALUE_PAWN   = 100;
var VALUE_QUEEN  = 975;
var VALUE_VECTOR = [0,VALUE_PAWN,325,325,500,VALUE_QUEEN,10000];
var RANK_VECTOR  = [0,1,         2,  2,  4,  5,          6];  // for move sorting.

var NULL_PST =        [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WPAWN_PSTS =      [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   6,  12,  18,  24,  24,  18,  12,   6,   0,   0,
                       0,   0,   5,  10,  15,  20,  20,  15,  10,   5,   0,   0,
                       0,   0,   4,   8,  12,  16,  16,  12,   8,   4,   0,   0,
                       0,   0,   3,   6,   9,  12,  12,   9,   6,   3,   0,   0,
                       0,   0,   2,   4,   6,   8,   8,   6,   4,   2,   0,   0,
                       0,   0,   1,   2,   3, -40, -40,   3,   2,   1,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WPAWN_PSTE =      [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,  12,  24,  36,  48,  48,  36,  24,  12,   0,   0,
                       0,   0,  10,  20,  30,  40,  40,  30,  20,  10,   0,   0,
                       0,   0,   8,  16,  24,  32,  32,  24,  16,   8,   0,   0,
                       0,   0,   6,  12,  18,  24,  24,  18,  12,   6,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WKNIGHT_PSTS =    [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0, -50, -40, -30, -30, -30, -30, -40, -50,   0,   0,
                       0,   0, -40, -20,   0,   0,   0,   0,  20, -40,   0,   0,
                       0,   0, -30,   0,  10,  15,  15,  10,   0, -30,   0,   0,
                       0,   0, -30,   5,  15,  20,  20,  15,   5, -30,   0,   0,
                       0,   0, -30,   0,  15,  20,  20,  15,   0, -30,   0,   0,
                       0,   0, -30,   5,  10,  15,  15,  10,   5, -30,   0,   0,
                       0,   0, -40, -20,   0,   5,   5,   0, -20, -40,   0,   0,
                       0,   0, -50, -40, -30, -30, -30, -30, -40, -50,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WKNIGHT_PSTE =    [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0, -50, -40, -30, -30, -30, -30, -40, -50,   0,   0,
                       0,   0, -40, -20,   0,   0,   0,   0,  20, -40,   0,   0,
                       0,   0, -30,   0,  10,  15,  15,  10,   0, -30,   0,   0,
                       0,   0, -30,   5,  15,  20,  20,  15,   5, -30,   0,   0,
                       0,   0, -30,   0,  15,  20,  20,  15,   0, -30,   0,   0,
                       0,   0, -30,   5,  10,  15,  15,  10,   5, -30,   0,   0,
                       0,   0, -40, -20,   0,   5,   5,   0, -20, -40,   0,   0,
                       0,   0, -50, -40, -30, -30, -30, -30, -40, -50,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WBISHOP_PSTS =    [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0, -20, -10, -10, -10, -10, -10, -10, -20,   0,   0,
                       0,   0, -10,   0,   0,   0,   0,   0,   0, -10,   0,   0,
                       0,   0, -10,   0,   5,  10,  10,   5,   0, -10,   0,   0,
                       0,   0, -10,   5,   5,  10,  10,   5,   5, -10,   0,   0,
                       0,   0, -10,   0,  10,  10,  10,  10,   0, -10,   0,   0,
                       0,   0, -10,  10,  10,  10,  10,  10,  10, -10,   0,   0,
                       0,   0, -10,   5,   0,   0,   0,   0,   5, -10,   0,   0,
                       0,   0, -20, -10, -10, -10, -10, -10, -10, -20,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WBISHOP_PSTE =    [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0, -20, -10, -10, -10, -10, -10, -10, -20,   0,   0,
                       0,   0, -10,   0,   0,   0,   0,   0,   0, -10,   0,   0,
                       0,   0, -10,   0,   5,  10,  10,   5,   0, -10,   0,   0,
                       0,   0, -10,   5,   5,  10,  10,   5,   5, -10,   0,   0,
                       0,   0, -10,   0,  10,  10,  10,  10,   0, -10,   0,   0,
                       0,   0, -10,  10,  10,  10,  10,  10,  10, -10,   0,   0,
                       0,   0, -10,   5,   0,   0,   0,   0,   5, -10,   0,   0,
                       0,   0, -20, -10, -10, -10, -10, -10, -10, -20,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WROOK_PSTS =      [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   5,  10,  10,  10,  10,  10,  10,   5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,   0,   0,   0,   5,   5,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WROOK_PSTE =      [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   5,  10,  10,  10,  10,  10,  10,   5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,  -5,   0,   0,   0,   0,   0,   0,  -5,   0,   0,
                       0,   0,   0,   0,   0,   5,   5,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WQUEEN_PSTS =     [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0, -20, -10, -10,  -5,  -5, -10, -10, -20,   0,   0,
                       0,   0, -10,   0,   0,   0,   0,   0,   0, -10,   0,   0,
                       0,   0, -10,   0,   5,   5,   5,   5,   0, -10,   0,   0,
                       0,   0,  -5,   0,   5,   5,   5,   5,   0,  -5,   0,   0,
                       0,   0,   0,   0,   5,   5,   5,   5,   0,  -5,   0,   0,
                       0,   0, -10,   5,   5,   5,   5,   5,   0, -10,   0,   0,
                       0,   0, -10,   0,   5,   0,   0,   0,   0, -10,   0,   0,
                       0,   0, -20, -10, -10,  -5,  -5, -10, -10, -20,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WQUEEN_PSTE =     [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0, -20, -10, -10,  -5,  -5, -10, -10, -20,   0,   0,
                       0,   0, -10,   0,   0,   0,   0,   0,   0, -10,   0,   0,
                       0,   0, -10,   0,   5,   5,   5,   5,   0, -10,   0,   0,
                       0,   0,  -5,   0,   5,   5,   5,   5,   0,  -5,   0,   0,
                       0,   0,   0,   0,   5,   5,   5,   5,   0,  -5,   0,   0,
                       0,   0, -10,   5,   5,   5,   5,   5,   0, -10,   0,   0,
                       0,   0, -10,   0,   5,   0,   0,   0,   0, -10,   0,   0,
                       0,   0, -20, -10, -10,  -5,  -5, -10, -10, -20,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WKING_PSTS =      [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0, -30, -40, -40, -50, -50, -40, -40, -30,   0,   0,
                       0,   0, -30, -40, -40, -50, -50, -40, -40, -30,   0,   0,
                       0,   0, -30, -40, -40, -50, -50, -40, -40, -30,   0,   0,
                       0,   0, -30, -40, -40, -50, -50, -40, -40, -30,   0,   0,
                       0,   0, -20, -30, -30, -40, -40, -30, -30, -20,   0,   0,
                       0,   0, -10, -20, -20, -20, -20, -20, -20, -10,   0,   0,
                       0,   0,  20,  20,   0,   0,   0,   0,  20,  20,   0,   0,
                       0,   0,  20,  30,  10,   0,   0,  10,  30,  20,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WKING_PSTE =      [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0, -50, -40, -30, -20, -20, -30, -40, -50,   0,   0,
                       0,   0, -30, -20, -10,   0,   0, -10, -20, -30,   0,   0,
                       0,   0, -30, -10,  20,  30,  30,  20, -10, -30,   0,   0,
                       0,   0, -30, -10,  30,  40,  40,  30, -10, -30,   0,   0,
                       0,   0, -30, -10,  30,  40,  40,  30, -10, -30,   0,   0,
                       0,   0, -30, -10,  20,  30,  30,  20, -10, -30,   0,   0,
                       0,   0, -30, -30,   0,   0,   0,   0, -30, -30,   0,   0,
                       0,   0, -50, -30, -30, -30, -30, -30, -30, -50,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WPASSED_PSTS =    [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,  20,  20,  20,  20,  20,  20,  20,  20,   0,   0,
                       0,   0,  20,  20,  20,  20,  20,  20,  20,  20,   0,   0,
                       0,   0,  20,  20,  20,  20,  20,  20,  20,  20,   0,   0,
                       0,   0,  20,  20,  20,  20,  20,  20,  20,  20,   0,   0,
                       0,   0,  20,  20,  20,  20,  20,  20,  20,  20,   0,   0,
                       0,   0,  20,  20,  20,  20,  20,  20,  20,  20,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WPASSED_PSTE =    [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,  99,  99,  99,  99,  99,  99,  99,  99,   0,   0,
                       0,   0,  66,  66,  66,  66,  66,  66,  66,  66,   0,   0,
                       0,   0,  30,  30,  30,  30,  30,  30,  30,  30,   0,   0,
                       0,   0,  30,  30,  30,  30,  30,  30,  30,  30,   0,   0,
                       0,   0,  30,  30,  30,  30,  30,  30,  30,  30,   0,   0,
                       0,   0,  30,  30,  30,  30,  30,  30,  30,  30,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WDOUBLED_PSTS =   [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WDOUBLED_PSTE =   [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,  10,  10,  10,  10,  10,  10,  10,  10,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WCONNECT_PSTS =   [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WCONNECT_PSTE =   [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WISOLATE_PSTS =   [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

var WISOLATE_PSTE =   [0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   5,   5,   5,   5,   5,   5,   5,   5,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
                       0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0];

function _pst2Black (from,to) {
  for (var i=0; i < 12; i++) {
    var frbase = i*12;
    var tobase = (11-i)*12;
    for (var j=0; j < 12; j++)
      to[tobase+j] = from[frbase+j];
  }
}

var BPAWN_PSTS   = Array(144);
var BPAWN_PSTE   = Array(144);
var BKNIGHT_PSTS = Array(144);
var BKNIGHT_PSTE = Array(144);
var BBISHOP_PSTS = Array(144);
var BBISHOP_PSTE = Array(144);
var BROOK_PSTS   = Array(144);
var BROOK_PSTE   = Array(144);
var BQUEEN_PSTS  = Array(144);
var BQUEEN_PSTE  = Array(144);
var BKING_PSTS   = Array(144);
var BKING_PSTE   = Array(144);

var BPASSED_PSTS  = Array(144);
var BPASSED_PSTE  = Array(144);
var BDOUBLED_PSTS = Array(144);
var BDOUBLED_PSTE = Array(144);
var BCONNECT_PSTS = Array(144);
var BCONNECT_PSTE = Array(144);
var BISOLATE_PSTS = Array(144);
var BISOLATE_PSTE = Array(144);

_pst2Black(WPAWN_PSTS,   BPAWN_PSTS);
_pst2Black(WPAWN_PSTE,   BPAWN_PSTE);
_pst2Black(WKNIGHT_PSTS, BKNIGHT_PSTS);
_pst2Black(WKNIGHT_PSTE, BKNIGHT_PSTE);
_pst2Black(WBISHOP_PSTS, BBISHOP_PSTS);
_pst2Black(WBISHOP_PSTE, BBISHOP_PSTE);
_pst2Black(WROOK_PSTS,   BROOK_PSTS);
_pst2Black(WROOK_PSTE,   BROOK_PSTE);
_pst2Black(WQUEEN_PSTS,  BQUEEN_PSTS);
_pst2Black(WQUEEN_PSTE,  BQUEEN_PSTE);
_pst2Black(WKING_PSTS,   BKING_PSTS);
_pst2Black(WKING_PSTE,   BKING_PSTE);

var WS_PST = [NULL_PST, WPAWN_PSTS,  WKNIGHT_PSTS, WBISHOP_PSTS, WROOK_PSTS, WQUEEN_PSTS, WKING_PSTS];  // opening/middle eval.
var WE_PST = [NULL_PST, WPAWN_PSTE,  WKNIGHT_PSTE, WBISHOP_PSTE, WROOK_PSTE, WQUEEN_PSTE, WKING_PSTE]; // end eval.
var WM_PST = [NULL_PST, WPAWN_PSTE,  WKNIGHT_PSTE, WBISHOP_PSTE, WROOK_PSTE, WQUEEN_PSTE, WKING_PSTE]; // move eval.

var BS_PST = [NULL_PST, BPAWN_PSTS,  BKNIGHT_PSTS, BBISHOP_PSTS, BROOK_PSTS, BQUEEN_PSTS, BKING_PSTS];
var BE_PST = [NULL_PST, BPAWN_PSTE,  BKNIGHT_PSTE, BBISHOP_PSTE, BROOK_PSTE, BQUEEN_PSTE, BKING_PSTE];
var BM_PST = [NULL_PST, BPAWN_PSTE,  BKNIGHT_PSTE, BBISHOP_PSTE, BROOK_PSTE, BQUEEN_PSTE, BKING_PSTE];

_pst2Black(WPASSED_PSTS,  BPASSED_PSTS);
_pst2Black(WPASSED_PSTE,  BPASSED_PSTE);
_pst2Black(WDOUBLED_PSTS, BDOUBLED_PSTS);
_pst2Black(WDOUBLED_PSTE, BDOUBLED_PSTE);
_pst2Black(WCONNECT_PSTS, BCONNECT_PSTS);
_pst2Black(WCONNECT_PSTE, BCONNECT_PSTE);
_pst2Black(WISOLATE_PSTS, BISOLATE_PSTS);
_pst2Black(WISOLATE_PSTE, BISOLATE_PSTE);

var B88 =   [26, 27, 28, 29, 30, 31, 32, 33,
             38, 39, 40, 41, 42, 43, 44, 45,
             50, 51, 52, 53, 54, 55, 56, 57,
             62, 63, 64, 65, 66, 67, 68, 69,
             74, 75, 76, 77, 78, 79, 80, 81,
             86, 87, 88, 89, 90, 91, 92, 93,
             98, 99, 100,101,102,103,104,105,
             110,111,112,113,114,115,116,117];

var COORDS =   ['??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??',
                '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??',
                '??', '??', 'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', '??', '??',
                '??', '??', 'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', '??', '??',
                '??', '??', 'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', '??', '??',
                '??', '??', 'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', '??', '??',
                '??', '??', 'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', '??', '??',
                '??', '??', 'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', '??', '??',
                '??', '??', 'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', '??', '??',
                '??', '??', 'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', '??', '??',
                '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??',
                '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'];

var NAMES    = ['-','P','N','B','R','Q','K','-'];
var PROMOTES = ['n','b','r','q'];                  // 0-3 encoded in move.

var RANK =   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 8, 8, 8, 8, 8, 8, 8, 8, 0, 0,
              0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0,
              0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0,
              0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0,
              0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0,
              0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0,
              0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0,
              0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var FILE =   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
              0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
              0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
              0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
              0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
              0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
              0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
              0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var MAP = [];

MAP['p'] = B_PAWN;
MAP['n'] = B_KNIGHT;
MAP['b'] = B_BISHOP;
MAP['r'] = B_ROOK;
MAP['q'] = B_QUEEN;
MAP['k'] = B_KING;
MAP['P'] = W_PAWN;
MAP['N'] = W_KNIGHT;
MAP['B'] = W_BISHOP;
MAP['R'] = W_ROOK;
MAP['Q'] = W_QUEEN;
MAP['K'] = W_KING;

var UMAP = [];

UMAP[B_PAWN]   = 'p';
UMAP[B_KNIGHT] = 'n';
UMAP[B_BISHOP] = 'b';
UMAP[B_ROOK]   = 'r';
UMAP[B_QUEEN]  = 'q';
UMAP[B_KING]   = 'k';
UMAP[W_PAWN]   = 'P';
UMAP[W_KNIGHT] = 'N';
UMAP[W_BISHOP] = 'B';
UMAP[W_ROOK]   = 'R';
UMAP[W_QUEEN]  = 'Q';
UMAP[W_KING]   = 'K';

//}}}

//{{{  lozChess class

//{{{  lozChess
//
//   node[0]
//     .root            =  true;
//     .ply             =  0
//     .parentNode      => NULL
//     .grandParentNode => NULL
//     .childNode       => node[1];
//
//   node[1]
//     .root            =  false;
//     .ply             =  1
//     .parentNode      => node[0]
//     .grandParentNode => NULL
//     .childNode       => node[2];
//
//  ...
//
//   node[n]
//     .root            =  false;
//     .ply             =  n
//     .parentNode      => node[n-1]
//     .grandParentNode => node[n-2] | NULL
//     .childNode       => node[n+1] | NULL
//
//   etc
//
//  Search starts at node[0] with a depth spec.  In Lozza "depth" is the depth to
//  search and can jump around all over the place with extensions and reductions,
//  "ply" is the distance from the root.  Killers are stored in nodes because they
//  need to be ply based not depth based.  The .grandParentNode pointer can be used
//  to easily look up killers for the previous move of the same colour.
//

function lozChess () {

  this.nodes = Array(MAX_PLY);

  var parentNode = null;
  for (var i=0; i < this.nodes.length; i++) {
    this.nodes[i]      = new lozNode(parentNode);
    this.nodes[i].ply  = i;                     // distance to root node for mate etc.
    parentNode         = this.nodes[i];
    this.nodes[i].root = i == 0;
  }

  this.board = new lozBoard();
  this.stats = new lozStats();
  this.uci   = new lozUCI();

  this.rootNode = this.nodes[0];

  for (var i=0; i < this.nodes.length; i++)
    this.nodes[i].board = this.board;

  return this;
}

//}}}
//{{{  .init

lozChess.prototype.init = function () {

  for (var i=0; i < this.nodes.length; i++)
    this.nodes[i].init();

  this.board.init();
  this.stats.init();
}

//}}}
//{{{  .newGameInit

lozChess.prototype.newGameInit = function () {

  this.board.ttInit();
}

//}}}
//{{{  .position

lozChess.prototype.position = function () {

  this.init();

  var res = this.board.position();

  return res;
}

//}}}
//{{{  .go

lozChess.prototype.go = function() {

  var board = this.board;
  var spec  = this.uci.spec;

  //{{{  sort out spec
  
  var remTime = 0;
  
  if (spec.depth <= 0)
    spec.depth = MAX_PLY;
  
  if (spec.moveTime > 0)
    this.stats.moveTime = spec.moveTime;
  
  if (spec.maxNodes > 0)
    this.stats.maxNodes = spec.maxNodes;
  
  if (spec.moveTime == 0) {
  
    if (spec.movesToGo > 0)
      var movesToGo = spec.movesToGo;
    else
      var movesToGo = 20;
  
    if (board.turn == WHITE) {
      remTime = spec.wTime + movesToGo * spec.wInc;
    }
    else {
      remTime = spec.bTime + movesToGo * spec.bInc;
    }
  
    if (remTime > 0)
      this.stats.moveTime = Math.floor(remTime / movesToGo);
  }
  
  //}}}

  var alpha       = -INFINITY;
  var beta        = INFINITY;
  var asp         = ASP_MAX;
  var ply         = 1;
  var maxPly      = spec.depth;
  var bestMoveStr = '';
  var score       = 0;
  var winDraw     = '';

  while (ply <= maxPly) {

    this.stats.ply = ply;

    score = this.search(this.rootNode, ply, board.turn, alpha, beta);

    if (this.stats.timeOut) {
      break;
    }

    if (score <= alpha || score >= beta) {
      //{{{  research
      
      if (!this.uci.tuning) {
        if (score >= beta)
          this.uci.send('info string BETA', ply, score, '>=', beta);
        else
          this.uci.send('info string ALPHA', ply, score, '<=', alpha);
      }
      
      alpha = -INFINITY;
      beta  = INFINITY;
      asp   = ASP_MAX * 10;
      
      continue;
      
      //}}}
    }

    if (Math.abs(score) >= MINMATE && Math.abs(score) <= MATE) {
      break;
    }

    alpha = score - asp;
    beta  = score + asp;

    asp -= ASP_DELTA;       //  shrink the window.
    if (asp < ASP_MIN)
      asp = ASP_MIN;

    ply += 1;
  }

  //{{{  send move
  
  this.stats.update();
  this.stats.stop();
  
  board.makeMove(this.rootNode,this.stats.bestMove);
  
  bestMoveStr = board.formatMove(this.stats.bestMove,UCI_FMT);
  winDraw     = board.isEnd(~board.turn & COLOR_MASK);
  
  if (this.uci.tuning) { // web ui.
  
    if (winDraw)
      this.uci.send('end',winDraw);
    else
      this.uci.send('bestmove',bestMoveStr);
  }
  
  else {
  
    if (spec.txfen)  // web ui.
      this.uci.send('bestmove',bestMoveStr,'txfen',board.fen());
    else
      this.uci.send('bestmove',bestMoveStr);
  
    if (spec.validate && winDraw)  // web ui.
      this.uci.send('end',winDraw);
  }
  
  this.uci.debug('phase',board.gPhase,'whis',board.wHistory[0][0],'bhis',board.bHistory[0][0]);
  this.uci.debug(spec.board + ' ' + spec.rights + ' ' + spec.ep);
  this.uci.debug(spec.depth+'p','|',this.stats.nodesMega+'Mn','|',this.stats.timeSec+'s','|',bestMoveStr,'|',board.formatMove(this.stats.bestMove,SAN_FMT));
  
  //}}}
}

//}}}
//{{{  .search

lozChess.prototype.search = function (node, depth, turn, alpha, beta) {

  //{{{  housekeeping
  
  if (!node.childNode) {
    this.uci.debug('S DEPTH');
    this.stats.timeOut = 1;
    return;
  }
  
  //}}}

  var board          = this.board;
  var nextTurn       = ~turn & COLOR_MASK;
  var oAlpha         = alpha;
  var numLegalMoves  = 0;
  var move           = 0;
  var bestMove       = 0;
  var score          = 0;
  var bestScore      = -INFINITY;
  var inCheck        = board.isKingAttacked(nextTurn);
  var R              = 0;
  var E              = 0;
  var givesCheck     = 0;
  var alphaMate      = (alpha <= -MINMATE && alpha >= -MATE) || (alpha >= MINMATE && alpha <= MATE);
  var betaMate       = (beta  <= -MINMATE && beta  >= -MATE) || (beta  >= MINMATE && beta  <= MATE);
  var numSlides      = 0;
  var lmReduce       = !inCheck && depth >= 2 && !betaMate;
  var safe           = false;

  node.cache();

  board.ttGet(node, depth, alpha, beta);  // load hash move.

  board.genMoves(node, turn);

  while (move = node.getNextMove()) {

    board.makeMove(node,move);

    //{{{  legal?
    
    if (move != node.hashMove && board.isKingAttacked(nextTurn)) {
    
      board.unmakeMove(node,move);
    
      node.uncache();
    
      continue;
    }
    
    //}}}

    numLegalMoves++;

    //{{{  send current move to UCI
    
    if (!this.uci.tuning && this.stats.splits > 3) {
    
      this.uci.send('info currmove ' + board.formatMove(move,SAN_FMT) + ' currmovenumber ' + numLegalMoves);
    }
    
    //}}}

    givesCheck = board.isKingAttacked(turn);
    safe       = !alphaMate && !(move & KEEPER_MASK) && !givesCheck;

    //{{{  E+R
    
    if (node.base < BASE_LMR)
      numSlides += 1;
    
    E = 0;
    R = 0;
    
    if (inCheck)
      E = 1;
    
    if (!E && lmReduce && safe && numSlides > 5) {
      R = (depth >= 8) ? depth >> 2 : 1;
    }
    
    //}}}

    if (numLegalMoves == 1)
      score = -this.alphabeta(node.childNode, depth+E-1, nextTurn, -beta, -alpha, NULL_Y, givesCheck);
    else {
      score = -this.alphabeta(node.childNode, depth+E-R-1, nextTurn, -alpha-1, -alpha, NULL_Y, givesCheck);
      if (!this.stats.timeOut && score > alpha) {
        score = -this.alphabeta(node.childNode, depth+E-1, nextTurn, -beta, -alpha, NULL_Y, givesCheck);
      }
    }

    //{{{  unmake move
    
    board.unmakeMove(node,move);
    
    node.uncache();
    
    //}}}

    if (this.stats.timeOut) {
      return;
    }

    if (score > bestScore) {
      if (score > alpha) {
        if (score >= beta) {
          node.addKiller(score, move);
          board.ttPut(TT_BETA, depth, score, move, node.ply);
          board.addHistory(depth, move);
          return score;
        }
        alpha               = score;
        alphaMate           = (alpha <= -MINMATE && alpha >= -MATE) || (alpha >= MINMATE && alpha <= MATE);
        board.ttPut(TT_ALPHA, depth, score, move, node.ply);
        board.addHistory(depth, move);
        //{{{  update best move & send score to UI
        
        this.stats.bestMove = move;
        
        var absScore = Math.abs(score);
        var units    = 'cp';
        var uciScore = score;
        var pvStr    = board.getPVStr(node);
        var mv       = board.formatMove(move,SAN_FMT);
        
        if (absScore >= MINMATE && absScore <= MATE) {
          var units    = 'mate';
          var uciScore = Math.floor((MATE - absScore) / 2);
          if (score < 0)
            uciScore = -uciScore;
        }
        
        if (!this.uci.tuning)
          this.uci.send('info depth',this.stats.ply,'seldepth',this.stats.selDepth,'score',units,uciScore,'pv',pvStr);
        
        if (!board.ttGetMove(node))
          this.uci.debug('TT AWOL FOR',mv);
        
        if (!pvStr)
          this.uci.debug('NULL PV FOR',mv);
        
        if (pvStr.indexOf(mv) != 0)
          this.uci.debug('WRONG PV FOR',mv);
        
        if (!this.uci.tuning)
          this.uci.send('info hashfull',Math.round(1000*board.hashUsed/board.ttSize));
        
        //}}}
      }
      bestScore = score;
      bestMove  = move;
    }
  }

  if (numLegalMoves == 0)
    this.uci.debug('INVALID');

  if (numLegalMoves == 1)
    this.stats.timeOut = 1;  // only one legal move so don't waste any more time.

  if (bestScore > oAlpha) {
    board.ttPut(TT_EXACT, depth, bestScore, bestMove, node.ply);
    return bestScore;
  }
  else {
    board.ttPut(TT_ALPHA, depth, oAlpha,    bestMove, node.ply);
    return oAlpha;
  }
}

//}}}
//{{{  .alphabeta

lozChess.prototype.alphabeta = function (node, depth, turn, alpha, beta, nullOK, inCheck) {

  //{{{  housekeeping
  
  if (!node.childNode) {
    this.uci.debug('AB DEPTH');
    this.stats.timeOut = 1;
  }
  
  if (depth > 2 || this.stats.timeOut) {
    this.stats.lazyUpdate();
    if (this.stats.timeOut)
      return;
  }
  
  if (node.ply > this.stats.selDepth)
    this.stats.selDepth = node.ply;
  
  //}}}

  var board    = this.board;
  var nextTurn = ~turn & COLOR_MASK;
  var score    = 0;

  //{{{  mate distance pruning
  
  var matingValue = MATE - node.ply;
  
  if (matingValue < beta) {
     beta = matingValue;
     if (alpha >= matingValue)
       return matingValue;
  }
  
  var matingValue = -MATE + node.ply;
  
  if (matingValue > alpha) {
     alpha = matingValue;
     if (beta <= matingValue)
       return matingValue;
  }
  
  //}}}
  //{{{  check for draws
  
  if (board.repHi - board.repLo > 100)
    return CONTEMPT;
  
  for (var i=board.repHi-5; i >= board.repLo; i -= 2) {
  
    if (board.repLoHash[i] == board.loHash && board.repHiHash[i] == board.hiHash)
      return CONTEMPT;
  }
  
  //}}}
  //{{{  horizon
  
  if (depth <= 0) {
  
    //score = board.ttGet(node, 0, alpha, beta);
  
    //if (score != TTSCORE_UNKNOWN)
      //return score;
  
    score = this.qSearch(node, depth-1, turn, alpha, beta);
  
    return score;
  }
  
  //}}}
  //{{{  try tt
  
  score = board.ttGet(node, depth, alpha, beta);  // sets/clears node.hashMove.
  
  if (score != TTSCORE_UNKNOWN) {
    return score;
  }
  
  //}}}

  if (inCheck == INCHECK_UNKNOWN)
    inCheck  = board.isKingAttacked(nextTurn);

  var betaMate = (beta <= -MINMATE && beta >= -MATE) || (beta >= MINMATE && beta <= MATE);
  var pvNode   = beta != (alpha + 1);
  var standPat = board.evaluate(turn);
  var R        = 0;
  var E        = 0;
  var loneKing = (turn == WHITE && board.wCount == 1) || (turn == BLACK && board.bCount == 1);

  //{{{  beta pruning
  
  if (!inCheck && !betaMate && !pvNode && depth <= 3) {
  
    score = standPat - depth * 70;
  
    if (score >= beta) {
      return score;
    }
  }
  
  //}}}

  node.cache();

  //{{{  try null move
  
  R = 3;
  
  if (!pvNode && !loneKing && standPat > beta && !betaMate && nullOK == NULL_Y && !inCheck) {
  
    board.loHash ^= board.loEP[board.ep];
    board.hiHash ^= board.hiEP[board.ep];
  
    board.ep = 0; // what else?
  
    board.loHash ^= board.loEP[board.ep];
    board.hiHash ^= board.hiEP[board.ep];
  
    board.loHash ^= board.loTurn;
    board.hiHash ^= board.hiTurn;
  
    score = -this.alphabeta(node.childNode, depth-R-1, nextTurn, -beta, -beta+1, NULL_N, INCHECK_UNKNOWN);
  
    node.uncache();
  
    if (this.stats.timeOut)
      return;
  
    if (score >= beta) {
      //board.ttPut(TT_BETA, depth, score, 0, node.ply);
      return score;
    }
  }
  
  R = 0;
  
  //}}}

  var bestScore      = -INFINITY;
  var move           = 0;
  var bestMove       = 0;
  var oAlpha         = alpha;
  var alphaMate      = (alpha <= -MINMATE && alpha >= -MATE) || (alpha >= MINMATE && alpha <= MATE);
  var alphaPrune     = !inCheck && depth <= 5 && (standPat + 10 + depth*70 < alpha);
  var lmPrune        = !inCheck && depth <= 3 && !betaMate;
  var lmReduce       = !inCheck && depth >= 2 && !betaMate;
  var numLegalMoves  = 0;
  var numSlides      = 0;
  var givesCheck     = 0;
  var safe           = false;

  //{{{  IID
  
  if (!node.hashMove && pvNode && depth > 3) {
    this.alphabeta(node.childNode, depth-2, turn, alpha, beta, NULL_N, inCheck);
    board.ttGet(node, 0, alpha, beta);
  }
  
  //}}}

  board.genMoves(node, turn);

  while (move = node.getNextMove()) {

    board.makeMove(node,move);

    //{{{  legal?
    
    if (move != node.hashMove && board.isKingAttacked(nextTurn)) {
    
      board.unmakeMove(node,move);
    
      node.uncache();
    
      continue;
    }
    
    //}}}

    numLegalMoves++;

    if (node.base < BASE_LMR)
      numSlides += 1;

    givesCheck = board.isKingAttacked(turn);
    safe       = !alphaMate && !(move & KEEPER_MASK) && !givesCheck;

    //{{{  prune
    
    if (alphaPrune && safe && numLegalMoves > 1) {
    
      board.unmakeMove(node,move);
      node.uncache();
      continue;
    }
    
    if (lmPrune && safe && numSlides > depth*10) {
    
      board.unmakeMove(node,move);
      node.uncache();
      continue;
    }
    
    //}}}
    //{{{  E+R
    
    E = 0;
    R = 0;
    
    if (inCheck)
      E = 1;
    
    if (!E && lmReduce && safe && numSlides > 5) {
      R = (depth >= 8) ? depth >> 2 : 1;
    }
    
    //}}}

    if (pvNode) {
      if (numLegalMoves == 1)
        score = -this.alphabeta(node.childNode, depth+E-1, nextTurn, -beta, -alpha, NULL_Y, givesCheck);
      else {
        score = -this.alphabeta(node.childNode, depth+E-R-1, nextTurn, -alpha-1, -alpha, NULL_Y, givesCheck);
        if (!this.stats.timeOut && score > alpha) {
          score = -this.alphabeta(node.childNode, depth+E-1, nextTurn, -beta, -alpha, NULL_Y, givesCheck);
        }
      }
    }
    else {
      score = -this.alphabeta(node.childNode, depth+E-R-1, nextTurn, -beta, -alpha, NULL_Y, givesCheck);  // ZW by implication.
      if (R && !this.stats.timeOut && score > alpha)
        score = -this.alphabeta(node.childNode, depth+E-1, nextTurn, -beta, -alpha, NULL_Y, givesCheck);
    }

    //{{{  unmake move
    
    board.unmakeMove(node,move);
    
    node.uncache();
    
    //}}}

    if (this.stats.timeOut)
      return;

    if (score > bestScore) {
      if (score > alpha) {
        if (score >= beta) {
          node.addKiller(score, move);
          board.ttPut(TT_BETA, depth, score, move, node.ply);
          board.addHistory(depth, move);
          return score;
        }
        board.ttPut(TT_ALPHA, depth, score, move, node.ply);
        board.addHistory(depth, move);
        alpha     = score;
        alphaMate = (alpha <= -MINMATE && alpha >= -MATE) || (alpha >= MINMATE && alpha <= MATE);
      }
      bestScore = score;
      bestMove  = move;
    }
  }

  //{{{  no moves?
  
  if (numLegalMoves == 0) {
  
    if (inCheck)
      return -MATE + node.ply;
  
    else
      return CONTEMPT;
  
  }
  
  //}}}

  if (bestScore > oAlpha) {
    board.ttPut(TT_EXACT, depth, bestScore, bestMove, node.ply);
    return bestScore;
  }
  else {
    board.ttPut(TT_ALPHA, depth, oAlpha,    bestMove, node.ply);
    return oAlpha;
  }
}

//}}}
//{{{  .quiescence

lozChess.prototype.qSearch = function (node, depth, turn, alpha, beta) {

  var board    = this.board;
  var standPat = board.evaluate(turn);
  var gPhase   = board.gPhase;

  //{{{  housekeeping
  
  if (!node.childNode) {
    this.uci.debug('Q DEPTH');
    return standPat;
  }
  
  if (node.ply > this.stats.selDepth)
    this.stats.selDepth = node.ply;
  
  //}}}

  if (standPat >= beta) {  // DO NOT BE TEMPTED TO USE FAIL SOFT!!!
    return beta;
  }

  if (standPat + VALUE_QUEEN < alpha) {
    return alpha;
  }

  var nextTurn = ~turn & COLOR_MASK;
  var move     = 0;

  alpha = (standPat > alpha) ? standPat : alpha;

  node.cache();

  board.genQMoves(node, turn);

  while (move = node.getNextMove()) {

    board.makeMove(node,move);

    //{{{  legal?
    
    if (board.isKingAttacked(nextTurn)) {
    
      board.unmakeMove(node,move);
    
      node.uncache();
    
      continue;
    }
    
    //}}}
    //{{{  futile?
    
    if (gPhase <= EPHASE && !(move & MOVE_PROMOTE_MASK) && standPat + 200 + VALUE_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK] < alpha) {
    
      board.unmakeMove(node,move);
    
      node.uncache();
    
      continue;
    }
    
    //}}}

    var score = -this.qSearch(node.childNode, depth-1, nextTurn, -beta, -alpha);

    //{{{  unmake move
    
    board.unmakeMove(node,move);
    
    node.uncache();
    
    //}}}

    if (score > alpha) {
      if (score >= beta) {
        return beta;
      }
      alpha = score;
    }
  }

  return alpha;
}

//}}}
//{{{  .perft

lozChess.prototype.perft = function () {

  var spec = this.uci.spec;

  this.stats.ply = spec.depth;

  var moves = this.perftSearch(this.rootNode, spec.depth, this.board.turn, spec.inner);

  this.stats.update();

  var error = moves - spec.moves;

  if (error == 0)
    var err = '';
  else
    var err = 'ERROR ' + error;

  this.uci.send('info string',spec.id,spec.depth,moves,spec.moves,err);
}

//}}}
//{{{  .perftSearch

lozChess.prototype.perftSearch = function (node, depth, turn, inner) {

  this.stats.nodes++;

  if (depth == 0)
    return 1;

  var board         = this.board;
  var numNodes      = 0;
  var totalNodes    = 0;
  var move          = 0;
  var nextTurn      = ~turn & COLOR_MASK;
  var numLegalMoves = 0;

  node.cache();

  board.genMoves(node, turn);

  while (move = node.getNextMove()) {

    board.makeMove(node,move);

    //{{{  legal?
    
    if (board.isKingAttacked(nextTurn)) {
    
       board.unmakeMove(node,move);
    
       node.uncache();
    
       continue;
    }
    
    //}}}

    numLegalMoves++;

    var numNodes = this.perftSearch(node.childNode, depth-1, nextTurn);

    totalNodes += numNodes;

    //{{{  unmake move
    
    board.unmakeMove(node,move);
    
    node.uncache();
    
    //}}}

    if (node.root) {
      var fmove = board.formatMove(move,SAN_FMT);
      this.uci.send('info currmove ' + fmove + ' currmovenumber ' + numLegalMoves);
      if (inner)
        this.uci.send('info string',fmove,numNodes);
    }
  }

  if (depth > 2)
    this.stats.lazyUpdate();

  return totalNodes;
}

//}}}

//}}}
//{{{  lozBoard class

//{{{  lozBoard

function lozBoard () {

  this.lozza   = null;
  this.verbose = false;
  this.tab     = '';

  this.b = Array(144);     // pieces.
  this.z = Array(144);     // indexes to w|bList.

  this.wList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];      // list of squares with white pieces.
  this.bList = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];      // list of squares with black pieces.

  this.runningEvalS = 0;  // these are all cached across make/unmakeMove.
  this.runningEvalE = 0;
  this.rights       = 0;
  this.ep           = 0;
  this.repLo        = 0;
  this.repHi        = 0;
  this.loHash       = 0;
  this.hiHash       = 0;
  this.ploHash      = 0;
  this.phiHash      = 0;

  this.ttSize = 1 << 24;          // tt size.
  this.ttMask = this.ttSize - 1;  // mask to index tt.

  // use separate typed arrays to save space.  optimiser probably has a go anyway but better
  // to be explicit at the expense of some conversion.  total width is 16 bytes.

  this.ttLo    = new Int32Array(this.ttSize);  // must not be Uint32.  not really sure why.
  this.ttHi    = new Int32Array(this.ttSize);  // "
  this.ttType  = new Uint8Array(this.ttSize);
  this.ttDepth = new Int8Array(this.ttSize);   // allow -ve depths but currently not used for q.
  this.ttMove  = new Uint32Array(this.ttSize); // see constants for structure.
  this.ttScore = new Int16Array(this.ttSize);

  this.pttSize = 1 << 14;
  this.pttMask = this.pttSize - 1;

  this.pttLo     = new Int32Array(this.pttSize);
  this.pttHi     = new Int32Array(this.pttSize);
  this.pttType   = new Uint8Array(this.pttSize);
  this.pttScoreS = new Int16Array(this.pttSize);
  this.pttScoreE = new Int16Array(this.pttSize);

  this.ttInit();

  this.turn = 0;

  //{{{  Zobrist turn
  
  this.loTurn = this.rand32();
  this.hiTurn = this.rand32();
  
  //}}}
  //{{{  Zobrist pieces
  
  this.loPieces = Array(2);
  for (var i=0; i < 2; i++) {
    this.loPieces[i] = Array(6);
    for (var j=0; j < 6; j++) {
      this.loPieces[i][j] = Array(144);
      for (var k=0; k < 144; k++)
        this.loPieces[i][j][k] = this.rand32();
    }
  }
  
  this.hiPieces = Array(2);
  for (var i=0; i < 2; i++) {
    this.hiPieces[i] = Array(6);
    for (var j=0; j < 6; j++) {
      this.hiPieces[i][j] = Array(144);
      for (var k=0; k < 144; k++)
        this.hiPieces[i][j][k] = this.rand32();
    }
  }
  
  //}}}
  //{{{  Zobrist rights
  
  this.loRights = Array(16);
  this.hiRights = Array(16);
  
  for (var i=0; i < 16; i++) {
    this.loRights[i] = this.rand32();
    this.hiRights[i] = this.rand32();
  }
  
  //}}}
  //{{{  Zobrist EP
  
  this.loEP = Array(144);
  this.hiEP = Array(144);
  
  for (var i=0; i < 144; i++) {
    this.loEP[i] = this.rand32();
    this.hiEP[i] = this.rand32();
  }
  
  //}}}

  this.repLoHash = Array(1000);
  for (var i=0; i < 1000; i++)
    this.repLoHash[i] = 0;

  this.repHiHash = Array(1000);
  for (var i=0; i < 1000; i++)
    this.repHiHash[i] = 0;

  this.phase  = 0;
  this.gPhase = 0;

  this.wCounts = [0,0,0,0,0,0,0];
  this.bCounts = [0,0,0,0,0,0,0];

  this.wCount  = 0;
  this.bCount  = 0;

  this.wPawns = [9,9,9,9,9,9,9,9,9,9];
  this.bPawns = [0,0,0,0,0,0,0,0,0,0];

  this.mobilityS = 0;
  this.mobilityE = 0;

  this.wHistory = Array(7)
  for (var i=0; i < 7; i++) {
    this.wHistory[i] = Array(144);
    for (var j=0; j < 144; j++)
      this.wHistory[i][j] = 0;
  }

  this.bHistory = Array(7)
  for (var i=0; i < 7; i++) {
    this.bHistory[i] = Array(144);
    for (var j=0; j < 144; j++)
      this.bHistory[i][j] = 0;
  }
}

//}}}
//{{{  .init

lozBoard.prototype.init = function () {

  for (var i=0; i < this.b.length; i++)
    this.b[i] = EDGE;

  for (var i=0; i < B88.length; i++)
    this.b[B88[i]] = NULL;

  for (var i=0; i < this.z.length; i++)
    this.z[i] = NO_Z;

  this.loHash = 0;
  this.hiHash = 0;

  this.ploHash = 0;
  this.phiHash = 0;

  this.repLo = 0;
  this.repHi = 0;

  this.phase  = TPHASE;
  this.gPhase = 0;

  for (var i=0; i < this.wCounts.length; i++)
    this.wCounts[i] = 0;

  for (var i=0; i < this.bCounts.length; i++)
    this.bCounts[i] = 0;

  this.wCount = 0;
  this.bCount = 0;

  for (var i=0; i < this.wList.length; i++)
    this.wList[i] = EMPTY;

  for (var i=0; i < this.bList.length; i++)
    this.bList[i] = EMPTY;

  this.firstBP = 0;
  this.firstWP = 0;

  this.mobilityS = 0;
  this.mobilityE = 0;
}

//}}}
//{{{  .position

lozBoard.prototype.position = function () {

  var spec = this.lozza.uci.spec;

  //{{{  board turn
  
  if (spec.turn == 'w')
    this.turn = WHITE;
  
  else {
    this.turn = BLACK;
    this.loHash ^= this.loTurn;
    this.hiHash ^= this.hiTurn;
  }
  
  //}}}
  //{{{  board rights
  
  this.rights = 0;
  
  for (var i=0; i < spec.rights.length; i++) {
  
    var ch = spec.rights.charAt(i);
  
    if (ch == 'K') this.rights |= WHITE_RIGHTS_KING;
    if (ch == 'Q') this.rights |= WHITE_RIGHTS_QUEEN;
    if (ch == 'k') this.rights |= BLACK_RIGHTS_KING;
    if (ch == 'q') this.rights |= BLACK_RIGHTS_QUEEN;
  }
  
  this.loHash ^= this.loRights[this.rights];
  this.hiHash ^= this.hiRights[this.rights];
  
  //}}}
  //{{{  board board
  
  this.phase = TPHASE;
  
  var sq = 0;
  var nw = 0;
  var nb = 0;
  
  for (var j=0; j < spec.board.length; j++) {
  
    var ch  = spec.board.charAt(j);
    var chn = parseInt(ch);
  
    while (this.b[sq] == EDGE)
      sq++;
  
    if (isNaN(chn)) {
  
      if (ch != '/') {
  
        var obj   = MAP[ch];
        var piece = obj & PIECE_MASK;
        var col   = obj & COLOR_MASK;
  
        if (col == WHITE) {
          this.wList[nw] = sq;
          this.b[sq]     = obj;
          this.z[sq]     = nw;
          nw++;
          this.wCounts[piece]++;
          this.wCount++;
        }
  
        else {
          this.bList[nb] = sq;
          this.b[sq]     = obj;
          this.z[sq]     = nb;
          nb++;
          this.bCounts[piece]++;
          this.bCount++;
        }
  
        this.loHash ^= this.loPieces[col>>>3][piece-1][sq];
        this.hiHash ^= this.hiPieces[col>>>3][piece-1][sq];
  
        if (piece == PAWN) {
          this.ploHash ^= this.loPieces[col>>>3][0][sq];
          this.phiHash ^= this.hiPieces[col>>>3][0][sq];
        }
  
        this.phase -= VPHASE[piece];
  
        sq++;
      }
    }
  
    else {
  
      for (var k=0; k < chn; k++) {
        this.b[sq] = NULL;
        sq++;
      }
    }
  }
  
  
  //}}}
  //{{{  board ep
  
  if (spec.ep.length == 2)
    this.ep = COORDS.indexOf(spec.ep)
  else
    this.ep = 0;
  
  this.loHash ^= this.loEP[this.ep];
  this.hiHash ^= this.hiEP[this.ep];
  
  //}}}

  //{{{  init running evals
  
  this.runningEvalS = 0;
  this.runningEvalE = 0;
  
  var next  = 0;
  var count = 0;
  
  while (count < this.wCount) {
  
    sq = this.wList[next];
  
    if (!sq) {
      next++;
      continue;
    }
  
    var piece = this.b[sq] & PIECE_MASK;
  
    this.runningEvalS += VALUE_VECTOR[piece];
    this.runningEvalS += WS_PST[piece][sq];
    this.runningEvalE += VALUE_VECTOR[piece];
    this.runningEvalE += WE_PST[piece][sq];
  
    count++;
    next++
  }
  
  var next  = 0;
  var count = 0;
  
  while (count < this.bCount) {
  
    sq = this.bList[next];
  
    if (!sq) {
      next++;
      continue;
    }
  
    var piece = this.b[sq] & PIECE_MASK;
  
    this.runningEvalS -= VALUE_VECTOR[piece];
    this.runningEvalS -= BS_PST[piece][sq];
    this.runningEvalE -= VALUE_VECTOR[piece];
    this.runningEvalE -= BE_PST[piece][sq];
  
    count++;
    next++
  }
  
  
  //}}}

  this.compact();

  for (var i=0; i < spec.moves.length; i++) {
    if (!this.playMove(spec.moves[i]))
      return 0;
    if (i == spec.moves.length - 1)
      spec.fen = this.fen();
  }

  this.compact();

  for (var i=0; i < 7; i++) {
    for (var j=0; j < 144; j++)
      this.wHistory[i][j] = 0;
  }

  for (var i=0; i < 7; i++) {
    for (var j=0; j < 144; j++)
      this.bHistory[i][j] = 0;
  }

  return 1;
}

//}}}
//{{{  .compact

lozBoard.prototype.compact = function () {

  //{{{  compact white list
  
  var v = [];
  
  for (var i=0; i<16; i++) {
    if (this.wList[i])
      v.push(this.wList[i]);
  }
  
  v.sort(function(a,b) {
    return lozza.board.b[b] - lozza.board.b[a];
  });
  
  for (var i=0; i<16; i++) {
    if (i < v.length) {
      this.wList[i] = v[i];
      this.z[v[i]]  = i;
    }
    else
      this.wList[i] = EMPTY;
  }
  
  this.firstWP = 0;
  for (var i=0; i<16; i++) {
    if (this.b[this.wList[i]] == W_PAWN) {
      this.firstWP = i;
      break;
    }
  }
  
  /*
  console.log('WHITE LIST ' + v.length);
  for (var i=0; i<this.wCount; i++) {
    console.log(this.b[this.wList[i]]);
  }
  */
  
  if (this.b[this.wList[0]] != W_KING)
    console.log('WHITE INDEX ERR');
  
  //}}}
  //{{{  compact black list
  
  var v = [];
  
  for (var i=0; i<16; i++) {
    if (this.bList[i])
      v.push(this.bList[i]);
  }
  
  v.sort(function(a,b) {
    return lozza.board.b[b] - lozza.board.b[a];
  });
  
  for (var i=0; i<16; i++) {
    if (i < v.length) {
      this.bList[i] = v[i];
      this.z[v[i]]  = i;
    }
    else
      this.bList[i] = EMPTY;
  }
  
  this.firstBP = 0;
  for (var i=0; i<16; i++) {
    if (this.b[this.bList[i]] == B_PAWN) {
      this.firstBP = i;
      break;
    }
  }
  
  /*
  console.log('BLACK LIST ' + v.length);
  for (var i=0; i<this.bCount; i++) {
    console.log(this.b[this.bList[i]]);
  }
  */
  
  if (this.b[this.bList[0]] != B_KING)
    console.log('BLACK INDEX ERR');
  
  //}}}
}

//}}}
//{{{  .genMoves

lozBoard.prototype.genMoves = function(node, turn) {

  node.numMoves    = 0;
  node.sortedIndex = 0;

  var b = this.b;

  //{{{  colour based stuff
  
  if (turn == WHITE) {
  
    var pOffsetOrth  = WP_OFFSET_ORTH;
    var pOffsetDiag1 = WP_OFFSET_DIAG1;
    var pOffsetDiag2 = WP_OFFSET_DIAG2;
    var pHomeRank    = 2;
    var pPromoteRank = 8;
    var rights       = this.rights & WHITE_RIGHTS;
    var pList        = this.wList;
    var pCount       = this.wCount;
  
    if (rights) {
  
      if ((rights & WHITE_RIGHTS_KING)  && b[F1] == NULL && b[G1] == NULL                  && !this.isAttacked(F1,BLACK) && !this.isAttacked(E1,BLACK))
        node.addMove(MOVE_E1G1);
  
      if ((rights & WHITE_RIGHTS_QUEEN) && b[B1] == NULL && b[C1] == NULL && b[D1] == NULL && !this.isAttacked(D1,BLACK) && !this.isAttacked(E1,BLACK))
        node.addMove(MOVE_E1C1);
    }
  }
  
  else {
  
    var pOffsetOrth  = BP_OFFSET_ORTH;
    var pOffsetDiag1 = BP_OFFSET_DIAG1;
    var pOffsetDiag2 = BP_OFFSET_DIAG2;
    var pHomeRank    = 7;
    var pPromoteRank = 1;
    var rights       = this.rights & BLACK_RIGHTS;
    var pList        = this.bList;
    var pCount       = this.bCount;
  
    if (rights) {
  
      if ((rights & BLACK_RIGHTS_KING)  && b[F8] == NULL && b[G8] == NULL &&                  !this.isAttacked(F8,WHITE) && !this.isAttacked(E8,WHITE))
        node.addMove(MOVE_E8G8);
  
      if ((rights & BLACK_RIGHTS_QUEEN) && b[B8] == NULL && b[C8] == NULL && b[D8] == NULL && !this.isAttacked(D8,WHITE) && !this.isAttacked(E8,WHITE))
        node.addMove(MOVE_E8C8);
    }
  }
  
  //}}}

  var next  = 0;
  var count = 0;

  while (count < pCount) {

    var fr = pList[next];
    if (!fr) {
      next++;
      continue;
    }

    var frObj   = this.b[fr];
    var frPiece = frObj & PIECE_MASK;
    var frMove  = (frObj << MOVE_FROBJ_BITS) | (fr << MOVE_FR_BITS);

    if (frPiece == PAWN) {
      //{{{  pawn
      
      frMove |= MOVE_PAWN_MASK;
      
      var to     = fr + pOffsetOrth;
      var toObj  = b[to];
      
      if (toObj == NULL) {
      
        if (RANK[to] == pPromoteRank)
          node.addPromotion(MOVE_PROMOTE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      
        else {
          node.addMove(frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      
          if (RANK[fr] == pHomeRank) {
      
            to    += pOffsetOrth;
            toObj = b[to];
      
            if (toObj == NULL)
              node.addMove(MOVE_EPMAKE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
          }
        }
      }
      
      var to    = fr + pOffsetDiag1;
      var toObj = b[to];
      
      if (toObj != NULL && toObj != EDGE && (toObj & COLOR_MASK) != turn) {
      
        if (RANK[to] == pPromoteRank)
          node.addPromotion(MOVE_PROMOTE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        else
          node.addMove(frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      }
      
      else if (toObj == NULL && to == this.ep)
        node.addMove(MOVE_EPTAKE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      
      var to    = fr + pOffsetDiag2;
      var toObj = b[to];
      
      if (toObj != NULL && toObj != EDGE && (toObj & COLOR_MASK) != turn) {
      
        if (RANK[to] == pPromoteRank)
          node.addPromotion(MOVE_PROMOTE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        else
          node.addMove(frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      }
      
      else if (toObj == NULL && to == this.ep)
        node.addMove(MOVE_EPTAKE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      
      //}}}
    }

    else {
      //{{{  not a pawn
      
      var offsets = OFFSETS[frPiece];
      var limit   = LIMITS[frPiece];
      
      for (var dir=0; dir < offsets.length; dir++) {
      
        var offset = offsets[dir];
      
        for (var slide=1; slide<=limit; slide++) {
      
          var to    = fr + offset * slide;
          var toObj = b[to];
      
          if (toObj == NULL) {
            node.addMove(frMove | (toObj << MOVE_TOOBJ_BITS) | to);
            continue;
          }
      
          if (toObj == EDGE)
            break;
      
          if ((toObj & COLOR_MASK) != turn)
            node.addMove(frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      
          break;
        }
      }
      
      //}}}
    }

    next++;
    count++
  }
}

//}}}
//{{{  .mobility
//
//  Pawns are ignored.  Connectivity for exmaple is in the pawn hash.
//  As a simplification, pieces created by promoted pawns are ignored.
//


lozBoard.prototype.mobility = function(turn) {

  var m = 5;

  if (this.lozza.uci.tuning)
    m = this.lozza.uci.tune1;

  var mobS = 0;
  var mobE = 0;
  var b    = this.b;

  //{{{  colour based stuff
  
  if (turn == WHITE) {
  
    var pList     = this.wList;
    var pCount    = this.wCount - 1 - this.wCounts[PAWN];
  }
  
  else {
  
    var pList     = this.bList;
    var pCount    = this.bCount - 1 - this.bCounts[PAWN];
  }
  
  //}}}

  var next  = 1;  // ignore king.
  var count = 0;

  while (count < pCount) {

    var fr = pList[next++];
    if (!fr)
      continue;

    var frPiece = this.b[fr] & PIECE_MASK;

    //{{{  piece mobility
    
    var offsets = OFFSETS[frPiece];
    var limit   = LIMITS[frPiece];
    
    for (var dir=0; dir < offsets.length; dir++) {
    
      var offset = offsets[dir];
    
      for (var slide=1; slide<=limit; slide++) {
    
        var to    = fr + offset * slide;
        var toObj = b[to];
    
        if (toObj == NULL) {
          mobS += m;
          mobE += m;
          continue;
        }
    
        if (toObj == EDGE)
          break;
    
        mobS += m;
        mobE += m;
    
        break;
      }
    }
    
    //}}}

    count++;
  }

  this.mobilityS = mobS;
  this.mobilityE = mobE;
}

//}}}
//{{{  .makeMove

lozBoard.prototype.makeMove = function (node,move) {

  var b = this.b;
  var z = this.z;

  var fr      = (move & MOVE_FR_MASK   ) >>> MOVE_FR_BITS;
  var to      = (move & MOVE_TO_MASK   ) >>> MOVE_TO_BITS;
  var toObj   = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;
  var frObj   = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  var frPiece = frObj & PIECE_MASK;
  var frCol   = frObj & COLOR_MASK;
  var frColI  = frCol >>> 3;

  //{{{  slide piece
  
  b[fr] = NULL;
  b[to] = frObj;
  
  node.frZ = z[fr];
  node.toZ = z[to];
  
  z[fr] = NO_Z;
  z[to] = node.frZ;
  
  this.loHash ^= this.loPieces[frColI][frPiece-1][fr];
  this.hiHash ^= this.hiPieces[frColI][frPiece-1][fr];
  
  this.loHash ^= this.loPieces[frColI][frPiece-1][to];
  this.hiHash ^= this.hiPieces[frColI][frPiece-1][to];
  
  if (frPiece == PAWN) {
    this.ploHash ^= this.loPieces[frColI][PAWN-1][fr];
    this.phiHash ^= this.hiPieces[frColI][PAWN-1][fr];
    this.ploHash ^= this.loPieces[frColI][PAWN-1][to];
    this.phiHash ^= this.hiPieces[frColI][PAWN-1][to];
  }
  
  if (frCol == WHITE) {
  
    this.wList[node.frZ] = to;
  
    this.runningEvalS -= WS_PST[frPiece][fr];
    this.runningEvalS += WS_PST[frPiece][to];
    this.runningEvalE -= WE_PST[frPiece][fr];
    this.runningEvalE += WE_PST[frPiece][to];
  }
  
  else {
  
    this.bList[node.frZ] = to;
  
    this.runningEvalS += BS_PST[frPiece][fr];
    this.runningEvalS -= BS_PST[frPiece][to];
    this.runningEvalE += BE_PST[frPiece][fr];
    this.runningEvalE -= BE_PST[frPiece][to];
  }
  
  //}}}
  //{{{  clear rights?
  
  if (this.rights) {
  
    this.loHash ^= this.loRights[this.rights];
    this.hiHash ^= this.hiRights[this.rights];
  
    this.rights &= MASK_RIGHTS[fr] & MASK_RIGHTS[to];
  
    this.loHash ^= this.loRights[this.rights];
    this.hiHash ^= this.hiRights[this.rights];
  }
  
  //}}}
  //{{{  capture?
  
  if (toObj) {
  
    var toPiece = toObj & PIECE_MASK;
    var toCol   = toObj & COLOR_MASK;
    var toColI  = toCol >>> 3;
  
    this.loHash ^= this.loPieces[toColI][toPiece-1][to];
    this.hiHash ^= this.hiPieces[toColI][toPiece-1][to];
  
    if (toPiece == PAWN) {
      this.ploHash ^= this.loPieces[toColI][PAWN-1][to];
      this.phiHash ^= this.hiPieces[toColI][PAWN-1][to];
    }
  
    this.phase += VPHASE[toPiece];
  
    if (toCol == WHITE) {
  
      this.wList[node.toZ] = EMPTY;
  
      this.runningEvalS -= VALUE_VECTOR[toPiece];
      this.runningEvalS -= WS_PST[toPiece][to];
      this.runningEvalE -= VALUE_VECTOR[toPiece];
      this.runningEvalE -= WE_PST[toPiece][to];
  
      this.wCounts[toPiece]--;
      this.wCount--;
    }
  
    else {
  
      this.bList[node.toZ] = EMPTY;
  
      this.runningEvalS += VALUE_VECTOR[toPiece];
      this.runningEvalS += BS_PST[toPiece][to];
      this.runningEvalE += VALUE_VECTOR[toPiece];
      this.runningEvalE += BE_PST[toPiece][to];
  
      this.bCounts[toPiece]--;
      this.bCount--;
    }
  }
  
  //}}}
  //{{{  reset EP
  
  this.loHash ^= this.loEP[this.ep];
  this.hiHash ^= this.hiEP[this.ep];
  
  this.ep = 0;
  
  this.loHash ^= this.loEP[this.ep];
  this.hiHash ^= this.hiEP[this.ep];
  
  //}}}

  if (move & MOVE_SPECIAL_MASK) {
    //{{{  ikky stuff
    
    if (frCol == WHITE) {
    
      var ep = to + 12;
    
      if (move & MOVE_EPMAKE_MASK) {
    
        this.loHash ^= this.loEP[this.ep];
        this.hiHash ^= this.hiEP[this.ep];
    
        this.ep = ep;
    
        this.loHash ^= this.loEP[this.ep];
        this.hiHash ^= this.hiEP[this.ep];
      }
    
      else if (move & MOVE_EPTAKE_MASK) {
    
        b[ep]    = NULL;
        node.epZ = z[ep];
        z[ep]    = NO_Z;
    
        this.bList[node.epZ] = EMPTY;
    
        this.loHash ^= this.loPieces[I_BLACK][PAWN-1][ep];
        this.hiHash ^= this.hiPieces[I_BLACK][PAWN-1][ep];
    
        this.ploHash ^= this.loPieces[I_BLACK][PAWN-1][ep];
        this.phiHash ^= this.hiPieces[I_BLACK][PAWN-1][ep];
    
        this.runningEvalS += VALUE_PAWN;
        this.runningEvalS += BS_PST[PAWN][ep];  // sic.
        this.runningEvalE += VALUE_PAWN;
        this.runningEvalE += BE_PST[PAWN][ep];  // sic.
    
        this.bCounts[PAWN]--;
        this.bCount--;
      }
    
      else if (move & MOVE_PROMOTE_MASK) {
    
        var pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
        b[to]   = WHITE | pro;
    
        this.loHash ^= this.loPieces[I_WHITE][PAWN-1][to];
        this.hiHash ^= this.hiPieces[I_WHITE][PAWN-1][to];
        this.loHash ^= this.loPieces[I_WHITE][pro-1][to];
        this.hiHash ^= this.hiPieces[I_WHITE][pro-1][to];
    
        this.ploHash ^= this.loPieces[0][PAWN-1][to];
        this.phiHash ^= this.hiPieces[0][PAWN-1][to];
    
        this.runningEvalS -= VALUE_PAWN;
        this.runningEvalS -= WS_PST[PAWN][to];
        this.runningEvalE -= VALUE_PAWN;
        this.runningEvalE -= WE_PST[PAWN][to];
    
        this.wCounts[PAWN]--;
    
        this.runningEvalS += VALUE_VECTOR[pro];
        this.runningEvalS += WS_PST[pro][to];
        this.runningEvalE += VALUE_VECTOR[pro];
        this.runningEvalE += WE_PST[pro][to];
    
        this.wCounts[pro]++;
    
        this.phase -= VPHASE[pro];
      }
    
      else if (move == MOVE_E1G1) {
    
        b[H1] = NULL;
        b[F1] = W_ROOK;
        z[F1] = z[H1];
        z[H1] = NO_Z;
    
        this.wList[z[F1]] = F1;
    
        this.loHash ^= this.loPieces[I_WHITE][ROOK-1][H1];
        this.hiHash ^= this.hiPieces[I_WHITE][ROOK-1][H1];
        this.loHash ^= this.loPieces[I_WHITE][ROOK-1][F1];
        this.hiHash ^= this.hiPieces[I_WHITE][ROOK-1][F1];
    
        this.runningEvalS -= WS_PST[ROOK][H1];
        this.runningEvalS += WS_PST[ROOK][F1];
        this.runningEvalE -= WE_PST[ROOK][H1];
        this.runningEvalE += WE_PST[ROOK][F1];
      }
    
      else if (move == MOVE_E1C1) {
    
        b[A1] = NULL;
        b[D1] = W_ROOK;
        z[D1] = z[A1];
        z[A1] = NO_Z;
    
        this.wList[z[D1]] = D1;
    
        this.loHash ^= this.loPieces[I_WHITE][ROOK-1][A1];
        this.hiHash ^= this.hiPieces[I_WHITE][ROOK-1][A1];
        this.loHash ^= this.loPieces[I_WHITE][ROOK-1][D1];
        this.hiHash ^= this.hiPieces[I_WHITE][ROOK-1][D1];
    
        this.runningEvalS -= WS_PST[ROOK][A1];
        this.runningEvalS += WS_PST[ROOK][D1];
        this.runningEvalE -= WE_PST[ROOK][A1];
        this.runningEvalE += WE_PST[ROOK][D1];
      }
    }
    
    else {
    
      var ep = to - 12;
    
      if (move & MOVE_EPMAKE_MASK) {
    
        this.loHash ^= this.loEP[this.ep];
        this.hiHash ^= this.hiEP[this.ep];
    
        this.ep = ep;
    
        this.loHash ^= this.loEP[this.ep];
        this.hiHash ^= this.hiEP[this.ep];
      }
    
      else if (move & MOVE_EPTAKE_MASK) {
    
        b[ep]    = NULL;
        node.epZ = z[ep];
        z[ep]    = NO_Z;
    
        this.wList[node.epZ] = EMPTY;
    
        this.loHash ^= this.loPieces[I_WHITE][PAWN-1][ep];
        this.hiHash ^= this.hiPieces[I_WHITE][PAWN-1][ep];
    
        this.ploHash ^= this.loPieces[I_WHITE][PAWN-1][ep];
        this.phiHash ^= this.hiPieces[I_WHITE][PAWN-1][ep];
    
        this.runningEvalS -= VALUE_PAWN;
        this.runningEvalS -= WS_PST[PAWN][ep];  // sic.
        this.runningEvalE -= VALUE_PAWN;
        this.runningEvalE -= WE_PST[PAWN][ep];  // sic.
    
        this.wCounts[PAWN]--;
        this.wCount--;
      }
    
      else if (move & MOVE_PROMOTE_MASK) {
    
        var pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
        b[to]   = BLACK | pro;
    
        this.loHash ^= this.loPieces[I_BLACK][PAWN-1][to];
        this.hiHash ^= this.hiPieces[I_BLACK][PAWN-1][to];
        this.loHash ^= this.loPieces[I_BLACK][pro-1][to];
        this.hiHash ^= this.hiPieces[I_BLACK][pro-1][to];
    
        this.ploHash ^= this.loPieces[I_BLACK][PAWN-1][to];
        this.phiHash ^= this.hiPieces[I_BLACK][PAWN-1][to];
    
        this.runningEvalS += VALUE_PAWN;
        this.runningEvalS += BS_PST[PAWN][to];
        this.runningEvalE += VALUE_PAWN;
        this.runningEvalE += BE_PST[PAWN][to];
    
        this.bCounts[PAWN]--;
    
        this.runningEvalS -= VALUE_VECTOR[pro];
        this.runningEvalS -= BS_PST[pro][to];
        this.runningEvalE -= VALUE_VECTOR[pro];
        this.runningEvalE -= BE_PST[pro][to];
    
        this.bCounts[pro]++;
    
        this.phase -= VPHASE[pro];
      }
    
      else if (move == MOVE_E8G8) {
    
        b[H8] = NULL;
        b[F8] = B_ROOK;
        z[F8] = z[H8];
        z[H8] = NO_Z;
    
        this.bList[z[F8]] = F8;
    
        this.loHash ^= this.loPieces[I_BLACK][ROOK-1][H8];
        this.hiHash ^= this.hiPieces[I_BLACK][ROOK-1][H8];
        this.loHash ^= this.loPieces[I_BLACK][ROOK-1][F8];
        this.hiHash ^= this.hiPieces[I_BLACK][ROOK-1][F8];
    
        this.runningEvalS += BS_PST[ROOK][H8];
        this.runningEvalS -= BS_PST[ROOK][F8];
        this.runningEvalE += BE_PST[ROOK][H8];
        this.runningEvalE -= BE_PST[ROOK][F8];
      }
    
      else if (move == MOVE_E8C8) {
    
        b[A8] = NULL;
        b[D8] = B_ROOK;
        z[D8] = z[A8];
        z[A8] = NO_Z;
    
        this.bList[z[D8]] = D8;
    
        this.loHash ^= this.loPieces[I_BLACK][ROOK-1][A8];
        this.hiHash ^= this.hiPieces[I_BLACK][ROOK-1][A8];
        this.loHash ^= this.loPieces[I_BLACK][ROOK-1][D8];
        this.hiHash ^= this.hiPieces[I_BLACK][ROOK-1][D8];
    
        this.runningEvalS += BS_PST[ROOK][A8];
        this.runningEvalS -= BS_PST[ROOK][D8];
        this.runningEvalE += BE_PST[ROOK][A8];
        this.runningEvalE -= BE_PST[ROOK][D8];
      }
    }
    
    //}}}
  }

  //{{{  flip turn in hash
  
  this.loHash ^= this.loTurn;
  this.hiHash ^= this.hiTurn;
  
  //}}}
  //{{{  push rep hash
  //
  //  Repetitions are cancelled by pawn moves, castling, captures, EP
  //  and promotions; i.e. moves that are not reversible.  The nearest
  //  repetition is 5 indexes back from the current one and then that
  //  and every other one entry is a possible rep.  Can also check for
  //  50 move rule by testing hi-lo > 100 - it's not perfect because of
  //  the pawn move reset but it's a type 2 error, so safe.
  //
  
  this.repLoHash[this.repHi] = this.loHash;
  this.repHiHash[this.repHi] = this.hiHash;
  
  this.repHi++;
  
  if ((move & (MOVE_SPECIAL_MASK | MOVE_TOOBJ_MASK)) || frPiece == PAWN)
    this.repLo = this.repHi;
  
  //}}}
}

//}}}
//{{{  .unmakeMove

lozBoard.prototype.unmakeMove = function (node,move) {

  var b = this.b;
  var z = this.z;

  var fr    = (move & MOVE_FR_MASK   ) >>> MOVE_FR_BITS;
  var to    = (move & MOVE_TO_MASK   ) >>> MOVE_TO_BITS;
  var toObj = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;
  var frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  var frCol = frObj & COLOR_MASK;

  b[fr] = frObj;
  b[to] = toObj;

  z[fr] = node.frZ;
  z[to] = node.toZ;

  if (frCol == WHITE)
    this.wList[node.frZ] = fr;
  else
    this.bList[node.frZ] = fr;

  //{{{  capture?
  
  if (toObj) {
  
    var toPiece = toObj & PIECE_MASK;
    var toCol   = toObj & COLOR_MASK;
  
    this.phase -= VPHASE[toPiece];
  
    if (toCol == WHITE) {
  
      this.wList[node.toZ] = to;
  
      this.wCounts[toPiece]++;
      this.wCount++;
    }
  
    else {
  
      this.bList[node.toZ] = to;
  
      this.bCounts[toPiece]++;
      this.bCount++;
    }
  }
  
  //}}}

  if (move & MOVE_SPECIAL_MASK) {
    //{{{  ikky stuff
    
    if ((frObj & COLOR_MASK) == WHITE) {
    
      var ep = to + 12;
    
      if (move & MOVE_EPTAKE_MASK) {
    
        b[ep] = B_PAWN;
        z[ep] = node.epZ;
    
        this.bList[node.epZ] = ep;
    
        this.bCounts[PAWN]++;
        this.bCount++;
      }
    
      else if (move & MOVE_PROMOTE_MASK) {
    
        var pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
    
        this.wCounts[PAWN]++;
        this.wCounts[pro]--;
    
        this.phase += VPHASE[pro];
      }
    
      else if (move == MOVE_E1G1) {
    
        b[H1] = W_ROOK;
        b[F1] = NULL;
        z[H1] = z[F1];
        z[F1] = NO_Z;
    
        this.wList[z[H1]] = H1;
      }
    
      else if (move == MOVE_E1C1) {
    
        b[A1] = W_ROOK;
        b[D1] = NULL;
        z[A1] = z[D1];
        z[D1] = NO_Z;
    
        this.wList[z[A1]] = A1;
      }
    }
    
    else {
    
      var ep = to - 12;
    
      if (move & MOVE_EPTAKE_MASK) {
    
        b[ep] = W_PAWN;
        z[ep] = node.epZ;
    
        this.wList[node.epZ] = ep;
    
        this.wCounts[PAWN]++;
        this.wCount++;
      }
    
      else if (move & MOVE_PROMOTE_MASK) {
    
        var pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
    
        this.bCounts[PAWN]++;
        this.bCounts[pro]--;
    
        this.phase += VPHASE[pro];
      }
    
      else if (move == MOVE_E8G8) {
    
        b[H8] = B_ROOK;
        b[F8] = NULL;
        z[H8] = z[F8];
        z[F8] = NO_Z;
    
        this.bList[z[H8]] = H8;
      }
    
      else if (move == MOVE_E8C8) {
    
        b[A8] = B_ROOK;
        b[D8] = NULL;
        z[A8] = z[D8];
        z[D8] = NO_Z;
    
        this.bList[z[A8]] = A8;
      }
    }
    
    //}}}
  }
}

//}}}
//{{{  .genQMoves

lozBoard.prototype.genQMoves = function(node, turn) {

  node.numMoves    = 0;
  node.sortedIndex = 0;

  var b = this.b;

  //{{{  colour based stuff
  
  if (turn == WHITE) {
  
    var pOffsetDiag1 = WP_OFFSET_DIAG1;
    var pOffsetDiag2 = WP_OFFSET_DIAG2;
    var pPromoteRank = 8;
    var pList        = this.wList;
    var pCount       = this.wCount;
  }
  
  else {
  
    var pOffsetDiag1 = BP_OFFSET_DIAG1;
    var pOffsetDiag2 = BP_OFFSET_DIAG2;
    var pPromoteRank = 1;
    var pList        = this.bList;
    var pCount       = this.bCount;
  }
  
  //}}}

  var next  = 0;
  var count = 0;

  while (count < pCount) {

    var fr = pList[next];
    if (!fr) {
      next++;
      continue;
    }

    var frObj   = b[fr];
    var frPiece = frObj & PIECE_MASK;
    var frMove  = (frObj << MOVE_FROBJ_BITS) | (fr << MOVE_FR_BITS);

    if (frPiece == PAWN) {
      //{{{  pawn
      
      frMove |= MOVE_PAWN_MASK;
      
      var to    = fr + pOffsetDiag1;
      var toObj = b[to];
      
      if (toObj != NULL && toObj != EDGE && (toObj & COLOR_MASK) != turn) {
      
        if (RANK[to] == pPromoteRank)
          node.addQPromotion(MOVE_PROMOTE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        else
          node.addQMove(frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      }
      
      else if (toObj == NULL && to == this.ep)
        node.addQMove(MOVE_EPTAKE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      
      var to    = fr + pOffsetDiag2;
      var toObj = b[to];
      
      if (toObj != NULL && toObj != EDGE && (toObj & COLOR_MASK) != turn) {
      
        if (RANK[to] == pPromoteRank)
          node.addQPromotion(MOVE_PROMOTE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        else
          node.addQMove(frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      }
      
      else if (toObj == NULL && to == this.ep)
        node.addQMove(MOVE_EPTAKE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
      
      //}}}
    }

    else {
      //{{{  not a pawn
      
      var offsets = OFFSETS[frPiece];
      var limit   = LIMITS[frPiece];
      
      for (var dir=0; dir < offsets.length; dir++) {
      
        var offset = offsets[dir];
      
        for (var slide=1; slide<=limit; slide++) {
      
          var to    = fr + offset * slide;
          var toObj = b[to];
      
          if (toObj == NULL)
            continue;
      
          if (toObj == EDGE)
            break;
      
          if ((toObj & COLOR_MASK) != turn) {
            node.addQMove(frMove | (toObj << MOVE_TOOBJ_BITS) | to);
          }
      
          break;
        }
      }
      
      //}}}
    }

    next++;
    count++;
  }
}

//}}}
//{{{  .isKingAttacked

lozBoard.prototype.isKingAttacked = function(byCol) {

  return this.isAttacked((byCol == WHITE) ? this.bList[0] : this.wList[0], byCol);
}

//}}}
//{{{  .isAttacked

lozBoard.prototype.isAttacked = function(to, byCol) {

  var b = this.b;

  //{{{  queen, bishop, rook
  
  var offsets = QUEEN_OFFSETS;
  var len     = offsets.length;
  var cwtch   = 0;
  
  for (var dir=len; dir--;) {
  
    var offset = offsets[dir];
  
    for (var slide=1; slide<=8; slide++) {
  
      var frObj = b[to + slide*offset];
  
      if (frObj == NULL)
        continue;
  
      if ((frObj == EDGE) || (frObj & COLOR_MASK) != byCol) {
        cwtch++;
        break;
      }
  
      var frPiece = frObj & PIECE_MASK;
  
      if (frPiece == QUEEN || dir <= 3 && frPiece == BISHOP || dir > 3  && frPiece == ROOK)
        return frObj;
  
      break;
    }
  }
  
  //}}}
  //{{{  knights
  
  var attacker = KNIGHT | byCol;
  
  if (b[to + -10] == attacker) return attacker;
  if (b[to + -23] == attacker) return attacker;
  if (b[to + -14] == attacker) return attacker;
  if (b[to + -25] == attacker) return attacker;
  if (b[to +  10] == attacker) return attacker;
  if (b[to +  23] == attacker) return attacker;
  if (b[to +  14] == attacker) return attacker;
  if (b[to +  25] == attacker) return attacker;
  
  //}}}

  if (cwtch == 8)
    return 0;

  //{{{  pawns
  
  if (byCol == BLACK && b[to + WP_OFFSET_DIAG1] == B_PAWN) return B_PAWN;
  if (byCol == BLACK && b[to + WP_OFFSET_DIAG2] == B_PAWN) return B_PAWN;
  if (byCol == WHITE && b[to + BP_OFFSET_DIAG1] == W_PAWN) return W_PAWN;
  if (byCol == WHITE && b[to + BP_OFFSET_DIAG2] == W_PAWN) return W_PAWN;
  
  //}}}
  //{{{  kings
  
  var attacker = KING | byCol;
  
  if (b[to + -11] == attacker) return attacker;
  if (b[to + -13] == attacker) return attacker;
  if (b[to + -12] == attacker) return attacker;
  if (b[to + -1 ] == attacker) return attacker;
  if (b[to +  11] == attacker) return attacker;
  if (b[to +  13] == attacker) return attacker;
  if (b[to +  12] == attacker) return attacker;
  if (b[to +  1 ] == attacker) return attacker;
  
  //}}}

  return 0;
}

//}}}
//{{{  .formatMove

lozBoard.prototype.formatMove = function (move, fmt) {

  if (move == 0)
    return 'NULL';

  var fr    = (move & MOVE_FR_MASK   ) >>> MOVE_FR_BITS;
  var to    = (move & MOVE_TO_MASK   ) >>> MOVE_TO_BITS;
  var toObj = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;
  var frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;

  var frCoord = COORDS[fr];
  var toCoord = COORDS[to];

  var frPiece = frObj & PIECE_MASK;
  var frCol   = frObj & COLOR_MASK;
  var frName  = NAMES[frPiece];

  var toPiece = toObj & PIECE_MASK;
  var toCol   = toObj & COLOR_MASK;
  var toName  = NAMES[toPiece];

  if (move & MOVE_PROMOTE_MASK)
    var pro = PROMOTES[(move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS];
  else
    var pro = '';

  if (fmt == UCI_FMT)
    return frCoord + toCoord + pro;

  if (toObj != NULL) {
    if (frPiece == PAWN)
      return frCoord + 'x' + toCoord + pro;
    else
      return frName + 'x' + toCoord;
  }

  if (frPiece == PAWN)
    return toCoord + pro;

  if (move == MOVE_E1G1 || move == MOVE_E8G8)
    return '0-0';

  if (move == MOVE_E1C1 || move == MOVE_E8C8)
    return '0-0-0';

  return frName + toCoord;

}

//}}}
//{{{  .evaluate

lozBoard.prototype.evaluate = function (turn) {

  //this.hashCheck(turn);

  //{{{  init
  
  this.lozza.stats.nodes++;
  
  var uci = this.lozza.uci;
  
  if (this.verbose) {
    this.tab =  '<table style="max-width: 400px;" class="table">';
    this.tab += '<tr><th>What</th><th>Mid</th><th>End</th><th>&nbsp;</th></tr>';
  }
  
  var evalS = this.runningEvalS;
  var evalE = this.runningEvalE;
  
  var phase = this.phase;
  
  if (phase < 0)            // because of say 3 queens early on.
    phase = 0;
  
  if (phase > TPHASE)
    phase = TPHASE;
  
  this.gPhase = Math.round((phase << 8) / TPHASE) | 0;
  
  if (this.verbose) {
    this.etrace('phase='+this.gPhase,'','','');
    this.etrace('running material',evalS,evalE,'');
  }
  
  var numPieces = this.wCount + this.bCount;
  
  var wNumBishops = this.wCounts[BISHOP];
  var wNumKnights = this.wCounts[KNIGHT];
  var wNumPawns   = this.wCounts[PAWN];
  
  var bNumBishops = this.bCounts[BISHOP];
  var bNumKnights = this.bCounts[KNIGHT];
  var bNumPawns   = this.bCounts[PAWN];
  
  var wKingSq   = this.wList[0];
  var wKingRank = RANK[wKingSq];
  var wKingFile = FILE[wKingSq];
  
  var bKingSq   = this.bList[0];
  var bKingRank = RANK[bKingSq];
  var bKingFile = FILE[bKingSq];
  
  //}}}
  //{{{  insufficient material?
  
  if (!this.verbose) {
  
    if (numPieces == 2)                                  // K v K.
      return CONTEMPT;
  
    if (numPieces == 3 && (wNumKnights || wNumBishops || bNumKnights || bNumBishops))    // K v K+N|B.
      return CONTEMPT;
  
    if (numPieces == 4 && (wNumKnights || wNumBishops) && (bNumKnights || bNumBishops))  // K+N|B v K+N|B.
      return CONTEMPT;
  }
  
  //}}}
  //{{{  pawns
  
  var pawnsS = 0;
  var pawnsE = 0;
  
  var idx = this.ploHash & this.pttMask;
  
  if (this.pttType[idx] == TT_EXACT && this.pttLo[idx] == this.ploHash && this.pttHi[idx] == this.phiHash) {
  
    pawnsS = this.pttScoreS[idx];
    pawnsE = this.pttScoreE[idx];
  }
  
  else {
  
    //{{{  phase 1
    
    this.wPawns[0] = 9;
    this.wPawns[1] = 9;
    this.wPawns[2] = 9;
    this.wPawns[3] = 9;
    this.wPawns[4] = 9;
    this.wPawns[5] = 9;
    this.wPawns[6] = 9;
    this.wPawns[7] = 9;
    this.wPawns[8] = 9;
    this.wPawns[9] = 9;
    
    var next  = this.firstWP;
    var count = 0;
    
    while (count < wNumPawns) {
    
      sq = this.wList[next];
    
      if (!sq || this.b[sq] != W_PAWN) {
        next++;
        continue;
      }
    
      var rank = RANK[sq];
      var file = FILE[sq];
    
      if (this.wPawns[file] != 9) {
        pawnsS -= WDOUBLED_PSTS[sq];
        pawnsE -= WDOUBLED_PSTE[sq];
        if (this.verbose) {
          this.etrace('white doubled',-WDOUBLED_PSTS[sq],-WDOUBLED_PSTE[sq],COORDS[sq]);
        }
      }
    
      if (rank < this.wPawns[file])
        this.wPawns[file] = rank;
    
      count++;
      next++
    }
    
    this.bPawns[0] = 0;
    this.bPawns[1] = 0;
    this.bPawns[2] = 0;
    this.bPawns[3] = 0;
    this.bPawns[4] = 0;
    this.bPawns[5] = 0;
    this.bPawns[6] = 0;
    this.bPawns[7] = 0;
    this.bPawns[8] = 0;
    this.bPawns[9] = 0;
    
    var next  = this.firstBP;
    var count = 0;
    
    while (count < bNumPawns) {
    
      sq = this.bList[next];
    
      if (!sq || this.b[sq] != B_PAWN) {
        next++;
        continue;
      }
    
      var rank = RANK[sq];
      var file = FILE[sq];
    
      if (this.bPawns[file] != 0) {
        pawnsS += BDOUBLED_PSTS[sq];
        pawnsE += BDOUBLED_PSTE[sq];
        if (this.verbose) {
          this.etrace('black doubled',BDOUBLED_PSTS[sq],BDOUBLED_PSTE[sq],COORDS[sq]);
        }
      }
    
      if (rank > this.bPawns[file])
        this.bPawns[file] = rank;
    
      count++;
      next++
    }
    
    //}}}
    //{{{  phase 2
    
    var next  = this.firstWP;
    var count = 0;
    
    while (count < wNumPawns) {
    
      sq = this.wList[next];
    
      if (!sq || this.b[sq] != W_PAWN) {
        next++;
        continue;
      }
    
      var rank = RANK[sq];
      var file = FILE[sq];
      var pass = 1;
    
      if (rank >= this.bPawns[file-1] && rank >= this.bPawns[file] && rank >= this.bPawns[file+1]) {
        pawnsS += WPASSED_PSTS[sq];
        pawnsE += WPASSED_PSTE[sq];
        pass   =  1;
        if (this.verbose) {
          this.etrace('white passed',WPASSED_PSTS[sq],WPASSED_PSTE[sq],COORDS[sq]);
        }
      }
    
      if (this.b[sq+11] == W_PAWN || this.b[sq+13] == W_PAWN ) {
        pawnsS += WCONNECT_PSTS[sq] * pass;
        pawnsE += WCONNECT_PSTE[sq] * pass;
        if (this.verbose) {
          this.etrace('white connect',WCONNECT_PSTS[sq],WCONNECT_PSTE[sq],COORDS[sq]);
        }
      }
      else if (this.wPawns[file-1] == 9 && this.wPawns[file+1] == 9) {
        pawnsS -= WISOLATE_PSTS[sq];
        pawnsE -= WISOLATE_PSTE[sq];
        if (this.verbose) {
          this.etrace('white isolate',-WISOLATE_PSTS[sq],-WISOLATE_PSTE[sq],COORDS[sq]);
        }
      }
    
      count++;
      next++
    }
    
    var next  = this.firstBP;
    var count = 0;
    
    while (count < bNumPawns) {
    
      sq = this.bList[next];
    
      if (!sq || this.b[sq] != B_PAWN) {
        next++;
        continue;
      }
    
      var rank = RANK[sq];
      var file = FILE[sq];
      var pass = 1;
    
      if (rank <= this.wPawns[file-1] && rank <= this.wPawns[file] && rank <= this.wPawns[file+1]) {
        pawnsS -= BPASSED_PSTS[sq];
        pawnsE -= BPASSED_PSTE[sq];
        pass   =  1;
        if (this.verbose) {
          this.etrace('black passed',-BPASSED_PSTS[sq],-BPASSED_PSTE[sq],COORDS[sq]);
        }
      }
    
      if (this.b[sq-11] == B_PAWN || this.b[sq-13] == B_PAWN ) {
        pawnsS -= BCONNECT_PSTS[sq] * pass;
        pawnsE -= BCONNECT_PSTE[sq] * pass;
        if (this.verbose) {
          this.etrace('black connect',-BCONNECT_PSTS[sq],-BCONNECT_PSTE[sq],COORDS[sq]);
        }
      }
      else if (this.bPawns[file-1] == 0 && this.bPawns[file+1] == 0) {
        pawnsS += BISOLATE_PSTS[sq];
        pawnsE += BISOLATE_PSTE[sq];
        if (this.verbose) {
          this.etrace('black isolate',BISOLATE_PSTS[sq],BISOLATE_PSTE[sq],COORDS[sq]);
        }
      }
    
      count++;
      next++
    }
    
    //}}}
  
    this.pttType[idx]   = TT_EXACT;
    this.pttLo[idx]     = this.ploHash;
    this.pttHi[idx]     = this.phiHash;
    this.pttScoreS[idx] = pawnsS;
    this.pttScoreE[idx] = pawnsE;
  }
  
  evalS += pawnsS;
  evalE += pawnsE;
  
  if (this.verbose) {
    this.etrace('total pawns',pawnsS,pawnsE,'');
  }
  
  //}}}
  //{{{  bishop pair
  
  if (wNumBishops >= 2) {
    evalS += 50;
    evalE += 50;
    if (this.verbose) {
      this.etrace('white bishop bonus',50,50,'');
    }
  }
  
  if (bNumBishops >= 2) {
    evalS -= 50;
    evalE -= 50;
    if (this.verbose) {
      this.etrace('black bishop bonus',-50,-50,'');
    }
  }
  
  //}}}
  //{{{  king safety
  
  var KSHIFT = 1;
  
  var safe = 32;
  
  if (this.b[wKingSq-12] == W_PAWN) {
    evalS += safe;
    safe = safe >>> KSHIFT;
    evalE += safe;
    if (this.verbose) {
      this.etrace('white king safety',safe<<KSHIFT,safe,COORDS[wKingSq-12]);
    }
  }
  
  if (this.b[wKingSq-13] == W_PAWN) {
    evalS += safe;
    safe = safe >>> KSHIFT;
    evalE += safe;
    if (this.verbose) {
      this.etrace('white king safety',safe<<KSHIFT,safe,COORDS[wKingSq-13]);
    }
  }
  
  if (this.b[wKingSq-11] == W_PAWN) {
    evalS += safe;
    safe = safe >>> KSHIFT;
    evalE += safe;
    if (this.verbose) {
      this.etrace('white king safety',safe<<KSHIFT,safe,COORDS[wKingSq-11]);
    }
  }
  
  var safe = 32;
  
  if (this.b[bKingSq+12] == B_PAWN) {
    evalS -= safe;
    safe = safe >>> KSHIFT;
    evalE -= safe;
    if (this.verbose) {
      this.etrace('black king safety',-(safe<<KSHIFT),-safe,COORDS[bKingSq+12]);
    }
  }
  
  if (this.b[bKingSq+11] == B_PAWN) {
    evalS -= safe;
    safe = safe >>> KSHIFT;
    evalE -= safe;
    if (this.verbose) {
      this.etrace('black king safety',-(safe<<KSHIFT),-safe,COORDS[bKingSq+11]);
    }
  }
  
  if (this.b[bKingSq+13] == B_PAWN) {
    evalS -= safe;
    safe = safe >>> KSHIFT;
    evalE -= safe;
    if (this.verbose) {
      this.etrace('black king safety',-(safe<<KSHIFT),-safe,COORDS[bKingSq+13]);
    }
  }
  
  //}}}
  //{{{  mobility
  
  this.mobility(WHITE);
  
  evalS += this.mobilityS;
  evalE += this.mobilityE;
  
  if (this.verbose) {
    this.etrace('white mobility',this.mobilityS,this.mobilityE,'');
  }
  
  this.mobility(BLACK);
  
  evalS -= this.mobilityS;
  evalE -= this.mobilityE;
  
  if (this.verbose) {
    this.etrace('black mobility',this.mobilityS,this.mobilityE,'');
  }
  
  //}}}

  var e = ((evalS * (256 - this.gPhase)) + (evalE * this.gPhase)) >> 8;

  if (this.verbose) {
    this.etrace('final eval',evalS,evalE,e);
    this.tab += '</table>';
    uci.send('info string ' + this.tab);
  }

  e *= ((-turn >> 31) | 1);

  return e;
}

//}}}
//{{{  .rand32

lozBoard.prototype.rand32 = function () {

  return Math.floor(Math.random() * 0xFFFFFFFF) + 1;

}

//}}}
//{{{  .ttPut

lozBoard.prototype.ttPut = function (type,depth,score,move,ply) {

  var idx = this.loHash & this.ttMask;

  this.hashUsed++;

  if (score <= -MINMATE && score >= -MATE)
    score -= ply;

  else if (score >= MINMATE && score <= MATE)
    score += ply;

  this.ttLo[idx]    = this.loHash;
  this.ttHi[idx]    = this.hiHash;
  this.ttType[idx]  = type;
  this.ttDepth[idx] = depth;
  this.ttScore[idx] = score;
  this.ttMove[idx]  = move;
}

//}}}
//{{{  .ttGet

lozBoard.prototype.ttGet = function (node, depth, alpha, beta) {

  var idx   = this.loHash & this.ttMask;
  var type  = this.ttType[idx];

  node.hashMove = 0;

  if (type == TT_EMPTY) {
    return TTSCORE_UNKNOWN;
  }

  var lo = this.ttLo[idx];
  var hi = this.ttHi[idx];

  if (lo != this.loHash || hi != this.hiHash) {
    return TTSCORE_UNKNOWN;
  }

  //
  // Set the hash move before the depth check
  // so that iterative deepening works.
  //

  node.hashMove = this.ttMove[idx];

  if (this.ttDepth[idx] < depth) {
    return TTSCORE_UNKNOWN;
  }

  var score = this.ttScore[idx];

  if (score <= -MINMATE && score >= -MATE)
    score += node.ply;

  else if (score >= MINMATE && score <= MATE)
    score -= node.ply;

  if (type == TT_EXACT) {
    return score;
   }

  if (type == TT_ALPHA && score <= alpha) {
    return score;
  }

  if (type == TT_BETA && score >= beta) {
    return score;
  }

  return TTSCORE_UNKNOWN;
}

//}}}
//{{{  .ttGetMove

lozBoard.prototype.ttGetMove = function (node) {

  var idx = this.loHash & this.ttMask;

  if (this.ttType[idx] != TT_EMPTY && this.ttLo[idx] == this.loHash && this.ttHi[idx] == this.hiHash)
    return this.ttMove[idx];

  return 0;
}

//}}}
//{{{  .ttInit

lozBoard.prototype.ttInit = function () {

  this.loHash = 0;
  this.hiHash = 0;

  this.ploHash = 0;
  this.phiHash = 0;

  for (var i=0; i < this.ttType.length; i++)
    this.ttType[i] = TT_EMPTY;

  for (var i=0; i < this.pttType.length; i++)
    this.pttType[i] = TT_EMPTY;

  this.hashUsed = 0;
}

//}}}
//{{{  .hashCheck

lozBoard.prototype.hashCheck = function (turn) {

  var loHash = 0;
  var hiHash = 0;

  var ploHash = 0;
  var phiHash = 0;

  if (turn) {
    loHash ^= this.loTurn;
    hiHash ^= this.hiTurn;
  }

  loHash ^= this.loRights[this.rights];
  hiHash ^= this.hiRights[this.rights];

  loHash ^= this.loEP[this.ep];
  hiHash ^= this.hiEP[this.ep];

  for (var sq=0; sq<144; sq++) {

    var obj = this.b[sq];

    if (obj == NULL || obj == EDGE)
      continue;

    var piece = obj & PIECE_MASK;
    var col   = obj & COLOR_MASK;

    loHash ^= this.loPieces[col>>>3][piece-1][sq];
    hiHash ^= this.hiPieces[col>>>3][piece-1][sq];

    if (piece == PAWN) {
      ploHash ^= this.loPieces[col>>>3][0][sq];
      phiHash ^= this.hiPieces[col>>>3][0][sq];
    }
  }

  if (this.loHash != loHash)
    lozza.uci.debug('*************** LO',this.loHash,loHash);

  if (this.hiHash != hiHash)
    lozza.uci.debug('*************** HI',this.hiHash,hiHash);

  if (this.ploHash != ploHash)
    lozza.uci.debug('************* PLO',this.ploHash,ploHash);

  if (this.phiHash != phiHash)
    lozza.uci.debug('************* PHI',this.phiHash,phiHash);
}

//}}}
//{{{  .fen

lozBoard.prototype.fen = function () {

  var fen = '';
  var n   = 0;

  for (i=0; i < 8; i++) {
    for (j=0; j < 8; j++) {
      var sq  = B88[i*8 + j]
      var obj = this.b[sq];
      if (obj == NULL)
        n++;
      else {
        if (n) {
          fen += '' + n;
          n = 0;
        }
        fen += UMAP[obj];
      }
    }
    if (n) {
      fen += '' + n;
      n = 0;
    }
    if (i < 7)
      fen += '/';
  }

  return fen;
}

//}}}
//{{{  .playMove

lozBoard.prototype.playMove = function (moveStr) {

  var move     = 0;
  var node     = lozza.rootNode;
  var nextTurn = ~this.turn & COLOR_MASK;

  node.cache();

  this.genMoves(node, this.turn);

  while (move = node.getNextMove()) {

    this.makeMove(node,move);

    var attacker = this.isKingAttacked(nextTurn);

    if (attacker) {

      this.unmakeMove(node,move);
      node.uncache();

      continue;
    }

    var fMove = this.formatMove(move,UCI_FMT);

    if (moveStr == fMove || moveStr+'q' == fMove) {
      this.turn = ~this.turn & COLOR_MASK;
      return true;
    }

    this.unmakeMove(node,move);
    node.uncache();
  }

  return false;
}

//}}}
//{{{  .getPVStr

lozBoard.prototype.getPVStr = function(node) {

  if (!node)
    return '';

  var move = this.ttGetMove(node);

  if (!move)
    return '';

  node.cache();
  this.makeMove(node,move);

  var mv = this.formatMove(move, SAN_FMT);
  var pv = ' ' + this.getPVStr(node.childNode);

  this.unmakeMove(node,move);
  node.uncache();

  if (pv.indexOf(' ' + mv + ' ') === -1)
    return mv + pv;
  else
    return mv;
}


//}}}
//{{{  .etrace

lozBoard.prototype.etrace = function(info1,mid,end,info2) {

  this.tab += '<tr><td>'+info1+'</td><td>'+mid+'</td><td>'+end+'</td><td>'+info2+'</td></tr>';
}


//}}}
//{{{  .addHistory

lozBoard.prototype.addHistory = function (depth, move) {

  //if (depth <=3)
    //return;

  var toObj = (move & MOVE_TOOBJ_MASK) >>> MOVE_FROBJ_BITS;

  if (toObj)
    return;

  var to      = (move & MOVE_TO_MASK)    >>> MOVE_TO_BITS;
  var frObj   = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  var frPiece = frObj & PIECE_MASK;

  if ((frObj & COLOR_MASK) == WHITE) {
    this.wHistory[frPiece][to] += depth*depth;
    if (this.wHistory[frPiece][to] > this.wHistory[0][0])
      this.wHistory[0][0] = this.wHistory[frPiece][to];
    if (this.wHistory[frPiece][to] > BASE_BADTAKES)
      board.lozza.uci.debug('W HIS OVERFLOW');
  }
  else {
    this.bHistory[frPiece][to] += depth*depth;
    if (this.bHistory[frPiece][to] > this.bHistory[0][0])
      this.bHistory[0][0] = this.bHistory[frPiece][to];
    if (this.bHistory[frPiece][to] > BASE_BADTAKES)
      board.lozza.uci.debug('B HIS OVERFLOW');
  }
}

//}}}
//{{{  .isEnd

var WD = {}

WD.tuning = {};

WD.tuning.winBlack      = 'b';
WD.tuning.winWhite      = 'w';
WD.tuning.drawStalemate = 'd';
WD.tuning.draw50        = 'd';
WD.tuning.drawRep       = 'd';

WD.playing = {};

WD.playing.winBlack      = 'win by black';
WD.playing.winWhite      = 'win by white';
WD.playing.drawStalemate = 'draw by stalemate';
WD.playing.draw50        = 'draw by 50 move rule';
WD.playing.drawRep       = 'draw by threefold repetition';

lozBoard.prototype.isEnd = function (turn) {

  var spec = this.lozza.uci.spec;
  var node = this.lozza.rootNode;

  if (this.lozza.uci.tuning)
    var strs = WD.tuning;
  else
    var strs = WD.playing;

  var wInCheck = this.isKingAttacked(BLACK);
  var bInCheck = this.isKingAttacked(WHITE);

  var move = 0;

  var wNumMoves = 0;
  var bNumMoves = 0;

  var wMoves = [];
  var bMoves = [];

  node.cache();

  //{{{  wNumMoves
  
  this.genMoves(node, WHITE);
  
  while (move = node.getNextMove()) {
  
    this.makeMove(node,move);
  
    if (this.isKingAttacked(BLACK)) {
      this.unmakeMove(node,move);
      node.uncache();
      continue;
    }
  
    wMoves.push(move);
    wNumMoves++;
  
    this.unmakeMove(node,move);
    node.uncache();
  }
  
  //}}}
  //{{{  bNumMoves
  
  this.genMoves(node, BLACK);
  
  while (move = node.getNextMove()) {
  
    this.makeMove(node,move);
  
    if (this.isKingAttacked(WHITE)) {
      this.unmakeMove(node,move);
      node.uncache();
      continue;
    }
  
    bMoves.push(move);
    bNumMoves++;
  
    this.unmakeMove(node,move);
    node.uncache();
  }
  
  //}}}

  //{{{  draw/win?
  
  var wd = '';
  
  if (wNumMoves == 0 && wInCheck && turn == WHITE)
    wd = strs.winBlack;
  else if (bNumMoves == 0 && bInCheck && turn == BLACK)
    wd = strs.winWhite;
  else if (wNumMoves == 0 && turn == WHITE)
    wd = strs.drawStalemate;
  else if (bNumMoves == 0 && turn == BLACK)
    wd = strs.drawStalemate;
  else if (this.repHi - this.repLo >= 100)
    wd = strs.draw50;
  
  for (var i=this.repHi-5; i >= this.repLo; i -= 2) {
    if (this.repLoHash[i] == this.loHash && this.repHiHash[i] == this.hiHash)
      wd = strs.drawRep;
  }
  
  //}}}

  return wd;
}

//}}}

//}}}
//{{{  lozNode class

//{{{  lozNode

function lozNode (parentNode) {

  this.ply        = 0;          //  distance from root.
  this.root       = false;      //  only true for the root node node[0].
  this.childNode  = null;       //  pointer to next node (towards leaf) in tree.
  this.parentNode = parentNode; //  pointer previous node (towards root) in tree.

  if (parentNode) {
    this.grandparentNode = parentNode.parentNode;
    parentNode.childNode = this;
  }
  else
    this.grandparentNode = null;

  this.moves = Array(MAX_MOVES);
  for (var i=0; i < this.moves.length; i++)
    this.moves[i] = [0,0];      // [0] = priority, [1] = move.

  this.killer1     = 0;
  this.killer2     = 0;
  this.mateKiller  = 0;
  this.numMoves    = 0;         //  number of pseudo-legal moves for this node.
  this.sortedIndex = 0;         //  index to next selection-sorted pseudo-legal move.
  this.hashMove    = 0;         //  loaded when we look up the tt.
  this.base        = 0;         //  move type base (e.g. good capture) - can be used for LMR.

  this.C_runningEvalS = 0;      // cached before move generation and restored after each unmakeMove.
  this.C_runningEvalE = 0;
  this.C_rights       = 0;
  this.C_ep           = 0;
  this.C_repLo        = 0;
  this.C_repHi        = 0;
  this.C_loHash       = 0;
  this.C_hiHash       = 0;
  this.C_ploHash      = 0;
  this.C_phiHash      = 0;

  this.toZ = 0;                 // move to square index (captures) to piece list - cached during make|unmakeMove.
  this.frZ = 0;                 // move from square index to piece list          - ditto.
  this.epZ = 0;                 // captured ep pawn index to piece list          - ditto.
}

//}}}
//{{{  .init
//
//  By storing the killers in the node, we are implicitly using depth from root, rather than
//  depth, which can jump around all over the place and is inappropriate to use for killers.
//

lozNode.prototype.init = function() {

  this.killer1      = 0;
  this.killer2      = 0;
  this.mateKiller   = 0;
  this.numMoves     = 0;
  this.sortedIndex  = 0;
  this.hashMove     = 0;
  this.base         = 0;

  this.toZ = 0;
  this.frZ = 0;
  this.epZ = 0;
}

//}}}
//{{{  .cache
//
// We cache the board before move generation (those elements not done in unmakeMove)
// and restore after each unmakeMove.
//

lozNode.prototype.cache = function() {

  var board = this.board;

  this.C_runningEvalS = board.runningEvalS;
  this.C_runningEvalE = board.runningEvalE
  this.C_rights       = board.rights;
  this.C_ep           = board.ep;
  this.C_repLo        = board.repLo;
  this.C_repHi        = board.repHi;
  this.C_loHash       = board.loHash;
  this.C_hiHash       = board.hiHash;
  this.C_ploHash      = board.ploHash;
  this.C_phiHash      = board.phiHash;
}

//}}}
//{{{  .uncache

lozNode.prototype.uncache = function() {

  var board = this.board;

  board.runningEvalS   = this.C_runningEvalS;
  board.runningEvalE   = this.C_runningEvalE;
  board.rights         = this.C_rights;
  board.ep             = this.C_ep;
  board.repLo          = this.C_repLo;
  board.repHi          = this.C_repHi;
  board.loHash         = this.C_loHash;
  board.hiHash         = this.C_hiHash;
  board.ploHash        = this.C_ploHash;
  board.phiHash        = this.C_phiHash;
}

//}}}
//{{{  .getNextMove

lozNode.prototype.getNextMove = function () {

  if (this.sortedIndex == this.numMoves)
    return 0;

  var maxV = -INFINITY;
  var maxI = 0;

  for (var i=this.sortedIndex; i < this.numMoves; i++) {
    if (this.moves[i][0] > maxV) {
      maxV = this.moves[i][0];
      maxI = i;
    }
  }

  var next = this.moves[this.sortedIndex];
  var maxi = this.moves[maxI];

  var tmpV = next[0];
  var tmpM = next[1];

  next[0] = maxi[0];
  next[1] = maxi[1];
  maxi[0] = tmpV;
  maxi[1] = tmpM;

  this.base = this.moves[this.sortedIndex][0];

  return this.moves[this.sortedIndex++][1];
}

//}}}
//{{{  .addMove
//
// Higher value => better move.
//
var BASE_HASH       =  100012000;
var BASE_PROMOTES   =  100011000;
var BASE_GOODTAKES  =  100010000;
var BASE_EVENTAKES  =  100009000;
var BASE_EPTAKES    =  100008000;
var BASE_MATEKILLER =  100007000;
var BASE_MYKILLERS  =  100006000;
var BASE_GPKILLERS  =  100005000;
var BASE_CASTLING   =  100004000;
var BASE_BADTAKES   =  100003000;
var BASE_HISSLIDE   =       2000;
var BASE_PSTSLIDE   =       1000;

var BASE_LMR        = BASE_BADTAKES;

lozNode.prototype.addMove = function (move) {

  var next = this.moves[this.numMoves++];
  next[1]  = move;

  if (move == this.hashMove) {
    next[0] = BASE_HASH;
    return;
  }

  if (move & MOVE_PROMOTE_MASK) {
    next[0] = BASE_PROMOTES + ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS); // QRBN.
    return;
  }

  if (move & MOVE_EPTAKE_MASK) {
    next[0] = BASE_EPTAKES;
    return;
  }

  if (move == this.mateKiller) {
    next[0] = BASE_MATEKILLER;
    return;
  }

  if (move == this.killer1) {
    next[0] = BASE_MYKILLERS + 1;
    return;
  }

  if (move == this.killer2) {
    next[0] = BASE_MYKILLERS;
    return;
  }

  if (this.grandparentNode && move == this.grandparentNode.killer1) {
    next[0] = BASE_GPKILLERS + 1;
    return;
  }

  if (this.grandparentNode && move == this.grandparentNode.killer2) {
    next[0] = BASE_GPKILLERS;
    return;
  }

  if (move & MOVE_CASTLE_MASK) {
    next[0] = BASE_CASTLING;
    return;
  }

  if (move & MOVE_TOOBJ_MASK) {

    var victim = RANK_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK];
    var attack = RANK_VECTOR[((move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS) & PIECE_MASK];

    if (victim > attack)
      next[0] = BASE_GOODTAKES + victim * 64 - attack;
    else if (victim == attack)
      next[0] = BASE_EVENTAKES + victim * 64 - attack;
    else
      next[0] = BASE_BADTAKES  + victim * 64 - attack;

    return;
  }

  else {
    var board = this.board;

    var to      = (move & MOVE_TO_MASK)    >>> MOVE_TO_BITS;
    var fr      = (move & MOVE_FR_MASK)    >>> MOVE_FR_BITS;
    var frObj   = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
    var frPiece = frObj & PIECE_MASK;
    var frCol   = frObj & COLOR_MASK;

    if (frCol == WHITE) {
      var pst = WM_PST[frPiece];
      var his = board.wHistory[frPiece][to];
    }
    else {
      var pst = BM_PST[frPiece];
      var his = board.bHistory[frPiece][to];
    }

    if (!his)
      next[0] = BASE_PSTSLIDE + pst[to] - pst[fr];
    else
      next[0] = BASE_HISSLIDE + his;
  }

  return;
}

//}}}
//{{{  .addQMove

lozNode.prototype.addQMove = function (move) {

  var next = this.moves[this.numMoves++];
  next[1]  = move;

  if (move & MOVE_PROMOTE_MASK) {
    next[0] = BASE_PROMOTES + ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS); // QRBN.
    return;
  }

  if (move & MOVE_EPTAKE_MASK) {
    next[0] = BASE_EPTAKES;
    return;
  }

  var victim = RANK_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK];
  var attack = RANK_VECTOR[((move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS) & PIECE_MASK];

  if (victim > attack)
    next[0] = BASE_GOODTAKES + victim * 64 - attack;

  else if (victim == attack)
    next[0] = BASE_EVENTAKES + victim * 64 - attack;

  else
    next[0] = BASE_BADTAKES  + victim * 64 - attack;

  return;
}

//}}}
//{{{  .addPromotion

lozNode.prototype.addPromotion = function (move) {

  this.addMove (move | (QUEEN-2)  << MOVE_PROMAS_BITS);
  this.addMove (move | (ROOK-2)   << MOVE_PROMAS_BITS);
  this.addMove (move | (BISHOP-2) << MOVE_PROMAS_BITS);
  this.addMove (move | (KNIGHT-2) << MOVE_PROMAS_BITS);
}

//}}}
//{{{  .addQPromotion

lozNode.prototype.addQPromotion = function (move) {

  this.addQMove (move | (QUEEN-2)  << MOVE_PROMAS_BITS);
  //this.addQMove (move | (ROOK-2)   << MOVE_PROMAS_BITS);
  //this.addQMove (move | (BISHOP-2) << MOVE_PROMAS_BITS);
  //this.addQMove (move | (KNIGHT-2) << MOVE_PROMAS_BITS);
}

//}}}
//{{{  .addKiller

lozNode.prototype.addKiller = function (score, move) {

  if (move == this.hashMove)
    return;

  if (move & (MOVE_EPTAKE_MASK | MOVE_PROMOTE_MASK))
    return;  // before killers in move ordering.

  if (move & MOVE_TOOBJ_MASK) {

    var victim = RANK_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK];
    var attack = RANK_VECTOR[((move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS) & PIECE_MASK];

    if (victim >= attack)
      return; // before killers in move ordering.
  }

  if (score >= MINMATE && score <= MATE) {
    this.mateKiller = move;
    if (this.killer1 == move)
      this.killer1 = 0;
    if (this.killer2 == move)
      this.killer2 = 0;
    return;
  }

  if (this.killer1 == move || this.killer2 == move) {
    return;
  }

  if (this.killer1 == 0) {
    this.killer1 = move;
    return;
  }

  if (this.killer2 == 0) {
    this.killer2 = move;
    return;
  }

  var tmp      = this.killer1;
  this.killer1 = move;
  this.killer2 = tmp;
}

//}}}

//}}}
//{{{  lozStats class

//{{{  lozStats

function lozStats () {
}

//}}}
//{{{  .init

lozStats.prototype.init = function () {

  this.startTime = Date.now();
  this.splitTime = 0;
  this.nodes     = 0;  // per analysis
  this.ply       = 0;  // current ID root ply
  this.splits    = 0;
  this.moveTime  = 0;
  this.maxNodes  = 0;
  this.timeOut   = 0;
  this.selDepth  = 0;
  this.bestMove  = 0;
}

//}}}
//{{{  .lazyUpdate

lozStats.prototype.lazyUpdate = function () {

  if (this.moveTime > 0 && ((Date.now() - this.startTime) > this.moveTime))
    this.timeOut = 1;

  if (this.maxNodes > 0 && this.nodes >= this.maxNodes)
    this.timeOut = 1;

  if (Date.now() - this.splitTime > 500) {
    this.splits++;
    this.update();
    this.splitTime = Date.now();
  }
}

//}}}
//{{{  .update

lozStats.prototype.update = function () {

  if (lozza.uci.tuning)
    return;

  var tim = Date.now() - this.startTime;
  var nps = Math.floor((this.nodes * 1000) / tim);

  lozza.uci.send('info nodes',this.nodes,'time',tim,'nps',nps);
}

//}}}
//{{{  .stop

lozStats.prototype.stop = function () {

  this.stopTime  = Date.now();
  this.time      = this.stopTime - this.startTime;
  this.timeSec   = Math.round(this.time / 100) / 10;
  this.nodesMega = Math.round(this.nodes / 100000) / 10;
}

//}}}

//}}}
//{{{  lozUCI class

//{{{  lozUCI

function lozUCI () {

  this.message   = '';
  this.tokens    = [];
  this.command   = '';
  this.spec      = {};
  this.debugging = false;
  this.tuning    = false;
  this.tune1     = 0;

  this.options = {};
}

//}}}
//{{{  .send

lozUCI.prototype.send = function () {

  var s = '';

  for (var i = 0; i < arguments.length; i++)
    s += arguments[i] + ' ';

  postMessage(s);
  //console.log(s);
}

//}}}
//{{{  .debug

lozUCI.prototype.debug = function () {

  if (!this.debugging)
    return;

  var s = '';

  for (var i = 0; i < arguments.length; i++)
    s += arguments[i] + ' ';

  s = s.trim();
  if (s)
    postMessage('info string debug ' + this.spec.id + ' ' + s);
  else
    postMessage('info string');
}

//}}}
//{{{  .getInt

lozUCI.prototype.getInt = function (key, def) {

  for (var i=0; i < this.tokens.length; i++)
    if (this.tokens[i] == key)
      if (i < this.tokens.length - 1)
        return parseInt(this.tokens[i+1]);

  return def;
}

//}}}
//{{{  .getStr

lozUCI.prototype.getStr = function (key, def) {

  for (var i=0; i < this.tokens.length; i++)
    if (this.tokens[i] == key)
      if (i < this.tokens.length - 1)
        return this.tokens[i+1];

  return def;
}

//}}}
//{{{  .getArr

lozUCI.prototype.getArr = function (key, to) {

  var lo = 0;
  var hi = 0;

  for (var i=0; i < this.tokens.length; i++) {
    if (this.tokens[i] == key) {
      lo = i + 1;  //assumes at least one item
      hi = lo;
      for (var j=lo; j < this.tokens.length; j++) {
        if (this.tokens[j] == to)
          break;
        hi = j;
      }
    }
  }

  return {lo:lo, hi:hi};
}

//}}}
//{{{  .onmessage

onmessage = function(e) {

  var uci = lozza.uci;

  uci.messageList = e.data.split('\n');

  for (var messageNum=0; messageNum < uci.messageList.length; messageNum++ ) {

    uci.message = uci.messageList[messageNum].replace(/(\r\n|\n|\r)/gm,"");
    uci.message = uci.message.trim();
    uci.message = uci.message.replace(/\s+/g,' ');

    uci.tokens  = uci.message.split(' ');
    uci.command = uci.tokens[0];

    switch (uci.command) {

    case 'position':
      //{{{  position
      
      uci.spec.board    = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      uci.spec.turn     = 'w';
      uci.spec.rights   = 'KQkq';
      uci.spec.ep       = '-';
      uci.spec.hmc      = 0;
      uci.spec.fmc      = 1;
      uci.spec.id       = '';
      uci.spec.validate = uci.getInt('validate',0);
      
      uci.spec.fen      = '';
      
      var arr = uci.getArr('fen','moves');
      
      if (arr.lo > 0) { // handle partial FENs
        if (arr.lo <= arr.hi) uci.spec.board  =          uci.tokens[arr.lo];  arr.lo++;
        if (arr.lo <= arr.hi) uci.spec.turn   =          uci.tokens[arr.lo];  arr.lo++;
        if (arr.lo <= arr.hi) uci.spec.rights =          uci.tokens[arr.lo];  arr.lo++;
        if (arr.lo <= arr.hi) uci.spec.ep     =          uci.tokens[arr.lo];  arr.lo++;
        if (arr.lo <= arr.hi) uci.spec.hmc    = parseInt(uci.tokens[arr.lo]); arr.lo++;
        if (arr.lo <= arr.hi) uci.spec.fmc    = parseInt(uci.tokens[arr.lo]); arr.lo++;
      }
      
      uci.spec.moves = [];
      
      var arr = uci.getArr('moves','fen');
      
      if (arr.lo > 0) {
        for (var i=arr.lo; i <= arr.hi; i++)
          uci.spec.moves.push(uci.tokens[i]);
      }
      
      var valid = lozza.position();
      
      if (uci.spec.validate)
        uci.send('valid', valid, 'txfen', uci.spec.fen);
      
      break;
      
      //}}}

    case 'go':
      //{{{  go
      
      uci.spec.depth     = uci.getInt('depth',0);
      uci.spec.moveTime  = uci.getInt('movetime',0);
      uci.spec.maxNodes  = uci.getInt('nodes',0);
      uci.spec.wTime     = uci.getInt('wtime',0);
      uci.spec.bTime     = uci.getInt('btime',0);
      uci.spec.wInc      = uci.getInt('winc',0);
      uci.spec.bInc      = uci.getInt('binc',0);
      uci.spec.movesToGo = uci.getInt('movestogo',0);
      uci.spec.txfen     = uci.getInt('txfen',0);
      
      lozza.go();
      
      break;
      
      //}}}

    case 'ucinewgame':
      //{{{  ucinewgame
      
      lozza.newGameInit();
      
      break;
      
      //}}}

    case 'quit':
      //{{{  quit
      
      close(); //kill worker
      
      break;
      
      //}}}

    case 'debug':
      //{{{  debug
      
      if (uci.getStr('debug','off') == 'on')
        uci.debugging = true;
      else
        uci.debugging = false;
      
      break;
      
      //}}}

    case 'tuning':
      //{{{  tuning
      
      if (uci.getInt('tuning',0)) {
        uci.tuning = true;
        uci.tune1  = uci.getInt('tune1',0)
      }
      
      else
        uci.tuning = false;
      
      
      break;
      
      //}}}

    case 'uci':
      //{{{  uci
      
      uci.send('id name Lozza');
      uci.send('id author Colin Jenkins');
      uci.send('option');
      uci.send('uciok');
      
      break;
      
      //}}}

    case 'isready':
      //{{{  isready
      
      uci.send('readyok');
      
      break;
      
      //}}}

    case 'setoption':
      //{{{  setoption
      
      var key = uci.getStr('name');
      var val = uci.getStr('value');
      
      uci.options[key] = val;
      
      break;
      
      //}}}

    case 'ping':
      //{{{  ping
      
      uci.send('info string Lozza version',MAJOR+'.'+MINOR,'build',BUILD,'is alive');
      
      break;
      
      //}}}

    case 'id':
      //{{{  id
      
      uci.spec.id = uci.tokens[1];
      
      break;
      
      //}}}

    case 'perft':
      //{{{  perft
      
      uci.spec.depth = uci.getInt('depth',0);
      uci.spec.moves = uci.getInt('moves',0);
      uci.spec.inner = uci.getInt('inner',0);
      
      lozza.perft();
      
      break;
      
      //}}}

    case 'eval':
      //{{{  eval
      
      lozza.board.verbose = true;
      lozza.board.evaluate(lozza.board.turn);
      lozza.board.verbose = false;
      
      break;
      
      //}}}

    case 'board':
      //{{{  board
      
      uci.send('board',uci.spec.board);
      
      break;
      
      //}}}

    default:
      //{{{  ?
      
      uci.send('info string',uci.command,'?');
      
      break;
      
      //}}}
    }
  }
}

//}}}

//}}}

var lozza         = new lozChess()
lozza.board.lozza = lozza;


angular.module('chess.filters',[]);
angular.module('chess.filters')
.filter('range', function(){
	return function(input, range, reverse){

		var res= [];

		for (var i= 0; i< range; i++){
			var toAdd= (!reverse? i: range - 1 - i);
			res.push(toAdd);
		}

		return res;
	};
})
.filter('reverse', function(){
	return function(input, incrementBy){

		var res=[];

		for(var i= 0; i< input.length; i++){
			res.push(input[input.length - i - 1]);
		}

		return res;
	};
})
.filter('increment', function(){
	return function(input, incrementBy){

		var res=[];

		for(var i= 0; i< input.length; i++){
			res.push(input[i] + incrementBy);
		}

		return res;
	};
})
.filter('asLetter', function(){
	return function(input){

		var res= [];

		var val;
		for (var i= 0; i< input.length; i++){
			val= input[i] + 3;
    		res.push(String.fromCharCode(94 + val));
		}

		return res;
	};
});



angular.module('chess.services', []);
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
angular.module('chess.services')
.factory('chessDragDropMove', ['chessPieceService', 'chessConstants',
	 function(chessPieceService, constants){

	var DragAndDropMove= function(){

		this.activate= function($element, squareCtrl, boardCtrl){

			//ABOUT DRAG AND DROP
			$element.on('dragover', function(e){

			  if (e.preventDefault) {
			    e.preventDefault(); // Necessary. Allows us to drop.
			  }

			});
			//Change the style when dragging on top of a square

			$element.on('dragenter', function(e){
			  this.classList.add('overSquare');
			  // e.stopPropagation();
			});

			//Remove the style when leaving the square
			$element.on('dragleave', function(e) {
			  this.classList.remove('overSquare');
			  e.stopPropagation();
			});

			$element.on('dragstart', function(e){
				var squareScope= squareCtrl.getScope(),
					data='in ' + squareScope.content.piece.x + ' ' + squareScope.content.piece.y,
					img= squareScope.getImage()[0],
					offsetx= img.width/2,
					offsetY= img.height/2;

				e.dataTransfer.setData('piece', data);
				e.dataTransfer.setDragImage(img, offsetx, offsetY);
				squareScope.$apply(function(){
					boardCtrl.displayAccessibleMoves(squareScope.content.piece);
				});
			});

			//Update the chessboard when the piece is dropped
			$element.on('drop', function(e){
				if (e.preventDefault){e.preventDefault();}
				if (e.stopPropagation){e.stopPropagation();}

				this.classList.remove('overSquare');
				var prevPos= e.dataTransfer.getData('piece');

				if (prevPos !== undefined){
					var splited= prevPos.split(' '),
						mode= splited[0],
						control= boardCtrl.getControl(),
						squareScope= squareCtrl.getScope();
					
					//The piece comes from the board
					if (mode === 'in'){
						var prevX= parseInt(splited[1]),
							prevY= parseInt(splited[2]);
						// And the user can only move its pieces
						boardCtrl.tryMove(prevX, prevY, squareScope.content.x, squareScope.content.y);
					}else if (mode === 'out' && control === constants.control.edit){
						var type= splited[1],
							color= splited[2];
							piece= chessPieceService.new(type, color,  squareScope.content.x, squareScope.content.y);
						boardCtrl.addPiece(piece);
					}
				}
			});			

		};


		this.deactivate= function($element, squareCtrl, boardCtrl){

			$element.off('dragover');
			$element.off('dragenter');
			$element.off('dragleave');
			$element.off('dragstart');
			$element.off('drop');
		};

	};


	return new DragAndDropMove();

}])
angular.module('chess.services')
.factory('chessEngineService', [function(){

	var ChessEngineService= function(){

		var gameStarted= false;

		var worker= new Worker('/ext/lozza.js');

		//answers
		worker.onmessage= function(message){

			var answer= message.data.trim().replace(/\s+/g,' ');
			var splitedAnswer= answer.split(' ');




		}

		//treatments
		this.play= function(piece, toX, toY){

			
			
		}




	}

	return new ChessEngineService();
}]);
angular.module('chess.services')
.factory('chessMoveService', ['chessPositionService', function(chessPositionService){


	var generateLeft= function(x, y){
		var res= [];
		for (var xx= x-1; xx>=0; xx--){
			res.push([xx, y]);
		}
		return res;
	};

	var generateRight= function(x, y){
		var res= [];
		for (var xx= x+1; xx<=7; xx++){
			res.push([xx, y]);
		}
		return res;
	};

	var generateBottom= function(x, y){
		var res= [];
		for (var yy= y-1; yy>=0; yy--){
			res.push([x, yy]);
		}	
		return res;	
	};

	var generateTop= function(x, y){
		var res= [];
		for (var yy= y+1; yy<=7; yy++){
			res.push([x, yy]);
		}	
		return res;	
	};

	var generateTopLeft= function(x, y){
		var res= [];
		var indice= 0;
		for(var xx= x-1; xx>=0; xx--){
			indice++;
			if (y+indice > 7){
				break;
			}
			res.push([xx, y+indice]);
		}
		return res;
	};

	var generateBottomLeft= function(x, y){
		var res= [];
		var indice= 0;
		for(var xx= x-1; xx>=0; xx--){
			indice++;
			if (y-indice < 0){
				break;
			}
			res.push([xx, y-indice]);
		}
		return res;
	};

	var generateBottomRight= function(x, y){
		var res= [];
		var indice= 0;
		for(var xx= x+1; xx<=7; xx++){
			indice++;
			if (y-indice < 0){
				break;
			}
			res.push([xx, y-indice]);
		}
		return res;
	};

	var generateTopRight= function(x, y){
		var res= [];
		var indice= 0;
		for(var xx= x+1; xx<=7; xx++){
			indice++;
			if (y+indice > 7){
				break;
			}
			res.push([xx, y+indice]);
		}
		return res;
	};	

	var generateKnight= function(x,y){

		var res= [];

		var deps= [[1,2], [1,-2], [2,1], [2,-1], [-1,2], [-1,-2],[-2,1], [-2, -1]],
			dep;

		for (var i in deps){
			dep= deps[i];
			if  ( (x + dep[0] >=0 ) && (x + dep[0] <=7 ) && (y + dep[1] >=0 ) && (y + dep[1] <=7)){
				res.push([x+dep[0], y+dep[1]]);
			};

		}
		return res;
	};

	//Is the square (defined by the position of the piece) is
	// accessible by colorType
	var isSquareAccessible= function(x, y, colorType, position){
			if (!(x >= 0 && x<8 && y >= 0 && y<8 )){
				return false;
			}
			var piece= chessPositionService.getPiece(x, y, position);
			return !piece || ( (piece.colorType !== colorType) && (piece.type !== 'KING') ) 
	};

	var kingMoves= function(colorType, coords, position){
		var res= [];
		var deps= [[-1, -1], [-1, 0], [-1, 1], [0,1], [1, 1], [1, 0], [1, -1], [0, -1]];
		for (var i in deps){
			var dep= deps[i];
				x= coords.x + dep[0], 
				y= coords.y + dep[1];

			if (isSquareAccessible(x, y, colorType, position)){
				res.push({x:x, y:y});
			}
		}

		return res;
	};

	var queenMoves= function(colorType, coords, position){
		var res= [];

		var movesByDir= [
				generateLeft(coords.x, coords.y),
				generateRight(coords.x, coords.y),
				generateTop(coords.x, coords.y),
				generateBottom(coords.x, coords.y),
				generateTopLeft(coords.x, coords.y),
				generateTopRight(coords.x, coords.y),
				generateBottomLeft(coords.x, coords.y),
				generateBottomRight(coords.x, coords.y)
			];

		for (var i in movesByDir){
			var dirMoves= movesByDir[i];
			for (var j in dirMoves){
				var currentMove= dirMoves[j],
					nextCoords= {x: currentMove[0], y: currentMove[1]};
				if (isSquareAccessible(nextCoords.x, nextCoords.y, colorType, position)){
					res.push(nextCoords);
					//TODO: modifier la valeur de retour de isSquareAccessible pour
					// gerer les cas directement
					var piece= chessPositionService.getPiece(nextCoords.x, nextCoords.y, position);
					if (piece !== undefined){
						break;
					}					
				}else{
					break;
				}
			}
		}

		return res;
	};

	var rookMoves= function(colorType, coords, position){
		var res= [];

		var movesByDir= [
				generateLeft(coords.x, coords.y),
				generateRight(coords.x, coords.y),
				generateTop(coords.x, coords.y),
				generateBottom(coords.x, coords.y)
			];

		for (var i in movesByDir){
			var dirMoves= movesByDir[i];
			for (var j in dirMoves){
				var currentMove= dirMoves[j],
					nextCoords= {x: currentMove[0], y: currentMove[1]};
				if (isSquareAccessible(nextCoords.x, nextCoords.y, colorType, position)){
					res.push(nextCoords);
					//TODO: modifier la valeur de retour de isSquareAccessible pour
					// gerer les cas directement
					var piece= chessPositionService.getPiece(nextCoords.x, nextCoords.y, position);
					if (piece !== undefined){
						break;
					}					
				}else{
					break;
				}
			}
		}

		return res;
	};

	var bishopMoves= function(colorType, coords, position){
		var res= [];

		var movesByDir= [
				generateTopLeft(coords.x, coords.y),
				generateBottomLeft(coords.x, coords.y),
				generateTopRight(coords.x, coords.y),
				generateBottomRight(coords.x, coords.y)
			];

		for (var i in movesByDir){
			var dirMoves= movesByDir[i];
			for (var j in dirMoves){
				var currentMove= dirMoves[j],
					nextCoords= {x: currentMove[0], y: currentMove[1]};
				if (isSquareAccessible(nextCoords.x, nextCoords.y, colorType, position)){
					res.push(nextCoords);
					//TODO: modifier la valeur de retour de isSquareAccessible pour
					// gerer les cas directement
					var piece= chessPositionService.getPiece(nextCoords.x, nextCoords.y, position);
					if (piece !== undefined){
						break;
					}
				}else{
					break;
				}
			}
		}

		return res;
	};

	//TODO: A commpleter, petit roque
	var knightMoves= function(colorType, coords, position){
		var res= [];
		var nextCoords= generateKnight(coords.x, coords.y);
		for (var i in nextCoords){
			var currentMove= nextCoords[i],
				x= currentMove[0], 
				y= currentMove[1];
			if (isSquareAccessible(x, y, colorType, position)){
				res.push({x:x, y:y});
			}
		}

		return res;
	};

	//TODO: A commpleter: prise en passant, etc..
	var pawnMoves= function(colorType, coords, position){
		var res= [];
		// First or last line
		if (
				(coords.y === 0 && colorType === 'BLACK') ||
				(coords.y === 7 && colorType === 'WHITE')
			){
			return res;
		}else{
			//just in front
			var newY= (colorType === 'WHITE'? coords.y + 1:coords.y - 1);
			var piece= chessPositionService.getPiece(coords.x, newY, position);
			if (!piece){
				res.push({x: coords.x, y: newY});
			}
			//Jump 2 cases?
			if ( !piece &&
					(
						(coords.y === 1 && colorType === 'WHITE') ||
						(coords.y === 6 && colorType === 'BLACK')
					)
			){
				newY= (colorType === 'WHITE'? coords.y +2: coords.y -2);
				piece= chessPositionService.getPiece(coords.x, newY, position);
				if (!piece){
					res.push({x:coords.x, y: newY});
				}
			}
			//Can take a piece?
			var leftCoord, rightCoord,
				leftPiece, rightPiece;
			if (coords.x>0){
				leftCoord= {x: coords.x-1, y: (colorType === 'WHITE'? coords.y+1: coords.y-1)};
			}
			if (coords.x<7){
				rightCoord= {x: coords.x+1, y: (colorType === 'WHITE'? coords.y+1: coords.y-1)};
			}
			if (leftCoord){
				leftPiece= chessPositionService.getPiece(leftCoord.x, leftCoord.y, position);
				if (leftPiece && leftPiece.colorType !== colorType){
					res.push(leftCoord);
				}
			}
			if (rightCoord){
				rightPiece= chessPositionService.getPiece(rightCoord.x, rightCoord.y, position);
				if (rightPiece && rightPiece.colorType !== colorType){
					res.push(rightCoord);
				}
			}
			//TODO: prise en passant
		}

		return res;
	};


	var getPotentialMoves= function(pieceType, colorType, coords, position){

		var res= [];

		switch(pieceType){
			case 'KING': 
				return kingMoves(colorType, coords, position);
			break;
			case 'QUEEN':
				return queenMoves(colorType, coords, position);
			break;
			case 'ROOK': 
				return rookMoves(colorType, coords, position);
			break;
			case 'BISHOP': 
				return bishopMoves(colorType, coords, position);
			break;
			case 'KNIGHT': 
				return knightMoves(colorType, coords, position);
			break;
			case 'PAWN': 
				return pawnMoves(colorType, coords, position);
			break;
		};

	};

	var isChess= function(position, colorType){
		var theKing= chessPositionService.getKing(colorType, position);
		var pieceTypes= ['PAWN', 'ROOK', 'BISHOP', 'KNIGHT', 'QUEEN'];
		for (var i in pieceTypes){
			var pieceType= pieceTypes[i];
			var moves= getPotentialMoves(pieceType, colorType, {x:theKing.x, y:theKing.y}, position);
			for (var i in moves){
				var move= moves[i];
				var inFrontPiece= chessPositionService.getPiece(move.x, move.y, position);
				if (inFrontPiece && inFrontPiece.colorType !== colorType && inFrontPiece.type === pieceType){
					return true;
				}
			}
		}
	};


	var getMoves= function(piece){

		var res=[];

		var moves= getPotentialMoves(piece.type, piece.colorType, {x:piece.x, y:piece.y}, chessPositionService.getPosition());
		if (moves && moves.length > 0){
			//temporarily remove the given piece
			var position= chessPositionService.clonePosition();
			chessPositionService.dropPiece(piece, position);
			//Check if thhe user is chess without this piece
			var canBeChess= undefined;
			if (piece.type !== 'KING'){
				canBeChess= isChess(position, piece.colorType);
			}
			chessPositionService.unclonePosition(position);
			var checkPossibleChess= canBeChess || piece.type === 'KING',
				clonedPiece;

			for (var i in moves){
				var move= moves[i];
				//If a chess is possible, we have to check that this move doesn't imply a chess
				if (checkPossibleChess){
					position= chessPositionService.clonePosition();
					clonedPiece= chessPositionService.getPiece(piece.x, piece.y, position);
					chessPositionService.movePiece(clonedPiece, move.x, move.y, position);
					if (!isChess(position, clonedPiece.colorType)){
						res.push(move);
					}
					chessPositionService.unclonePosition(position);
				}else{
					res.push(move);
				}
			}
		}

		return res;
	}

	var ChessMovesService= function(){
		this.getMoves= getMoves;

	};

	return new ChessMovesService();
}]);
angular.module('chess.services')
.factory('chessPieceService', function(){
	var ChessPieceService= function(){

		var that= this;

		this.types= {
			'KING':'king',
			'QUEEN':'queen',
			'ROOK': 'rook',
			'BISHOP': 'bishop',
			'KNIGHT': 'knight',
			'PAWN': 'pawn'
		};

		this.colors= {
			WHITE:'white',
			BLACK:'black'
		};

		var getType= function(typeValue){
			for (var key in that.types){
				if (that.types[key] === typeValue){
					return key;
				}
			}
		};

		var getColor= function(colorValue){
			for (var key in that.colors){
				if (that.colors[key] === colorValue){
					return key;
				}
			}
		};

		var Piece= function(name, color, x, y){
			this.type=getType(name);
			this.colorType= getColor(color);
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
			//TODO, revoir les constructeur: type -> valeur -> type...
			return new Piece(that.types[name], that.colors[color], x, y);
		};

		this.clone= function(piece){
			return that.new(piece.type, piece.colorType, piece.x, piece.y);
		}

		this.fromData= function(pieceData){
			return new Piece(pieceData.name, pieceData.color, pieceData.x, pieceData.color);
		}

		this.setPosition= function(piece, x, y){
			if (x < 0 || x > 7 || y < 0 || y > 7){
				throw "Position unauthorized : (" + x +',' + y + ')'; 
			}

			piece.x= x;
			piece.y= y;
		};

	};

	return new ChessPieceService();
});
angular.module('chess.services')
.provider('chessPositionService', function(){


	var position=[], 
		isInitialized= false,
		whiteKing, blackKing,
		clonnedStates= [];



	//Make the service configurable by setting
	//a custom position
	this.setPosition= function(initiaPosition){
		position= initiaPosition;
		isInitialized= true;
	};


	this.$get=['chessPieceService', function(PieceService){

		var initPosition= function(){
			if (!isInitialized){
				var x, i, set;

				//Default to undefined
				for(i= 0; i< 64; i++){
					position.push(undefined);
				}

				//PAWNS
				for (x= 0; x< 8; x++){
					addPiece( PieceService.new('PAWN', 'WHITE', x, 1));
					addPiece( PieceService.new('PAWN', 'BLACK', x, 6));
				}
				//ROOKS
				for(i= 0, set=[0, 7]; i < set.length; i++){
					addPiece( PieceService.new('ROOK', 'WHITE', set[i], 0));
					addPiece( PieceService.new('ROOK', 'BLACK', set[i], 7));
				}
				//BISHOPS
				for(i= 0, set=[2, 5];  i < set.length; i++){
					addPiece( PieceService.new('BISHOP', 'WHITE', set[i], 0));
					addPiece( PieceService.new('BISHOP', 'BLACK', set[i], 7));
				}

				//KNIGHTS
				for(i= 0, set=[1, 6];  i < set.length; i++){
					addPiece( PieceService.new('KNIGHT', 'WHITE', set[i], 0));
					addPiece( PieceService.new('KNIGHT', 'BLACK', set[i], 7));
				}

				//QUEENS
				addPiece( PieceService.new('QUEEN', 'WHITE', 3, 0));
				addPiece( PieceService.new('QUEEN', 'BLACK', 3, 7));

				//KING
				whiteKing= PieceService.new('KING', 'WHITE', 4, 0);
				blackKing= PieceService.new('KING', 'BLACK', 4, 7);
				addPiece(whiteKing);
				addPiece(blackKing);
			}
		};

		var addPiece= function(piece, extPos){

			var posToUse= extPos? extPos: position;

			var x= piece.x,
				y= piece.y;
				indice= y*8+x;

			posToUse[indice]= piece;
		};

		var dropPosition= function(x, y, extPos){
			var posToUse= extPos? extPos: position;

			posToUse[y*8+x]= undefined;
		};		

		var dropPiece= function(piece, extPos){
			dropPosition(piece.x, piece.y, extPos);
		};

		var getLastMove= function(){
			return this.lastMove;
		};

		var moveAccepted= false;
		var isMoveAccepted= function(){
			return moveAccepted;
		};

		var checkMove= function(piece, x, y, accessibleMoves){

			var applyMove= function(){
				this.lastMove= {
					from: {x: piece.x, y: piece.y},
					to:{x: x, y: y}
				};

				moveAccepted= true;					
			};

			moveAccepted= false;
			if (accessibleMoves !== undefined){
				var currentMove;
				for (var i in accessibleMoves){
					currentMove= accessibleMoves[i];
					if (currentMove.x === x && currentMove.y === y){
						applyMove.apply(this);
						break;
					}
				}
			}
			else{
				applyMove.apply(this);
			}

		};

		var movePiece= function(piece, x, y, extPos){
			var posToUse= extPos? extPos: position,
				startX= piece.x,
				startY= piece.y;
				sourceInd= startY*8+startX;

			posToUse[sourceInd]= undefined;
			PieceService.setPosition(piece, x, y);
			addPiece(piece, posToUse);
			moveAccepted= false;
		};

		var getPosition= function(){
			return position
		};

		var getPiece= function(x,y, extPos){
			posToUse= extPos? extPos: position;
			return posToUse[y*8+x];
		};

		//TODO: Utliser extPos
		//TODO: utiliser une structure {position: position, whiteKing: whiteKing ...}
		//TODO: Rajouter une methode pour supprimer cette strucutre
		//TODO: utiliser cette structure aussi pour la position standard
		var getKing= function(colorType, extPos){
			var useWhiteKing, useBlackKing;
			if (extPos){
				for (var i in clonnedStates){
					var clonedState= clonnedStates[i];
					if (clonedState.position === extPos){
						useWhiteKing= clonedState.whiteKing;
						useBlackKing= clonedState.blackKing;
					}
				}
			}else{
				useWhiteKing= whiteKing;
				useWhiteKing= blackKing;
			}

			if (colorType === 'WHITE'){
				return useWhiteKing;
			}else{
				return useBlackKing;
			}
		}

		var setNewPosition= function(newPosition){
			position= newPosition;
		}

		var clearPosition= function(){
			for (var i in position){
				position[i]= undefined;
			}
		}

		var clonePosition= function(){
			var newPos= [],
				piece,
				newBlackKing,
				newWhiteKing;

			for (var i in position){
				piece= position[i];
				if (piece){
					piece= PieceService.clone(piece);

					if (piece.type === 'KING'){
						if (piece.colorType === 'WHITE'){
							newWhiteKing= piece;
						}
						else{
							newBlackKing= piece;
						}
					}
				}
				newPos.push(piece);
			}

			clonnedStates.push({
				whiteKing: newWhiteKing,
				blackKing: newBlackKing,
				position: newPos
			});

			return newPos;
		}

		var unclonePosition= function(position){
			for (var i in clonnedStates){
				var clonedState= clonnedStates[i];
				if (clonedState.position === position){
					clonnedStates.splice(i, 1);
					break;
				}
			}
		};

		//The service definition methods
		var ChessPositionService= function(){

			initPosition();
			this.addPiece= addPiece;
			this.dropPosition= dropPosition;
			this.dropPiece= dropPiece;
			this.getLastMove= getLastMove;
			this.isMoveAccepted= isMoveAccepted;
			this.checkMove= checkMove;
			this.movePiece= movePiece;
			this.getPosition= getPosition;
			this.getPiece= getPiece;
			this.getKing= getKing;
			this.setNewPosition= setNewPosition;
			this.clearPosition= clearPosition;
			this.clonePosition= clonePosition;
			this.unclonePosition= unclonePosition;
		};

		return new ChessPositionService();
	}];

});