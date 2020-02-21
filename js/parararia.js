import Glo        from './rume-4-glo/Glo.js';
import Mesho      from './rume-4-glo/Mesho.js';
import Shadero    from './rume-4-glo/Shadero.js';
import Utilo      from './rume-4-glo/Utilo.js';

const DEFAULT_SMOOTH_DISTANCE  = 2;
const DEFAULT_EDGE_DISTANCE    = 2;
const DEFAULT_HUNT_CHUNK_SIZE  = {x:4,y:2};  //{x:8,y:4};
const DEFAULT_HUNT_SEARCH_AREA = {x:8,y:4}; //{x:16,y:8};

const TOTALLY = 3 * 257 * 257;

const Parararia = function() {
	const self = this;

	self.init = function() {
		self.log( 'setup' );
		'canvas img pre'.split( ' ' ).map( (tag) => { self[ tag ] = theD.first( tag ) }) 

		self.context = self.canvas.getContext( '2d' );
		self.context.fillText( 'loading...', 33, 33 );

		//return self.ezTest();
		self.imageTest();
	};

	self.ezTest = function() {
		self.div = theD.first( 'div' );

		let n = 16;
		let ww = [
			  {c:'black',s:'.',x: 4,y:3, x2: 6}
			, {c:'black',s:'.',x: 4,y:14,x2: 4} 
		];

		n = 32;
		ww = [
			  {c:'black',s:'X',x: 4,y:8, x2: 6}
			, {c:'black',s:'#',x: 16,y:24,x2: 16} 
		];

		n = 64;
		ww = [];
		for ( let y = 12 ; y < n ; y+= 12 ) {
			let m = n / 2;
			let o = y * 0.11 - 0;
			let x  = m - o;
			let x2 = m + o;
			ww.push( {c:'black',s:'X',x:x,x2:x2, y:y} );
		}

		self.canvas.width = self.canvas.height = n;

		self.clear();
		for ( let i = 0 ; i < ww.length ; i++ ) {
			let w = ww[ i ];
			self.fillText( w.c, w.s, w.x, w.y )
		}

		let left = self.context.getImageData( 0, 0, n, n );
		let ugL = self.context.getImageData( 0, 0, n, n ); // ???

		self.clear();
		for ( let i = 0 ; i < ww.length ; i++ ) {
			let w = ww[ i ];
			self.fillText( w.c, w.s, w.x2, w.y )
		}
		let right = self.context.getImageData( 0, 0, n, n );
		let ugR = self.context.getImageData( 0, 0, n, n ); // ???

		let smoothDistance = 1;
		let edgeDistance   = 1;
		let precision      = 1;

		let size = {x:3,y:2};
		let area = {x:9,y:4};

		let matches = self.leftAndRight( left, right, smoothDistance, edgeDistance, size, area, precision );

		for ( let i = 0 ; i < matches.length ; i++ ){
			let match = matches[ i ];
			console.log( JSON.stringify( match ) );
		}

		for ( let i = 0 ; i < ww.length ; i++ ) {
			break;
			let w = ww[ i ];
			self.fillText( w.c, w.s, w.x, w.y )
		}
		self.showMatches( ugL, ugR, matches, smoothDistance, edgeDistance, size, area, precision );

		self.log( '%', self.eoeo );
	};

	self.imageTest = function() {
		self.showMatches( self.img, false, self.dualImage( self.img ) );
	};

	self.dualImage = function( image ) {
		let w = Math.floor( image.width / 2 );
		let h = image.height;

		self.canvas.width = w;
		self.canvas.height = h;

		self.context.drawImage( image, 0,0,w,h, 0,0,w,h );
		let imageDataLeft = self.context.getImageData( 0, 0, w, h );

		self.context.drawImage( image, w,0,w,h, 0,0,w,h );
		let imageDataRight = self.context.getImageData( 0, 0, w, h );

		return this.leftAndRight( imageDataLeft, imageDataRight );
	};

	self.leftAndRight = function( imageDataLeft, imageDataRight, smoothDistance, edgeDistance, size, area, precision ) {
		smoothDistance = theD.ur( smoothDistance , DEFAULT_SMOOTH_DISTANCE );
		edgeDistance   = theD.ur( edgeDistance   , DEFAULT_EDGE_DISTANCE );
		size  = theD.ur( size  , DEFAULT_HUNT_CHUNK_SIZE );
		area = theD.ur( area , DEFAULT_HUNT_SEARCH_AREA );
		precision = theD.ur( precision, 1 );

		if ( self.div ) self.div.innerHTML = '';

		let w = imageDataLeft.width;
		let h = imageDataRight.width;
		if ( w !== imageDataRight.width || h !== imageDataRight.width ) {
			throw 'images need to be of the same size';
		}

		let edges = [];
		let images = [];
		for ( let i = 0 ; i < 2 ; i++ ) {
			if ( self.div ) self.div.innerHTML += '<span>' + ( i ? 'right':'left' ) + '</span>'
			let imageData = arguments[ i ];
			images.push( imageData );

			self.log( 'creating edge data: #%', edges.length );

			self.context.putImageData( imageData, 0, 0 );
			self.debugImage();

			let tmp = self.context.getImageData( 0, 0, w, h );

			self.log( 'smoothing' );
			let smooth = self.smooth( smoothDistance, w, h, tmp.data )
			self.context.putImageData( tmp, 0, 0 );
			self.log( 'smoothed' );
			self.debugImage();

			self.log( 'edging (lol)' );
			let edge = self.edge( edgeDistance, w, h, tmp.data );
			self.context.putImageData( tmp, 0, 0 );
			self.log( 'edged (nice!)' );
			self.debugImage();

			edges.push( edge );
			if ( self.div ) self.div.innerHTML += '<br/>'
		}

		return self.chunkHunt( edges, images,size, area, precision, w, h );
	};

	// matches from calling self.chunkHunt...
	self.showMatches = function( left, right, matches, smoothDistance, edgeDistance, size, area, precision ) {
		smoothDistance = theD.ur( smoothDistance , DEFAULT_SMOOTH_DISTANCE );
		edgeDistance = theD.ur( edgeDistance   , DEFAULT_EDGE_DISTANCE );

		size = theD.ur( size , DEFAULT_HUNT_CHUNK_SIZE );
		area = theD.ur( area , DEFAULT_HUNT_SEARCH_AREA );
		precision = theD.ur( precision, 1 );

		let w;
		let h = self.canvas.height = left.height;

		if ( right ) {
			w = left.width;
		} else {
			w = left.width / 2;
		}

		self.canvas.width = w * 3

		self.clear();

		let alphaRange = new YesMM();
		for ( let i = 0 ; i < matches.length ; i++ ) {
			let match = matches[ i ];
			let d3 = match.d3;
			alphaRange.add( d3.z );
		}

		self.log( 'alpha is ' + alphaRange );

		let p2 = Math.floor( precision / 2 );

		let at = {};

		for ( let i = 0 ; i < matches.length ; i++ ) {
			let match = matches[ i ];
			let d3 = match.d3;
			let alpha = alphaRange.scale( d3.z );
			let r = Math.floor( 200 * alpha ) + 55;
			self.context.fillStyle = 'rgb(%,0,0)'.replace( /%/, r );
			self.context.fillRect( match.x -p2, match.y-p2, precision, precision );

			let k = match.x + ',' + match.y;
			//console.log( 'at ' + k );
			at[ k ] = match;
		}
		
		let matcho = self.context.getImageData( 0, 0, w, h );
			
		let w1 = w * 1 ; let w2 = w * 2;

		let q = self.canvas.onmousemove = function( e ) {
			let x = e.offsetX % w;
			let k = x + ',' + e.offsetY;
			let v = ( k in at ) ? at[ k ] : false; 

			if ( right ) {
				self.context.putImageData( left,  0, 0 );
				self.context.putImageData( left,  w, 0 );
			} else {
				self.context.drawImage( left, 0, 0 );
				self.context.drawImage( left, w, 0 );
			}

			let sizeC = 'rgba(0,255,0,0.8)';
			let areaC = 'rgba(0,0,255,0.8)';

			let o = ( ( 1 - x / w ) - 0.5 ) * area.x * 1.5;

			if( v ) {
				self.rectRound( sizeC  , w1 + v.x      , v.y, size );
				self.rectRound( areaC,   w1 + v.x + o  , v.y, area );
				self.fillRect( 'red',    w1 + v.x      ,  v.y, precision, precision ); // query
				self.fillRect( 'green',  w1 + v.tx     ,  v.ty, precision, precision ); // response
			}

			if ( right ) {
				self.context.putImageData( right, w2, 0 );
			} else {
				self.context.drawImage( left, w2, 0 );
			}

			if( v ) {
				self.rectRound( areaC,  w2 + v.x + o , v.y, area );
				self.fillRect( 'red',   w2 + v.x     , v.y, precision, precision ); // query
				self.fillRect( 'green', w2 + v.tx    , v.ty, precision, precision ); // response
			}

			self.context.putImageData( matcho, 0, 0 );

			self.drawLine( 'black', w1, 0, w1, h );
			self.drawLine( 'black', w2, 0, w2, h );
		}
		q({offsetX:0,offsetY:0});

		let cleft = left;

		if ( !right ) {
			self.context.drawImage( left, 0, 0 );
			cleft = self.context.getImageData( 0, 0, left.width, left.height );
		}

		self.show3( cleft, right, matches, smoothDistance, edgeDistance, size, area, precision );
	};

	self.show3 = function( left, right, matches, smoothDistance, edgeDistance, size, area, precision ) {
		let c3 = document.createElement( 'canvas' );
		c3.width = c3.height = 512; 
		document.body.insertBefore( c3, document.body.firstChild );

		let x = 4 / left.width;
		let y = 4 / left.height;

		let vertices = [];
		let colors = [];
		let faces = [];

		let p1 = function( p ) { vertices.push( p.x + 0 ); vertices.push( p.y + 0 ); vertices.push( p.z + 0 ); };
		let p2 = function( p ) { vertices.push( p.x + x ); vertices.push( p.y + 0 ); vertices.push( p.z + 0 ); };
		let p3 = function( p ) { vertices.push( p.x + x ); vertices.push( p.y + y ); vertices.push( p.z + 0 ); };
		let p4 = function( p ) { vertices.push( p.x + 0 ); vertices.push( p.y + y ); vertices.push( p.z + 0 ); };

		let xr = new YesMM();
		let yr = new YesMM();
		let mr = new YesMM();
		let zr = new YesMM();

		for ( let i = 0 ; i < matches.length; i++ ) {
			let match = matches[ i ];
			let index = 4 * ( match.x + match.y * left.width );

			let r = left.data[ index++ ];
			let g = left.data[ index++ ];
			let b = left.data[ index++ ];

			r /= 255;
			g /= 255;
			b /= 255;

			let p = match.d3;
			//self.log( '(%,%)->%->%,%,%: %', match.x, match.y, index, r, g, b, p );

			p.z *= 0.13;

			// huh?
			p.y += 0.5;
			p.y *= 2.0;
			p.y = 2 * ( match.y / left.height ) -1;

			xr.add( p.x );
			yr.add( p.y );
			zr.add( p.z );
			mr.add( match.y );

			for ( let j = 0 ; j < 6 ; j++ ) {
				let no = vertices.length / 3 
				faces.push( no + j );
			}
			p1( p ); p2( p ); p4( p );
			p2( p ); p3( p ); p4( p );

			for ( let j = 0 ; j < 6 ; j++ ) {
				colors.push( r );
				colors.push( g );
				colors.push( b );
			}
		};

		self.log( 'x: %', xr );
		self.log( 'y: % <-- %', yr, mr );
		self.log( 'z: %', zr );


		if ( false ) {
			self.log( 'vertices: %', vertices );
			self.log( 'faces: %', faces );
			//self.log( 'colors: %', colors );
		} else {
			self.log( '% vertices, % colors, % faces', vertices.length / 3, colors.length / 3, faces.length / 3 );
		}

		//self.log( '% and %', vertices, 'x' );//.length, colors.length );

		let setup = Glo.demoSetup( Shadero.lit );
		let mesh = {
			attributes:{
				aPosition: vertices
			   , aColor:    colors
		   }
		   , faces:faces
		}

		let axis = Mesho.axis();

		let draw = function() {
			setup.mouseLoop( );
			Glo.drawMesh( setup.gl, setup.program, axis );

			if ( false ) {
			Glo.drawMesh( setup.gl, setup.program, mesh );
			} else {
				for ( let name in mesh.attributes ) {
					let data = mesh.attributes[ name ];
					Glo.data( setup.gl, setup.program, name, data );
				}
				if ( false ) {
					Glo.draw( setup.gl, mesh.faces, setup.gl.TRIANGLES ); // idk what's wrong here...
				} else {
					setup.gl.drawArrays( setup.gl.TRIANGLES, 0,  mesh.faces.length  );
				}
			}
		};

		Utilo.frame( draw, 60 ).start();
	}

	self.smooth = function( neighborhood, w, h, data, selfWeight ) {
		if ( 0 == neighborhood ) {
			let nu = new Array( data.length );
			theD.into( nu, data, data.length ); 
			return nu;
		}

		let tmp = 2 * neighborhood + 1;
		tmp = tmp * tmp * tmp;
		selfWeight = theD.ur( selfWeight, tmp );

		let n = neighborhood; // laziness...
		let nu = new Array( data.length );

		let index = 0;
		for ( let y = 0 ; y < h ; y++ ) {
			for ( let x = 0 ; x < w ; x++ ) {
				let sum = 0;
				let rgb = [0,0,0];
				for ( let yn = y - n ; yn <= y + n ; yn++ ) {
					if ( yn < 0 || yn >= w ) continue;
					let dy = y - yn;
					dy *= dy;

					for ( let xn = x - n ; xn <= x + n ; xn++ ) {
						if ( xn < 0 || xn >= h ) continue;

						let idx = 4 * ( xn + yn * w );

						let dx = x - xn;
						dx *= dx;
						let distance = dy + dx;
						let weight = distance ? 1 / distance : selfWeight;

						sum += weight;

						rgb[ 0 ] += data[ idx++ ] * weight;
						rgb[ 1 ] += data[ idx++ ] * weight;
						rgb[ 2 ] += data[ idx++ ] * weight;
					}
				}

				nu[ index++ ] = rgb[ 0 ] / sum;
				nu[ index++ ] = rgb[ 1 ] / sum;
				nu[ index++ ] = rgb[ 2 ] / sum;
				nu[ index++ ] = 255;
			}
		}

		theD.into( data, nu, index ); 
		return nu;
	};
			
	self.edge = function( neighborhood, w, h, data, scale ) {
		if ( 0 == neighborhood ) {
			let nu = new Array( data.length );
			theD.into( nu, data, data.length ); 
			return nu;
		}

		scale = theD.ur( scale, true );

		let n = neighborhood; // laziness...
		let nu = new Array( data.length );

		let index = 0;
		let min = 9999999999;
		let max = -min;

		for ( let y = 0 ; y < h ; y++ ) {
			for ( let x = 0 ; x < w ; x++ ) {
				let sum = 0;
				let rgb = [0,0,0];
				let current = [ data[index+0], data[index+1], data[index+2] ];

				for ( let yn = y - n ; yn <= y + n ; yn++ ) {
					if ( yn < 0 || yn >= w ) continue;
					let dy = y - yn;
					dy *= dy;

					for ( let xn = x - n ; xn <= x + n ; xn++ ) {
						if ( xn < 0 || xn >= h ) continue;
						if ( xn == x && yn == y ) continue;

						let idx = 4 * ( xn + yn * w );

						sum++;
						let rdiff = current[ 0 ] - data[ idx + 0 ];
						let gdiff = current[ 1 ] - data[ idx + 1 ];
						let bdiff = current[ 2 ] - data[ idx + 2 ];
						rgb[ 0 ] += rdiff * rdiff;
						rgb[ 1 ] += gdiff * gdiff;
						rgb[ 2 ] += bdiff * bdiff;
					}
				}

				rgb[ 0 ] = Math.sqrt( rgb[ 0 ] ) / sum;
				rgb[ 1 ] = Math.sqrt( rgb[ 1 ] ) / sum;
				rgb[ 2 ] = Math.sqrt( rgb[ 2 ] ) / sum;

				nu[ index++ ] = rgb[ 0 ];
				nu[ index++ ] = rgb[ 1 ];
				nu[ index++ ] = rgb[ 2 ];
				nu[ index++ ] = 255;

				if ( rgb[ 0 ] < min ) min = rgb[ 0 ];
				if ( rgb[ 1 ] < min ) min = rgb[ 1 ];
				if ( rgb[ 2 ] < min ) min = rgb[ 2 ];
				if ( rgb[ 0 ] > max ) max = rgb[ 0 ];
				if ( rgb[ 1 ] > max ) max = rgb[ 1 ];
				if ( rgb[ 2 ] > max ) max = rgb[ 2 ];
			}
		}

		if ( scale ) {
			let diff = max - min;
			index = 0;
			for ( let y = 0 ; y < h ; y++ ) {
				for ( let x = 0 ; x < w ; x++ ) {
					for ( let i = 0 ; i < 3 ; i++ ) {
						nu[ index ] = Math.floor( 255 * ( nu[ index++ ] - min ) / diff );
					}
					index++;
				}
			}
		}

		theD.into( data, nu, index );
		return nu;
	};

	// the wumpus is out of season

	self.chunkHunt = function( edges, images, size, area, precision, w, h ) {
		let distanceRange = new YesMM();
		let differenceRange = new YesMM();

		let matches = [];

		self.log( 'chunkHunt: %', {size:size,area:area,precision:precision} );

		let confidenceThreshold = 0.2;
		confidenceThreshold = 0.4; 
		confidenceThreshold = 0.0001;
		//confidenceThreshold = 0;
		
		for ( let y = 0 ; y < h ; y += precision ) {
			self.log( 'hunt is at % of %', y, h );
			for ( let x = 0 ; x < w ; x += precision ) {
				let match = self.huntThisChunk( edges, images, x, y, w, h, size, area );
				if ( !match ) {
					//console.log( 'sorry: ' + x + ',' + y + ' is unmatched' );
					continue;
				}
				if ( match.confidence < confidenceThreshold ) continue;

				self.fkfkf( 'matched' );

				match.d = match.dx * match.dx + match.dy * match.dy;
				matches.push( match );

				distanceRange.add( match.d );
				differenceRange.add( match.difference );
			}
		}

		self.log( 'distanceRange: ' + distanceRange );
		self.log( 'differenceRange: ' + differenceRange );

		for( let i = 0 ; i < matches.length ; i++ ) {
			let match = matches[ i ];
			let x = match.x / w; 
			let y = match.y / h;
			let z = distanceRange.scale( match.d );

			match.d3 = { x: x * 2 - 1, y: y * 2 - 1, z: z * 2 - 1 };
			//console.log( match.d3 );
		}

		self.debugImage();

		return matches;
	};

	self.shouldHunt = function( edges, images, x, y, w, h, size ) {
		let ez = edges[ 0 ];
		let idx = 4 * ( x + y * w );
		return ( ez[ idx++ ] + ez[ idx++ ] + ez[ idx ] > 0 );
	}

	self.huntThisChunk = function( edges, images, x, y, w, h, size, area ) {
		if ( !self.shouldHunt( edges, images, x, y, w, h, size ) ) {
			return false;
		}

		let closest = false;
		let differences = [];

		// search more to the right when on the left side of the image
		// and vice-versa
		let o = Math.floor( ( ( 1 - x / w ) - 0.5 ) * area.x * 1.5 );

		for ( let dy = -area.y ; dy <= +area.y ; dy++ ) {
			let ty = y + dy;
			if ( ty < 0|| ty >= h ) continue;
			
			for ( let dx = -area.x ; dx <= +area.x ; dx++ ) {
				let tx = x + dx + o;
				if ( tx < 0|| tx >= w ) continue; 

				let difference = self.compareChunks( 
					edges, images, x, y, tx, ty, w, h, size
				);
				if ( false == difference ) continue;
				let d = dx + dy;
				
				// TODO: this drop off is probly too much..
				// should consider the offset of x in the width of the image
				let wt = 0 == d ? 1 : 1 / d;

				wt=1;
				difference *= wt;
				difference = Math.ceil( difference );
				differences.push( difference );

				if ( false === closest || closest.difference > difference 
					|| ( closest.difference == difference && Math.abs(dx) < Math.abs(closest.dx) )
					//|| ( closest.difference == difference && d < closest.d )
						) {
					closest = { difference:difference, x:x,y:y, tx:tx, ty:ty, dx:dx, dy:dy, d:d }
				}
			}
		}

		if ( !closest ) {
			//console.log( 'fail:' + JSON.stringify( {x:x,y:y,minX:minX,maxX:maxX,minY:minY,maxY:maxY} ) );
			return closest;
		}

		let average  = Math.ceil( self.average( differences ) );
		let variance = Math.ceil( self.variance( average, differences ) );
		let stddev   = Math.ceil( Math.sqrt( variance ) );
		let confidence = Math.floor( 1000 * ( 1 - closest.difference / average ) ) / 1000;
		closest.confidence = confidence;
		//self.log( 'confidence:%, closest:%, average:%, stddev:%', confidence, closest.difference, average, stddev );

		return closest;
	};

	self.compareChunks = function( edges, images, x, y, tx, ty, w, h, size ) {
		let count = 0;
		let difference = 0;

		for ( let dy = -size.y ; dy < size.y ; dy++ ) {
			let y0 =  y + dy;
			let y1 = ty + dy;
			if ( y0 < 0 || y1 < 0 || y0 >= h || y1 >= h ) continue;

			for ( let dx = -size.x ; dx < size.x ; dx++ ) {
				let x0 =  x + dx;
				let x1 = tx + dx;
				if ( x0 < 0 || x1 < 0 || x0 >= w || x1 >= w ) continue;

				let d = self.comparePixels( edges , images, x0, y0 , x1, y1 , w, h );
				if ( false == d ) continue;

				count++;
				difference += d;
			}
		} 

		if ( !count ) {
			//console.log( 'cannot:' + JSON.stringify( {x:x,y:y,tx:tx,ty:ty,size:size,w:w,h:h} ) );
		}

		return count ? difference / count : false;
	};

	self.comparePixels = function( edges, images, x0,y0, x1,y1, w, h ) {
		let d0 = images[ 0 ].data;
		let d1 = images[ 1 ].data;

		let index0 = 4 * ( x0 + y0 * w );
		let r0 = d0[ index0++ ];
		let g0 = d0[ index0++ ];
		let b0 = d0[ index0++ ];

		let index1 = 4 * ( x1 + y1 * w );
		let r1 = d1[ index1++ ];
		let g1 = d1[ index1++ ];
		let b1 = d1[ index1++ ];

		let r = r1 - r0;
		let g = g1 - g0;
		let b = b1 - b0;

		let v = r * r + g * g + b * b;
		return v;
	};

self.eoeo = {};
self.fkfkf = function(k) {
if ( k in self.eoeo )self.eoeo[k]++;else self.eoeo[k]=1;
}
	// distance in rgb space or false if no comparison
	self.komparePixels = function( edges, images, x0,y0, x1,y1, w, h ) {
		let edgeThreshold = 0;

		let index0 = 4 * ( x0 + y0 * w );
		let r0 = edges[ 0 ][ index0++ ];
		let g0 = edges[ 0 ][ index0++ ];
		let b0 = edges[ 0 ][ index0++ ];
		let edge0 = ( r0 + g0 + b0 > edgeThreshold );

		let index1 = 4 * ( x1 + y1 * w );
		let r1 = edges[ 1 ][ index1++ ];
		let g1 = edges[ 1 ][ index1++ ];
		let b1 = edges[ 1 ][ index1++ ];
		let edge1 = ( r1 + g1 + b1 > edgeThreshold );

		let both = edge0 && edge1;
		let either = edge0 || edge1;

		if ( !either ) {
			self.fkfkf( 'neither' );
			return false;
			//return 0; // this is gross and crazy
		}
		if ( !both ) {
			if ( edge0 ) {
				self.fkfkf( 'just0' ); 
			} else {
				self.fkfkf( 'just1' );
			}
			return TOTALLY;
		}

		self.fkfkf( 'both' );
		return 0;
/*
		index0 -= 3;
		r0 = images[ 0 ].data[ index0++ ];
		g0 = images[ 0 ].data[ index0++ ];
		b0 = images[ 0 ].data[ index0++ ];

		index1 -= 3;
		r1 = images[ 1 ].data[ index1++ ];
		g1 = images[ 1 ].data[ index1++ ];
		b1 = images[ 1 ].data[ index1++ ];
*/
		let r = r0 - r1;
		let g = g0 - g1;
		let b = b0 - b1;
		return r*r + g*g + b*b;
	}

	/////////////////////////////////////////////////////////////////////////////

	self.average = function( vz ) {
		let sum = 0;
		for ( let i = 0 ; i < vz.length ; i++ ) sum += vz[ i ];
		return sum / vz.length;
	};
	self.variance = function( average, vz ) {
		let variance = 0;
		for ( let i = 0 ; i < vz.length ; i++ ) {
			let d = average - vz[ i ];
			variance += d * d;
		}
		return variance;
	};

	/////////////////////////////////////////////////////////////////////////////

	self.perko = function() {
		let s = arguments[ 0 ];
		for ( let i = 1 ; i < arguments.length ; i++ ) {
			let argument = arguments[ i ];
			let t = 'object' === typeof(  argument ) ? JSON.stringify( argument ) : argument.toString();
			s = s.replace( /%/, t );
		}
		return s;
	};
	self.log = function() {
		let s = arguments[ 0 ];
		for ( let i = 1 ; i < arguments.length ; i++ ) {
			let argument = arguments[ i ];
			let t = 'object' === typeof(  argument ) ? JSON.stringify( argument ) : argument.toString();
			s = s.replace( /%/, t );
		}
		let ts = new Date().toLocaleString().replace( /[^ ]* /, '' );
		s = ts + '\t' + s ;

		if ( self.pre && self.pre.innerHTML ) {
			self.pre.innerHTML = s + self.pre.innerHTML;
		} else {
			console.log( s );
		}
	};

	self.clearLog = function() {
		self.pre.innerHTML = '';
	};

	self.drawLine = function( color, x0, y0, x1, y1 ) {
		self.context.strokeStyle = color;
		self.context.beginPath();
		self.context.moveTo( x0, y0 );
		self.context.lineTo( x1, y1 );
		self.context.stroke();
	};

	self.fillRect = function( color, x, y, w, h ) {
		self.context.fillStyle = color;
		self.context.fillRect( x, y, w, h );
	};

	self.drawRect = function( color, x, y, w, h ) {
		self.context.strokeStyle = color;
		self.context.beginPath();
		self.context.rect( x, y, w, h );
		self.context.stroke();
	};
			
	self.rectRound = function( color, x, y, sz ) {
		self.drawRect( color, x - sz.x, y - sz.y, sz.x * 2, sz.y * 2 );
	}

	self.clear = function() {
		self.fillRect( 'white', 0, 0, self.canvas.width, self.canvas.height );
	};

	self.fillText = function( color, text, x, y ) {
		self.context.fillStyle = color;
		self.context.fillText( text, x, y );
	};

	self.debugImage = function() {
		if ( self.div ) self.div.appendChild( self.toImage() );
	};

	self.toImage = function() {
		let img = document.createElement( 'img' );
		img.width = self.canvas.width;
		img.height = self.canvas.height;
		img.src = self.canvas.toDataURL();
		return img;
	};

	/////////////////////////////////

	self.init();
};

