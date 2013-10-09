
function draw_chart(name, axis, blackdots, reddots, weibull, exponential, gamma, logarithmic, power)
{
	if (blackdots.length < 2) {
		return;
	}

	linechart = new TSChartLib_LineChart();
	// czarne kropki
	linechart.add_element(blackdots, null, "rgba(0, 0, 0, 0)", null, "#000", 2);
	// czerwone kropki 
	linechart.add_element(reddots, null, "rgba(0, 0, 0, 0)", null, "#f00", 2);

	linechart.add_element(weibull, null, "rgba(0, 0, 0, 0)", null, "#f00", 1);
	linechart.add_element(exponential, null, "rgba(0, 0, 0, 0)", null, "#0a0", 1);
	linechart.add_element(gamma, null, "rgba(0, 0, 0, 0)", null, "#00f", 1);
	linechart.add_element(logarithmic, null, "rgba(0, 0, 0, 0)", null, "#d06010", 1);
	linechart.add_element(power, null, "rgba(0, 0, 0, 0)", null, "#dd0099", 1);
	linechart.add_labels(axis);
	linechart.chartStyle = linechart.STYLE_FILLED | linechart.STYLE_VALUE_LABELS;
	linechart.render( document.getElementById(name));
}


