/*
 * Copyright 2006 Structured Data, LLC.
 * $Id: TSChartLib.js 41 2006-04-25 13:13:30Z duncan $
 *
 * Version: 0.1
 * 
 * TSChartLib is a chart library (hence the clever name).  For more
 * information, please see our website at http://www.thumbstacks.com.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This file was changed by Marcin Seremak in three parts of code:
 * lines: 229, 341, 404
 *
 */

/**
 * base chart type.  this is kind of a chumpy inheritance model,
 * but it's easier than maintaining everything in different places.
 */
function TSChartLib_AbstractChart()
{
	// style constants - IE doesn't support define?
	
	this.STYLE_PLAIN = 			0;
	this.STYLE_3D = 			1;
	this.STYLE_PERCENT = 		2;
	this.STYLE_FILLED = 		4;
	this.STYLE_VALUE_LABELS = 	8;
	
	// fields
	
	this.lineStyle = "#222";
	this.lineWidth = "2";
	this.fillStyle = "#00f";
	this.shadowStyle = "#00c";
	this.chartStyle = this.STYLE_PLAIN;
	this.axisLabels = null;
	this.canvasTop = 0;
	this.canvasLeft = 0;
	this.margins = Array( 8, 8, 8, 8 ); // tlbr

	this.defaultColorScheme = 
	[
		{ color: "#0cf", 	shadowColor: "#09f" }, // blue
		{ color: "#ff0", 	shadowColor: "#fc0" }, // yellow
		{ color: "#c6c", 	shadowColor: "#c3c" }, // purple
		{ color: "#f00", 	shadowColor: "#c00" }, // red
		{ color: "#6c0", 	shadowColor: "#690" }, // green
	];
	
	/**
	 * internal chart structure
	 */
	this.data = Array();

	/**
	 * references to labels, which are dom nodes
	 * (not drawn)
	 */
	this.labels = Array();

	/**
	 * find the x, y position of the canvas
	 * in the document.  this is based on the method
	 * from quirksmode, see
	 * http://www.quirksmode.org/
	 */
	this.find_canvas_position = function( o )
	{
		this.canvasTop = 0;
		this.canvasLeft = 0;
		
		if( o.offsetParent )
		{
			while( o.offsetParent )
			{
				this.canvasLeft += o.offsetLeft;
				this.canvasTop += o.offsetTop;
				o = o.offsetParent;
			}
		}
		else
		{
			if( o.x ) this.canvasLeft += o.x;
			if( o.y ) this.canvasTop += o.y;
		}
		
	};

	/**
	 * reset chart data.
	 */
	this.reset = function()
	{
		var i, l = this.data.length;
		for( i = 0; i< l; i++ )
		{
			delete this.data[i];
			this.data[i] = null;
		}
		this.data.splice( 0, l );
		this.resetLabels();
	};

	/**
	 * reset labels: this is a separate method, because it should
	 * be called anytime the chart is redrawn (unlike resetting data)
	 */
	this.resetLabels = function()
	{
		l = this.labels.length;
		for( i = 0; i< l; i++ )
		{
			if( this.labels[i].parentNode )
				this.labels[i].parentNode.removeChild( this.labels[i] );
			delete this.labels[i];
			this.labels[i] = null;
		}
		this.labels.splice( 0, l );
	};

	/**
	 * add axis labels (not for pie charts)
	 */
	this.add_labels = function( labels )
	{
		this.axisLabels = labels;
	};
	
	/**
	 * Add a data element - basically, push onto the stack.  values are
	 * data sets - generally arrays of points, but in the case of pie
	 * charts, a single point.  In the case of the pie chart, the value
	 * can be passed as a number; for other charts, it should be an array
	 * of points.
	 *
	 * @param value			the value, as an array of points or as a number
	 * @param label			[OPTIONAL] the label for the element
	 * @param color			[OPTIONAL] the fill color
	 * @param shadowColor	[OPTIONAL] the shadow color, for 3D charts
	 * @param lineColor 	[OPTIONAL] For line charts only, the line color
	 * @param lineWidth		[OPTIONAL] For line charts only, line width
	 */
	this.add_element = function( value, label, color, shadowColor, lineColor, lineWidth )
	{
		if( !value )
		{
			throw "Invalid entry value";
			return;
		}
		var elt = new Object();
				
		if( typeof( value ) == "Array" || ( value.length && value.length > 0 ))
		{
			elt.data = value;
			elt.value = 0;
		}
		else
		{
			elt.value = value;
		}
		if( label ) elt.label = label;
		if( color ) elt.color = color;
		if( shadowColor ) elt.shadowColor = shadowColor;
		if( lineColor ) elt.lineColor = lineColor;
		if( null != lineWidth ) elt.lineWidth = lineWidth; // can be zero
		
		this.data.push( elt );
	};
		
	/**
	 * draw the chart.
	 *
	 * @param canvas		the canvas element.  we're relying on size,
	 * 						ownerDocument, and parentNode (for labels) -
	 * 						so this needs to be in the DOM.
	 */
	this.render = function( canvas ){};
	
	/**
	 * draw an animated chart.  the parameter is type-dependent,
	 * but will be an integer.  if the chart doesn't support animation
	 * (or the passed variable), it should just call render.
	 * 
	 * @param canvas		the canvas element.  we're relying on size,
	 * 						ownerDocument, and parentNode (for labels) -
	 * 						so this needs to be in the DOM.
	 * @param type			the animation type, if multiple types are supported.
	 */
	this.animate = function( canvas, type )
	{
		this.render( canvas );
	};
}

