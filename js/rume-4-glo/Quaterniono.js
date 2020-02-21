import Utilo from './Utilo.js';

// https://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
// https://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/transforms/index.htm
// https://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/functions/index.htm
// https://openhome.cc/Gossip/WebGL/samples/Quaternion-1.html

// [x,y,z,w];
const Quaterniono = {
	set:function( x, y, z, w, storage ) {
		w = Utilo.idk( w, 0 );
		storage = Utilo.idk( storage, new Array( 4 ) );
		storage[ 0 ] = x;
		storage[ 1 ] = y;
		storage[ 2 ] = z;
		storage[ 3 ] = w;
		return storage;
	}
	, copy:function( from, to ) {
		return set( from[ 0 ], from[ 1 ], from[ 2 ], from[ 3 ], to );
	}
	, zed:function( storage ) {
		return Quaterniono.set( 0,0,0,0, storage );
	}
	, rotate: function( angle, q, storage) {
		const s = Math.sin( angle / 2 );
		return Quaterniono.set(
			  q[ 0 ] * s
			, q[ 1 ] * s
			, q[ 2 ] * s
			, Math.cos( angle / 2 ) 
		);
	}
	, rotatePoint: function( q, p, storage, tmp, tmp2 ) {
		return Quaterniono.multiply( 
			  Quaterniono.multiply( q, p, tmp )
			, Quaterniono.conjugate( q, tmp2 )
			, storage
		);
	}
	, conjugate: function( q, storage ) {
		return Quaterniono.set( -q[ 0 ], -q[ 1 ], -q[ 2 ], q[ 3 ], storage );
	}
	, multiply: function( q, p, storage ) {
		return Quaterniono.set(
			   q[ 0 ] * p[ 3 ] + q[ 1 ] * p[ 2 ] - q[ 2 ] * p[ 1 ] + q[ 3 ] * p[ 0 ]
			, -q[ 0 ] * p[ 2 ] + q[ 1 ] * p[ 3 ] + q[ 2 ] * p[ 0 ] + q[ 3 ] * p[ 1 ]
			,  q[ 0 ] * p[ 1 ] - q[ 1 ] * p[ 0 ] + q[ 2 ] * p[ 3 ] + q[ 3 ] * p[ 2 ]
			, -q[ 0 ] * p[ 0 ] - q[ 1 ] * p[ 1 ] - q[ 2 ] * p[ 2 ] + q[ 3 ] * p[ 3 ]
			, storage
		);
	}
	, toMatrix: function( q, storage ) {
		const x = q[ 0 ];
		const y = q[ 1 ];
		const z = q[ 2 ];
		const w = q[ 3 ];

		// from https://openhome.cc/Gossip/WebGL/samples/Quaternion-1.html
		// from https://openhome.cc/Gossip/WebGL/Quaternion.html
		const x2 = x + x;
		const y2 = y + y;
		const z2 = z + z;

		const xx = x * x2;
		const yx = y * x2;
		const yy = y * y2;
		const zx = z * x2;
		const zy = z * y2;
		const zz = z * z2;
		const wx = w * x2;
		const wy = w * y2;
		const wz = w * z2;

		storage = Utilo.idk( storage, new Array( 16 ) );
		storage[  0 ] = 1 - yy - zz
		storage[  1 ] = yx + wz
		storage[  2 ] = zx - wy
		storage[  3 ] = 0
		storage[  4 ] = yx - wz
		storage[  5 ] = 1 - xx - zz
		storage[  6 ] = zy + wx
		storage[  7 ] = 0
		storage[  8 ] = zx + wy
		storage[  9 ] = zy - wx
		storage[ 10 ] = 1 - xx - yy
		storage[ 11 ] = 0
		storage[ 12 ] = 0
		storage[ 13 ] = 0
		storage[ 14 ] = 0
		storage[ 15 ] = 1
		return storage;
	}
	, normalize: function( q, storage ) {
		const length = Quaterniono.length( q );
		return (
			0 === length 
			? Quaterniono.copy( q, storage )
			: Quaterniono.scale( 1 / length, q, storage )
		);
	}
	, length: function( q ) {
		return Math.sqrt( Quaterniono.dot( q, q ) );
	}
	, scale: function( s, q, storage ){
		return Quaterniono.set(
			q[ 0 ] * s, 
			q[ 1 ] * s, 
			q[ 2 ] * s, 
			q[ 3 ] * s,
			storage
		);
	}
	, dot: function( q, p ) {
		return [
			q[ 0 ] * p[ 0 ] +
			q[ 1 ] * p[ 1 ] +
			q[ 2 ] * p[ 2 ] +
			q[ 3 ] * p[ 3 ]  
		];
	}
	, add: function( q, p, storage ){
		return Quaterniono.set(
			q[ 0 ] + p[ 0 ],
			q[ 1 ] + p[ 1 ],
			q[ 2 ] + p[ 2 ],
			q[ 3 ] + p[ 3 ],
			storage
		);
	}
	, subtract: function( q, p, storage ){
		return Quaterniono.set(
			q[ 0 ] - p[ 0 ],
			q[ 1 ] - p[ 1 ],
			q[ 2 ] - p[ 2 ],
			q[ 3 ] - p[ 3 ],
			storage
		);
	}
	// not normalized...
	, interpolateLinearly: function( q, p, t, storage, tmp1, tmp2 ) {
		return Quaterniono.add( 
			q,
			Quaterniono.scale( t, Quaterniono.subtract( p, q, tmp1 ), tmp2 ),
			storage
		);
	}
	, slerp: function( q, p, t ) {
		// from https://en.wikipedia.org/wiki/Slerp
		// Only unit quaternions are valid rotations.
		// Normalize to avoid undefined behavior.
		let v0 = Quaterniono.normalize( q );
		let v1 = Quaterniono.normalize( p );

		// Compute the cosine of the angle between the two vectors.
		let dot = Quaterniono.dot( v0, v1 );

		// If the dot product is negative, slerp won't take
		// the shorter path. Note that v1 and -v1 are equivalent when
		// the negation is applied to all four components. Fix by
		// reversing one quaternion.
		if (dot < 0.0) {
			v1 = Quaterniono.scale( -1, v1 );
			dot = -dot;
		}

		const DOT_THRESHOLD = 0.9995;
		if (dot > DOT_THRESHOLD) {
			// If the inputs are too close for comfort, linearly interpolate
			// and normalize the result.
			return Quaterniono.normalize( Quaterniono.interpolateLinearly( v0, v1, t ) );
		}

		// Since dot is in range [0, DOT_THRESHOLD], acos is safe
		const theta_0     = Math.acos( dot );    // theta_0 = angle between input vectors
		const theta       = theta_0 * t;         // theta   = angle between v0 and result
		const sin_theta   = Math.sin( theta );   // compute this value only once
		const sin_theta_0 = Math.sin( theta_0 ); // compute this value only once

		const s0 = Math.cos(theta) - dot * sin_theta / sin_theta_0;  // == sin(theta_0 - theta) / sin(theta_0)
		const s1 = sin_theta / sin_theta_0;

		return Quaterniono.add(
			Quaterniono.scale( s0, v0 ),
			Quaterniono.scale( s1, v1 )
		);
	}
};

export default Quaterniono;
