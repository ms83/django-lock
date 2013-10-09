
<?cs include "header.cs" ?>
<?cs include "macros.cs" ?>

<link rel="stylesheet" type="text/css" href="<?cs var:chrome.href ?>/hw/css/reliability.css">
<link rel="stylesheet" type="text/css" href="<?cs var:chrome.href ?>/hw/css/scale.css">
<script type="text/javascript" src="<?cs var:chrome.href ?>/hw/js/TSChartLib.js"></script>
<script type="text/javascript" src="<?cs var:chrome.href ?>/hw/js/models.js"></script>
<script type="text/javascript" src="<?cs var:chrome.href ?>/hw/js/scale.js"></script>

<div id="content" class="quality">
<!--img src="<?cs var:chrome.href ?>/hw/images/don.jpg" /-->
</div>

<form name="Form" action="<?cs var:script_path ?>" method="post">

<input type="hidden" name="black1" value="<?cs var:black1?>">
<input type="hidden" name="black2" value="<?cs var:black2?>">

<input type="hidden" name="red1" value="<?cs var:red1?>">
<input type="hidden" name="red2" value="<?cs var:red2?>">

<input type="hidden" name="scale_beg_year" value="<?cs var:scale_beg_year?>">
<input type="hidden" name="scale_end_year" value="<?cs var:scale_end_year?>">

<input type="hidden" name="scale_beg_month" value="<?cs var:scale_beg_month?>">
<input type="hidden" name="scale_end_month" value="<?cs var:scale_end_month?>">

<input type="hidden" name="scale_black_beg_year" value="<?cs var:scale_black_beg_year?>">
<input type="hidden" name="scale_black_beg_month" value="<?cs var:scale_black_beg_month?>">

<input type="hidden" name="scale_black_end_year" value="<?cs var:scale_black_end_year?>">
<input type="hidden" name="scale_black_end_month" value="<?cs var:scale_black_end_month?>">

<input type="hidden" name="scale_red_beg_year" value="<?cs var:scale_red_beg_year?>">
<input type="hidden" name="scale_red_beg_month" value="<?cs var:scale_red_beg_month?>">

<input type="hidden" name="scale_red_end_year" value="<?cs var:scale_red_end_year?>">
<input type="hidden" name="scale_red_end_month" value="<?cs var:scale_red_end_month?>">

<table>
<tr>
	<td valign=top class="main_right">
		<h1>Rozkład defektów w czasie.</h1>
		Modele dopasowane do czarnych punktów.<br/><br/>
		<table cellspacing=0 class="tab">
		<tr> 
		<td class="black">Defektów:</td>
		<td class="white"><?cs var:project_defect_count ?></td>
		<td class="black">Granulacja:</td>
		<td class="white"><input type="radio" name="granulation" <?cs var:month_gr_checked ?> value="month">miesiąc</td> 
		<td class="white"><input type="radio" name="granulation" <?cs var:week_gr_checked ?> value="week">tydzień</td> 
		<td class="white"><input type="radio" name="granulation" <?cs var:gran10_gr_checked ?> value="gran10">10</td> 
		<td class="white"><input type="radio" name="granulation" <?cs var:gran20_gr_checked ?> value="gran20">20</td> 
		<td class="white"><input type="radio" name="granulation" <?cs var:gran30_gr_checked ?> value="gran30">30</td> 
		<td class="white"><input type="radio" name="granulation" <?cs var:gran40_gr_checked ?> value="gran40">40</td> 
		<td class="white"><input type="radio" name="granulation" <?cs var:gran50_gr_checked ?> value="gran50">50</td> 
		</tr>
		</table>

		<div id="models_div">&nbsp;<canvas id="models_chart" height="225" width="500" onclick="document.Form.submit();"></canvas></div>

		<table cellspacing=0 class="tab">
		<tr>
		<?cs each:tuple = model_details ?>
		<td class="<?cs var: tuple[4] ?>">
		<b><?cs var: tuple[5] ?></b>
		<input	
				type="checkbox" 
				name="<?cs var: tuple[4] ?>_md_checked" 
				<?cs var: tuple[7] ?>
		>
		<br>
		alfa=<?cs var:tuple[1] ?><br>
		beta=<?cs var:tuple[2] ?><br>
		chi-square=<?cs var:tuple[3] ?><br>
		akaike=<?cs var:tuple[6] ?><br>
		</td>
		<?cs /each ?>
		</tr>
		</table>

	</td>