/**
 * Line chart type, extends AbstractChart
 */
function TSChartLib_LineChart()
{
	// defaults for type 

	this.lineStyle = "#333";
	this.lineWidth = "2";

	this.margins = Array( 8, 18, 18, 8 ); // tlbr

	// marker styles

	this.MARKER_SQUARE = 	1;
	this.MARKER_TRIANGLE = 	2;
	this.MARKER_DIAMOND =	4;
	this.MARKER_CIRCLE =	8;
	
	// fields
	
	this.chartMin = null;
	// hack #0 - I want MARKERS for the first and the second set of data
	this.markerStyle = this.MARKER_CIRCLE;
	
	// animation flags
	
	this.maxPoints = -1;
	this.maxSets = -1;
	this.dataCount = 0;
	

	/**
	 * draw the chart.
	 */
	this.render = function( canvas )
	{
		if( this.data.length <= 0 )
		{
			throw "No data for chart";
			return;
		}
		
		var a, i, j, k, x, y, w, h, s;
		var ctx = canvas.getContext("2d");
		var max = 0, min = 0, range = 0, scale = 0, zero = 0, ct = 0;
		var space = 0;
		var last = 0;
		var scaleUnit = 1;
		
		var kct = ( this.chartStyle & this.STYLE_FILLED ) ? 2 : 1 ;
		
		this.resetLabels();
		
		w = canvas.offsetWidth;
		h = canvas.offsetHeight;
		
		// prep canvas
		ctx.save();
		ctx.clearRect( 0, 0, w, h );
				
		// style
		ctx.lineWidth = this.lineWidth;
		ctx.strokeStyle = this.lineStyle;
		ctx.fillStyle = this.fillStyle;		
		
		// figure out data range
		for( j = 0; j< this.data.length; j++ )
		{
			if( !this.data[j].data || !this.data[j].data.length ) continue;
			a = this.data[j].data;
			for( i = 0; i< a.length; i++ )
			{
				if( ( !i && !j ) || a[i] < min ) min = a[i];	
				if( ( !i && !j ) || a[i] > max ) max = a[i];	
			}
			if( a.length > ct ) ct = a.length;
		}
		
		this.dataCount = ct;
		max *= 1.05;
		
		if( this.chartMin != null ) min = this.chartMin;
		
		if( min < 0 ) min *= 1.05;
		else if( min > 0 ) min *= .95;
		
		range = ( max - min );
		
		if( ct <= 0 || range == 0 )
		{
			throw "Invalid data";
		}
	
		scale = ( ( h - this.margins[0] - this.margins[2] ) / range );

		// draw scale... how can we figure out the appropriate scale range?

		scaleUnit = 1;
		if( range >= 10 )
		{
			while( range / scaleUnit > 8 ) scaleUnit *= 10;
			if( range / scaleUnit < 4 ) scaleUnit *= .5;
			if( range / scaleUnit < 4 ) scaleUnit *= .5;
		}
		else // very small?
		{
			while( range / scaleUnit < 8 ) scaleUnit /= 10;
			if( range / scaleUnit > 4 ) scaleUnit /= .5;
			if( range / scaleUnit > 4 ) scaleUnit /= .5;
		}

		// calculate horizontal spacing
		
		space = ( ( w - this.margins[1] - this.margins[3] ) / ct );

		// draw lines...

		for( j = 0; j< this.data.length ; j++ )
		{
			if( !this.data[j].data || !this.data[j].data.length ) continue;
			a = this.data[j].data;
			

			if( this.data[j].color ) ctx.fillStyle = this.data[j].color;
			else ctx.fillStyle = this.defaultColorScheme[j%this.defaultColorScheme.length].color;
			
			if( this.data[j].lineColor ) ctx.strokeStyle = this.data[j].lineColor;
			else ctx.strokeStyle = this.lineStyle;
		
			if( this.data[j].lineWidth != null ) ctx.lineWidth = this.data[j].lineWidth;
			else ctx.lineWidth = this.lineWidth;
		
			
			// hack #1 - for the first and the second set of data I skip lines 
			if (j > 1) {
				for( k = 0; k< kct; k++ )
				{
					ctx.beginPath();
					
					// find first point (skip nulls)
					for( i = 0; i< a.length; i++ )
					{
						if( this.maxPoints > -1 && this.maxPoints <= i ) break;
						
						if( null != a[i] )
						{
							x = this.margins[1] + space * ( i + .5 );
							if( kct == 1 || k )
							{
								ctx.moveTo( x, h - this.margins[2] - ( scale * ( a[i] - min )));
							}
							else
							{
								ctx.moveTo( x, h - this.margins[2] );
								ctx.lineTo( x, h - this.margins[2] - ( scale * ( a[i] - min )));
							}
													
							break;
						}
					}
						
					// now draw the rest of the points (skipping nulls)
					for( ++i; i< a.length; i++ )
					{
						if( this.maxPoints > -1 && this.maxPoints <= i ) break;

						if( null != a[i] )
						{
							x = this.margins[1] + space * ( i + .5 );
							ctx.lineTo( x, h - this.margins[2] - ( scale * ( a[i] - min )));

	/*
								pop = ctx.fillStyle;
								ctx.fillStyle = "black";
								y = h - this.margins[2] - ( scale * ( a[i] - min ));
								ctx.fillRect(x, y, 10, 10);
								ctx.fillStyle = pop;
								*/

						}
					}
						
					if( kct == 1 || k )
					{
						// ctx.lineTo( x, h - yMargin );
					}
					else
					{
						ctx.lineTo( x, h - this.margins[2] );
					}
					
					if( kct == 1 || k ) ctx.stroke();
					else ctx.fill();
				}
			}

			// hack #2 - only for the first and the second set of points I want MARKER_CIRCLE
			if(j < 2 && this.markerStyle)
			{
				ctx.fillStyle = ctx.strokeStyle; // "#333" ;
				ctx.strokeStyle = "#eee";
				ctx.lineWidth = 1;
				
				for( i = 0; i< a.length; i++ )
				{
					if( this.maxPoints > -1 && this.maxPoints <= i ) break;
					if( null != a[i] )
					{					
						x = this.margins[1] + space * ( i + .5 );
						y = h - this.margins[2] - ( scale * ( a[i] - min ));
						
						switch( this.markerStyle )
						{
						case this.MARKER_CIRCLE:
							// hack #3 - no point for -1
							if (a[i] > -1) {
								ctx.beginPath();
								// hack #4 - size 4 for the first one
								ctx.arc( x, y, j == 0 ? 3 : 2, 0, Math.PI * 2, false );
								ctx.fill();
								// hack #5 - looks better for me without those 3 lines
							//	ctx.beginPath();
							//	ctx.arc( x, y, 4, 0, Math.PI * 2, false );
							//	ctx.stroke();
							}
							break;
						case this.MARKER_DIAMOND:
							ctx.beginPath();
							ctx.moveTo( x - 4, y );
							ctx.lineTo( x, y - 4 );
							ctx.lineTo( x + 4, y );
							ctx.lineTo( x, y + 4 );
							ctx.fill();
							ctx.beginPath();
							ctx.moveTo( x - 4, y );
							ctx.lineTo( x, y - 4 );
							ctx.lineTo( x + 4, y );
							ctx.lineTo( x, y + 4 );
							ctx.stroke();
							break;
						case this.MARKER_TRIANGLE:
							ctx.beginPath();
							ctx.moveTo( x, y - 5 );
							ctx.lineTo( x - 4, y + 3 );
							ctx.lineTo( x + 4, y + 3 );
							ctx.closePath();
							ctx.fill();
							ctx.beginPath();
							ctx.moveTo( x, y - 5 );
							ctx.lineTo( x - 4, y + 3 );
							ctx.lineTo( x + 4, y + 3 );
							ctx.closePath();
							ctx.stroke();
							break;
						default:
							ctx.fillRect( x - 3, y - 3, 6, 6 );
							ctx.strokeRect( x - 3, y - 3, 6, 6 );
							break;
						}
					}
				}
			}
		}
		
		// axis style?

		y = Math.floor( min / scaleUnit ) * scaleUnit;

		// locate on the screen so we can place labels
		this.find_canvas_position( canvas );

		while( 1 )
		{
			if( y > max ) break;
			if( y >= min )
			{				
				ctx.lineWidth = 0.5;
				ctx.strokeStyle = "rgba( 128, 128, 128, 0.25 )";
				
				if( y == 0 )
				{
					ctx.lineWidth = 1;
					ctx.strokeStyle = "rgb( 0, 0, 0 )";
				}
				
				ctx.beginPath();
				ctx.moveTo( this.margins[1], h - this.margins[2] - ( ( y - min ) * scale ));
				ctx.lineTo( w - this.margins[3], h - this.margins[2] - ( ( y - min ) * scale ));
				ctx.stroke();
				
				if( !this.hideLabels && ( this.chartStyle & this.STYLE_VALUE_LABELS ))
				{
										
					var t = new String();
					var o = canvas.ownerDocument.createElement( "div" );
					o.className = "TSChartLib_LineChartLabel";
						
					// required attributes
					o.style.position = "absolute";
					o.style.textAlign = "right";
					o.style.left = ( this.canvasLeft - 200 + this.margins[1] - 2 ) + "px";
					o.style.width = "200px";
					o.style.top = ( this.canvasTop + h - this.margins[2] - ( ( y - min )* scale ) ) + "px";
						
					// hack, no values in '1.2000000002999...' style
					if (Math.round(y) != y)
						t = y.toPrecision(2);
					else
						t = y;

					o.innerHTML = t;

					this.labels.push( o );
					canvas.parentNode.appendChild( o );
						
					// shift
					o.style.top = ( this.canvasTop + h - this.margins[2] - ( ( y - min ) * scale ) - ( o.offsetHeight / 2 )) + "px";
				}
			}
			y += scaleUnit ;
		}

		ctx.lineWidth = 0.5;
		ctx.strokeStyle = "rgba( 128, 128, 128, 0.75 )";
		ctx.beginPath();
				
		for( i = 0; i< ct; i++ )
		{
			x = this.margins[1] + ( space * ( i + 0.5 ));
			y = h - this.margins[2] ; //  - ( min * scale );
			ctx.moveTo( x, y );
			ctx.lineTo( x, y + 5 );
			
			if( this.axisLabels && this.axisLabels[i] && !this.hideLabels )
			{
				// ctx.strokeStyle = "rgb( 0, 0, 0 )";
				
				var o = canvas.ownerDocument.createElement( "div" );
				o.className = "TSChartLib_LineChartLabel";
					
				// required attributes
				o.style.position = "absolute";
				o.style.left = this.canvasLeft + ( x ) + "px";
				o.style.top = this.canvasTop + ( y + 5 ) + "px";
					
				o.innerHTML = this.axisLabels[i];
				this.labels.push( o );
				canvas.parentNode.appendChild( o );
				
				// shift
				o.style.left = ( this.canvasLeft + x - ( o.offsetWidth / 2 )) + "px";
			}
		}
		ctx.stroke();
		
		ctx.restore();
		
	};
	
	this.animate = function( canvas, type )
	{
		var p = this;
		this.maxPoints = 0;
		this.hideLabels = true;
		//this.maxSets = 1;
		this.render( canvas );
		setTimeout( function(){ p.next_step( canvas, type ); }, 20 );
	};
	
	this.next_step = function( canvas, type )
	{
		var p = this;
		this.maxPoints++;
		if( this.maxPoints >= this.dataCount )
		{
			this.hideLabels = false;
		}
		this.render( canvas );
		if( this.maxPoints < this.dataCount )
		{
			setTimeout( function(){ p.next_step( canvas, type ); }, 20 );
		}
		else if( this.maxSets >= 0 && this.maxSets < this.data.length )
		{
			this.maxPoints = 0;
			this.maxSets++;
			setTimeout( function(){ p.next_step( canvas, type ); }, 20 );
		}
	};
	
	// inheritance
	this.base = new TSChartLib_AbstractChart();
	for( var i in this.base ) if( !this[i] ) this[i] = this.base[i];
	
}