/////////////////////////////////////////////////////////////////////////////

const theD = {
	  first: function( tag ) { return document.getElementsByTagName( tag )[ 0 ] }
	, into:  function( dst, src, count ) { while( --count >= 0 ) dst[ count ] = src[ count ] }
	, ru:    function( v ) { return 'undefined' === typeof( v ) }
	, ur:    function( v, d ) { return this.ru( v ) ? d : v }
};

/////////////////////////////////////////////////////////////////////////////

const YesMM = function() {
	this.min = this.max = false;
	this.add = function( v ) {
		if ( isNaN( v ) ) throw "that's not a number... " + v;
		if ( !this.min || v < this.min ) this.min = v;
		if ( !this.max || v > this.max ) this.max = v;
		this.diff = this.max - this.min;
	};
	this.scale = function( v ) {
		return this.diff ? ( v - this.min ) / this.diff : 0;
	};
	this.toString = function() {
		return '[' + this.min + ':' + this.max + '], ' + this.diff;
	};
	this.holds = function( v ) {
		return v >= this.min && v <= this.max;
	};
	this.under = function( v ) {
		return v > this.max; // true when the max is smaller
	};
	this.over = function( v ) {
		return v < this.min; // true when the min is larger
	};
};
		
/////////////////////////////////////////////////////////////////////////////

window.onload = function() { new Parararia() };