</tr>
</table>

<table collspacing=0 cellpadding=0>
<tr>
	<td valign=top class="main_left">
		<h1>Ustalanie obszarów analizy.</h1>
		Obszar czarnych punktów do dopasowania modelu.<br/>
		Obszar czerwonych punktów do weryfikowania przewidywań.<br/><br/>

		<div id="scale_div"></div>
		<script type="text/javascript">scale_table_print();</script> 

		<?cs each:tuple = versions_data ?>
		<script type="text/javascript">
			scale_append_version("<?cs var: tuple[0] ?>", 
								"<?cs var: tuple[1] ?>", 
								"<?cs var: tuple[2] ?>", 
								<?cs var: tuple[3] ?>,
								<?cs var: tuple[4] ?>,
								<?cs var: tuple[5] ?>,
								<?cs var: tuple[6] ?>);
			</script>
		<?cs /each ?>

	</td>

	<!-- td valign=top align=right>
	<table cellspacing=0>
	<tr> <td class="white">Poczatek: </td><td class="black"><?cs var:project_beg ?></td> </tr>
	<tr> <td class="white">Czas trwania: </td><td class="black"><?cs var:project_delta ?></td> </tr>
	<tr> <td class="white">Defektów: </td><td class="black"><?cs var:project_defect_count ?></td> </tr>
	<tr> <td class="white">Wersji: </td><td class="black"><?cs var: len(versions_data) ?></td> </tr>
	</table>
	</td -->

</tr>
</table>

<hr>
<input type="hidden" name="selected_database_name" value="<?cs var:selected_database_name?>">
<select name="selected_database">
<?cs each:tuple = available_databases ?>
<option value="<?cs var:tuple[0]?>" <?cs var:tuple[1]?> onclick="document.Form.submit();"><?cs var:tuple[0]?></option>
<?cs /each ?>
</select>
	
</form>

<script type="text/javascript"> 

	var axis = Array();
	<?cs each:tuple = axis_data ?>
		axis.push("<?cs var:tuple ?>");
	<?cs /each ?>
	
	var black_distribution = Array();
	<?cs each:tuple = black_distribution ?>
		black_distribution.push(<?cs var:tuple ?>);
	<?cs /each ?>

	var red_distribution = Array();
	<?cs each:tuple = red_distribution ?>
		red_distribution.push(<?cs var:tuple ?>);
	<?cs /each ?>

	var weibull = Array();
	<?cs each:y = Weibull[0] ?>
		weibull.push(<?cs var:y ?>);
	<?cs /each ?>

	var exponential = Array();
	<?cs each:y = Exponential[0] ?>
		exponential.push(<?cs var:y ?>);
	<?cs /each ?>

	var gamma = Array();
	<?cs each:y = Gamma[0] ?>
		gamma.push(<?cs var:y ?>);
	<?cs /each ?>

	var logarithmic = Array();
	<?cs each:y = Logarithmic[0] ?>
		logarithmic.push(<?cs var:y ?>);
	<?cs /each ?>

	var power = Array();
	<?cs each:y = Power[0] ?>
		power.push(<?cs var:y ?>);
	<?cs /each ?>

	draw_chart("models_chart", axis, black_distribution, red_distribution, weibull, exponential, gamma, logarithmic, power);
</script>


<br>

<?cs include "footer.cs" ?>