/**
 * Bar chart type, extends AbstractChart
 */
function TSChartLib_BarChart()
{
	// defaults for type 

	this.lineStyle = "#333";
	this.lineWidth = "1";

	// animation fields
	
	this.barScale = 1.0;
	this.depthScale = 1.0;
	
	/**
	 * draw the chart.
	 */
	this.render = function( canvas )
	{
		if( this.data.length <= 0 )
		{
			throw "No data for chart";
			return;
		}
				
		var a, i, j, k, x, y, w, h, s, ct;
		var cx = 0, cy = 0;
		var ctx = canvas.getContext("2d");
		var barSize = 1;
		var max = null, min = null, range = 0, scale = 0, scaleUnit = 1, zero = 0;
		var space, shift = 0, depth = 0;
		
		this.resetLabels();
		
		w = canvas.offsetWidth;
		h = canvas.offsetHeight;
		
		// prep canvas
		ctx.save();
		ctx.clearRect( 0, 0, w, h );
				
		// figure out range, scale
		ct = 0;
		for( i = 0; i< this.data.length; i++ )
		{
			a = this.data[i].data;
			if( a )
			{
				if( a.length > ct ) ct = a.length;
				for( j = 0; j< a.length; j++ )
				{
					if( a[j] != null )
					{
						if( null == max || a[j] > max ) max = a[j];
						if( null == min || a[j] < min ) min = a[j];
					}
				}
			}
		}
		if( min > 0 ) min = 0;
		
		// pad a bit
		range = ( max - min );
		max += (range * .05);
		if( min < 0 ) min -= ( range * .05 );
		range = ( max - min );
		
		// bad data?
		if( range <= 0 )
		{
			throw "Invalid data.";
			return;
		}
		
		scale = (( w - ( this.margins[1] + this.margins[3] )) / range );
		zero = this.margins[1] - ( scale * min );
		
		scaleUnit = 1;
		if( range >= 10 )
		{
			while( range / scaleUnit > 8 ) scaleUnit *= 10;
			if( range / scaleUnit < 4 ) scaleUnit *= .5;
			if( range / scaleUnit < 4 ) scaleUnit *= .5;
		}
		else // very small?
		{
			while( range / scaleUnit < 8 ) scaleUnit /= 10;
			if( range / scaleUnit > 4 ) scaleUnit /= .5;
			if( range / scaleUnit > 4 ) scaleUnit /= .5;
		}
		
		spacer = ( h - ( this.margins[0] + this.margins[2] )) / ct;
		barsize = ( spacer * .6 ) / this.data.length;
		
		depth = barsize / 2.5;
		
		// draw scale lines

		// locate on the screen so we can place labels
		this.find_canvas_position( canvas );

		// scale style?

		ctx.lineWidth = 0.5;
		ctx.strokeStyle = "rgba( 128, 128, 128, 1 )";

		x = Math.floor( min / scaleUnit ) * scaleUnit;
		ctx.beginPath();

		while( 1 )
		{
			if( x > max ) break;
			if( x >= min )
			{				
				ctx.moveTo( this.margins[1] + ( x - min ) * scale, this.margins[0] );
				ctx.lineTo( this.margins[1] + ( x - min ) * scale, h - this.margins[2] );
				
				// labels?
				
				if( !this.hideLabels && ( this.chartStyle & this.STYLE_VALUE_LABELS ))
				{
										
					var t = new String();
					var o = canvas.ownerDocument.createElement( "div" );
					o.className = "TSChartLib_BarChartLabel";
						
					// required attributes
					o.style.position = "absolute";
					o.style.textAlign = "right";
					o.style.left = ( this.canvasLeft + this.margins[1] + ( x - min ) * scale ) + "px";
					o.style.top = ( this.canvasTop + h - this.margins[2] ) + "px";
						
					// format?
					t = x;
					
					o.innerHTML = t;
					this.labels.push( o );
					canvas.parentNode.appendChild( o );
					
					// shift
					o.style.left = ( this.canvasLeft + this.margins[1] - ( o.offsetWidth / 2 ) + ( x - min ) * scale ) + "px";

				}
				
			}
			x += scaleUnit;
		}

		ctx.stroke();

		// style
		
		ctx.lineWidth = this.lineWidth;
		ctx.strokeStyle = this.lineStyle;
		ctx.fillStyle = this.fillStyle;
		
		// draw the bars.  draw negatives first; then the
		// axis, then  positives (this lets us draw the 3d
		// axis on top of the negative bars)
		
		for( i = 0; i< this.data.length; i++ )
		{
			a = this.data[i].data;
			if( a )
			{
				for( j = 0; j< a.length; j++ )
				{
					if( a[j] < 0 ) this.drawBar( i, j, a[j], ctx, zero, scale, barsize, spacer, depth );
				}
			}
		}
		
		// axis
		if( min < 0 )
		{
			ctx.fillStyle = "#f8f8f8";
			if( this.chartStyle & this.STYLE_3D )
			{
				var df = ( -depth * this.depthScale );
				for( k = 0; k< 2; k++ )
				{
					ctx.beginPath();
					ctx.moveTo( zero, 10 );
					ctx.lineTo( zero, h - 10 );
					ctx.lineTo( df + zero, df + h - this.margins[2] );
					ctx.lineTo( df + zero, df + this.margins[0] );
					ctx.closePath();
					if( k ) ctx.stroke();
					else ctx.fill();
				}
			}
			else
			{
				ctx.beginPath();
				ctx.moveTo( zero, this.margins[0] );
				ctx.lineTo( zero, h - this.margins[2] );
				ctx.stroke();
			}
		}
		
		// positives
		
		for( i = 0; i< this.data.length; i++ )
		{
			a = this.data[i].data;
			if( a )
			{
				for( j = 0; j< a.length; j++ )
				{
					if( a[j] >= 0 ) this.drawBar( i, j, a[j], ctx, zero, scale, barsize, spacer, depth );
				}
			}
		}		

		// axis labels?
		
		if( this.axisLabels && !this.hideLabels )
		{
			for( i = 0; i< this.axisLabels.length; i++ )
			{
				if( this.axisLabels[i] )
				{
					// find max value at this point
					v = 0;
					for( j = 0; j< this.data.length; j++ )
					{
						if( this.data[j].data && this.data[j].data[i] && this.data[j].data[i] > v ) v = this.data[j].data[i] ;
					}
					
					var t = new String();
					var o = canvas.ownerDocument.createElement( "div" );
					o.className = "TSChartLib_BarChartLabel";
						
					// required attributes
					o.style.position = "absolute";
					o.style.textAlign = "right";
					o.style.left = ( 5 + this.canvasLeft + this.margins[1] + ( v - min ) * scale ) + "px";
					o.style.top = ( this.canvasTop + this.margins[0] + spacer * i ) + "px";
						
					o.innerHTML = this.axisLabels[i];
					this.labels.push( o );
					canvas.parentNode.appendChild( o );
					
					// shift
					o.style.top = ( this.canvasTop + this.margins[0] + spacer * i + (( spacer - o.offsetHeight )/2) - 2) + "px";
					
				}
			}
		}
		
		ctx.restore();
		
	};

	this.drawBar = function( i, j, val, ctx, zero, scale, barsize, spacer, depth )
	{
		var v, x, y;
		var df = -depth * this.depthScale;
		
		if( !(this.chartStyle & this.STYLE_3D )) df = 0;
		
		// default stroke
		ctx.strokeStyle = this.lineStyle;
			
		v = val * this.barScale;
		y = df + this.margins[0] + spacer * j + ( spacer - ( barsize * this.data.length ))/2 + ( barsize * i );

		if( v < 0 )
		{
			x = df + zero + ( v * scale );

			if( this.chartStyle & this.STYLE_3D )
			{
				if( this.data[i].shadowColor ) ctx.fillStyle = this.data[i].shadowColor ;
				else ctx.fillStyle = this.defaultColorScheme[i%this.defaultColorScheme.length].shadowColor;
				
				// bar 
				for( k = 0; k< 2; k++ )
				{
					ctx.beginPath();
					ctx.moveTo( x, y + barsize );
					ctx.lineTo( x - df, y - df + barsize );
					ctx.lineTo( zero, y - df + barsize );
					ctx.lineTo( zero, y + barsize );
					if( k ) ctx.stroke();
					else ctx.fill();
				}
			}
				
			// specific parameters?
			if( this.data[i].color ) ctx.fillStyle = this.data[i].color;
			else ctx.fillStyle = this.defaultColorScheme[i%this.defaultColorScheme.length].color;
						
			ctx.fillRect( x, y, -v * scale , barsize );
			ctx.strokeRect( x, y, -v * scale , barsize );
			
		}
		else
		{
			x = df + zero;
			
			if( this.chartStyle & this.STYLE_3D )
			{
				// shadow
				
				if( this.data[i].shadowColor ) ctx.fillStyle = this.data[i].shadowColor ;
				else ctx.fillStyle = this.defaultColorScheme[i%this.defaultColorScheme.length].shadowColor;
			
				// fill separately, stroke once
			
				// bar 
				ctx.beginPath();
				ctx.moveTo( x, y + barsize );
				ctx.lineTo( x - df, y + barsize - df );
				ctx.lineTo( x - df + v * scale, y + barsize - df );
				ctx.lineTo( x + v * scale, y + barsize );
				ctx.fill();
				
				// cap
				ctx.beginPath();
				ctx.moveTo( x + v * scale, y + barsize );
				ctx.lineTo( x - df + v * scale, y + barsize - df );
				ctx.lineTo( x - df + v * scale, y - df );
				ctx.lineTo( x + v * scale, y );
				ctx.fill();
				
				// line
				ctx.beginPath();
				ctx.moveTo( x, y + barsize );
				ctx.lineTo( x - df, y + barsize - df );
				ctx.lineTo( x - df + v * scale, y + barsize - df );
				ctx.lineTo( x + v * scale, y + barsize );
				ctx.moveTo( x + v * scale, y );
				ctx.lineTo( x - df + v * scale, y - df );
				ctx.lineTo( x - df + v * scale, y + barsize - df );
				ctx.stroke();
				
			}
				
			// specific parameters?
			if( this.data[i].color ) ctx.fillStyle = this.data[i].color;
			else ctx.fillStyle = this.defaultColorScheme[i%this.defaultColorScheme.length].color;
		
			ctx.fillRect( x, y , v * scale , barsize );
			ctx.strokeRect(  x, y, v * scale , barsize );
			
		}

	};
	
	 	
	this.animate = function( canvas, type )
	{
		var p = this;
		if( !type ) type = 0;
		
		switch( type )
		{
		case 1:
			this.depthScale = 0;
			break;
		case 2:
			this.depthScale = 0;
			this.barScale = 0;
			break;
		default:
			this.barScale = 0;
			break;
		}
		this.render( canvas );
		setTimeout( function(){ p.next_step( canvas, type ); }, 20 );
	};
		
	this.next_step = function( canvas, type )
	{
		var p = this;
		if( !type ) type = 0;
		switch( type )
		{
		case 1:
			this.depthScale += 0.25;
			break;
		case 2:
			this.barScale += .25;
			this.depthScale += 0.25;
			break;
		default:
			this.barScale += .25;
			break;
		}
		if( this.barScale > 1.0 ) this.barScale = 1.0;
		if( this.depthScale > 1.0 ) this.depthScale = 1.0;
		this.render( canvas );
		if( this.barScale < 1.0 || this.depthScale < 1.0 )
		{
			setTimeout( function(){ p.next_step( canvas, type ); }, 20 );
		}
	};
	 
	
	// inheritance
	this.base = new TSChartLib_AbstractChart();
	for( var i in this.base ) if( !this[i] ) this[i] = this.base[i];
}


/**
 * Pie chart type, extends AbstractChart
 */
function TSChartLib_PieChart()
{
	// type-specific fields
	
	this.rotateBy = 0;
	this.skewFactor = .25;
	
	// animation flags
	
	this.hideLabels = false;
	this.maxSlices = -1;
	
	// defaults for type (fat lines, white)

	this.lineStyle = "#fff";
	this.lineWidth = "2";

	/**
	 * reset chart data
	 */
	this.reset = function()
	{
		// local 
		this.rotateBy = 0;
		
		// call base class
		this.base.reset();
	};
	
	/**
	 * draw the chart.
	 */
	this.render = function( canvas )
	{
		if( this.data.length <= 0 )
		{
			throw "No data for chart";
			return;
		}
				
		var i, total = 0, startAngle = -90 + this.rotateBy, endAngle = 0;
		var a, i, j, k, x, y, w, h, s, radius;
		var cx = 0, cy = 0;
		var ctx = canvas.getContext("2d");
		
		var y_skew = 1;
		var y_offset = 0;
		
		this.resetLabels();
		
		w = canvas.offsetWidth;
		h = canvas.offsetHeight;
		
		// make sure it'll fit in the box
		s = Math.min( w, h );
		radius = s * .45;

		// prep canvas
		ctx.save();
		ctx.clearRect( 0, 0, w, h );
		ctx.translate( w * .50, h * .50 );

		if( this.chartStyle & this.STYLE_3D )
		{
			y_skew = 1 - this.skewFactor;
			y_offset = ( 1 - y_skew ) * radius;
			ctx.scale( 1, y_skew );
			ctx.translate( 0, -y_offset );
		}
				
		// style
		ctx.lineWidth = this.lineWidth;
		ctx.strokeStyle = this.lineStyle;
		ctx.fillStyle = this.fillStyle;
		
		// figure out the bits
		for( i = 0; i< this.data.length; i++ )
		{
			if( this.data[i].value > 0 ) total += this.data[i].value;
		}
		
		// locate on the screen so we can place labels
		this.find_canvas_position( canvas );
							
		// and draw them
		for( i = 0; i< this.data.length && ( this.maxSlices == -1 || i < this.maxSlices ); i++ )
		{
			if( this.data[i].value > 0 ) 
			{
					
				// find the end angle for this slice.  note that we're rounding;
				// this may turn out to be impractical for very small slices...
				endAngle = Math.round( startAngle + ( 360 * ( this.data[i].value / total )));
				
				// fancy chart style.  
				if( ( this.chartStyle & this.STYLE_3D ) && ( startAngle >= -90 && startAngle < 180 && endAngle > 0 ))
				{
					
					// specific parameters?
					if( this.data[i].shadowColor ) ctx.fillStyle = this.data[i].shadowColor;
					else ctx.fillStyle = this.defaultColorScheme[i%this.defaultColorScheme.length].shadowColor;
					
					// default stroke
					ctx.strokeStyle = this.lineStyle;				
					
					// this is a little funky because of how arcs work in IE
					// (they don't seem to move the path point).  we have to
					// fudge just a bit...
					
					for( k = 0; k< 2; k++ )
					{
						if (/MSIE/.test(navigator.userAgent) && !window.opera)
						{
							ctx.beginPath();
							a = Math.max( startAngle, 0 ) * Math.PI / 180;
							ctx.moveTo( radius * Math.cos( a ), radius * Math.sin( a ) + y_offset);
							ctx.arc( cx, cy + y_offset, radius,
									Math.min( endAngle, 180 ) * Math.PI / 180,
									Math.max( startAngle, 0 ) * Math.PI / 180,
									true );
							a = Math.max( startAngle, 0 ) * Math.PI / 180;
							ctx.lineTo( radius * Math.cos( a ), radius * Math.sin( a ) );
							a = Math.min( endAngle, 180 ) * Math.PI / 180;
							ctx.lineTo( radius * Math.cos( a ), radius * Math.sin( a ) );
						}
						else
						{
							ctx.beginPath();
							a = Math.max( startAngle, 0 ) * Math.PI / 180;
							ctx.arc( cx, cy + y_offset, radius,
									Math.min( endAngle, 180 ) * Math.PI / 180,
									Math.max( startAngle, 0 ) * Math.PI / 180,
									true );
							ctx.arc( cx, cy + 0, radius,
									Math.max( startAngle, 0 ) * Math.PI / 180,
									Math.min( endAngle, 180 ) * Math.PI / 180,
									false );
						}
						if( k ) ctx.stroke();
						else ctx.fill();
					}
				}
	
				// specific parameters?
				if( this.data[i].color ) ctx.fillStyle = this.data[i].color;
				else ctx.fillStyle = this.defaultColorScheme[i%this.defaultColorScheme.length].color;
				
				// default stroke
				ctx.strokeStyle = this.lineStyle;
				
				// render the slice
				for( k = 0; k< 2; k++ )
				{
					ctx.beginPath();
	
					// IE prefers arc method...				
					ctx.arc( cx, cy, radius, startAngle * Math.PI / 180, endAngle * Math.PI / 180, false);
					ctx.lineTo( cx, cy);		
					
					ctx.closePath();
					if( k ) ctx.stroke();
					else ctx.fill();
				}
				
				// labels
				if( !this.hideLabels && ( this.data[i].label || this.chartStyle & this.STYLE_PERCENT ))
				{
					
					var o = canvas.ownerDocument.createElement( "div" );
					var t = "";
					
					a = ( startAngle + (( endAngle - startAngle ) /2 )) ;
					
					// x and y offsets are relative to a centered origin...
					if( this.chartStyle & this.STYLE_3D )
					{
						x = s/2 * Math.cos( a * Math.PI / 180 );
						
						// bottom-half: this is a bit coarse...
						if( a > 15 && a < 165 )
						{
							y = y_offset + (y_skew * s/2 * Math.sin( a * Math.PI / 180 )) - ( y_offset * 5/2 );
						}
						else y = y_offset + (y_skew * s/2 * Math.sin( a * Math.PI / 180 )) - ( y_offset * 3/2 );
					}
					else
					{
						x = s/2 * Math.cos( a * Math.PI / 180 );
						y = s/2 * Math.sin( a * Math.PI / 180 );
					}
					
					// configurable style
					o.className = "TSChartLib_PieChartLabel";
					
					// required attributes
					o.style.position = "absolute";
					o.style.left = this.canvasLeft + ( w/2 + x ) + "px";
					o.style.top = this.canvasTop + ( h/2 + y ) + "px";
					
					if( this.data[i].label ) t += this.data[i].label;
					if( this.chartStyle & this.STYLE_PERCENT )
					{
						if( this.data[i].label ) t += ": ";
						t += Math.round( this.data[i].value / total * 100 ) + "%";
					}
					
					o.innerHTML = t ;
					this.labels.push( o );
					canvas.parentNode.appendChild( o );
					
					// correct for sizes, screen...
	
					x = ( this.canvasLeft + ( w/2 + x ) - ( o.offsetWidth / 2 ));
					y = ( this.canvasTop + ( h/2 + y ) - ( o.offsetHeight / 2 ));
					
					if( x < 0 ) x = 0; 
													
					o.style.left = x + "px"; 
					o.style.top = y + "px"; 
					
				}
				
				startAngle = endAngle;
			
			}
		}
		ctx.restore();
	};
	
	/**
	 * animate.  this can be extended with different values for
	 * type, which is an integer flag.
	 */
	this.animate = function( canvas, type )
	{
		var p = this;
		if( !type ) type = 0;
		switch( type )
		{
		case 1: // this is the "rising 3d" type

			if( ! this.chartStyle & this.STYLE_3D )
			{
				this.render( canvas );
				return;
			}
			// set starting point
			this.hideLabels = true;
			this.skewFactor = 0;
			this.render( canvas );
			
			// start loop
			setTimeout( function(){ p.next_step( canvas, type ); }, 10 );
			
			break;
		
		case 2: // this is a combined type (notice the cascade)

			this.skewFactor = 0;
			if( !this.chartStyle & this.STYLE_3D ) type = 0;

		default: // step through slices...
		
			this.hideLabels = true;
			this.maxSlices = 0;
			setTimeout( function(){ p.next_step( canvas, type ); }, 250 );
			break;
		}		
	};
	
	/**
	 * callback method for the animation loop
	 */
	this.next_step = function( canvas, type )
	{
		if( !type ) type = 0;
		var p = this;
			
		switch( type )
		{
		case 1:

			this.skewFactor += 0.05;
			if( this.skewFactor >= 0.3 )
			{
				this.skewFactor = 0.3;
				this.hideLabels = false;
			}
			
			this.render( canvas );
			if( this.skewFactor < 0.3 ) setTimeout( function(){ p.next_step( canvas, type ); }, 10 );
			
			break;
		
		default:
			
			this.maxSlices++;
			if( this.maxSlices >= this.data.length )
			{
				if( type == 2 ) type = 1;
				else this.hideLabels = false;
			}
			this.render( canvas );
			if( this.maxSlices < this.data.length )
				setTimeout( function(){ p.next_step( canvas, type ); }, 250 );
			else if( type == 1 ) // switch to the other animation
				setTimeout( function(){ p.next_step( canvas, type ); }, 10 );
			
		}

	};
	
	// inheritance
	this.base = new TSChartLib_AbstractChart();
	for( var i in this.base ) if( !this[i] ) this[i] = this.base[i];

}

