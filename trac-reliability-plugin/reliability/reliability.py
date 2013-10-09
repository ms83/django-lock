import random
import datetime
import time
import os

from trac.core import *
from trac.web.chrome import INavigationContributor, ITemplateProvider
from trac.web.main import IRequestHandler
from trac.util import escape, Markup

from models import *
import db

DEFAULT_GRANULATION = "gran20"
INF = -1
ONEDAY = 60*60*24
ONEMONTH = ONEDAY*30
ONEYEAR = ONEMONTH*12

def strMonth(num):
	tab = ["", "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", \
			"Lip", "Sie", "Wrz", "Paz", "Lis", "Gru" ]

	return tab[num]

def niceDate(ts):
	now = datetime.datetime.fromtimestamp(ts)
	return strMonth(now.month) + " " + str(now.year)

def yearMonthFromTs(ts):
	now = datetime.datetime.fromtimestamp(ts)
	return now.year, now.month

def yearMonthToTs01(year, month):
	return time.mktime(datetime.datetime(int(year), int(month), 1).timetuple())

def yearMonthToTs31(year, month):
	now = datetime.datetime(int(year), int(month), 1)

	if int(month) == 12:
		next = now.replace(year=int(year)+1, month=1)
	else:
		next = now.replace(year=int(year), month=int(month)+1)

	return time.mktime(next.timetuple()) - ONEDAY

class Distribution():
	def __init__(self, data, gran):

		pass

def akaike_compare(x, y):
	if x[6] == y[6]: return 0
	if y[6] == INF: return -1
	if x[6] == INF: return 1
	if x[6] > y[6]: return 1
	return -1

class QualityComponent(Component):
	implements(INavigationContributor, IRequestHandler, ITemplateProvider)

	# INavigationContributor methods
	def get_active_navigation_item(self, req):
		return 'reliability'

	def get_navigation_items(self, req):
		yield 'mainnav', 'reliability', \
			Markup('<a href="%s">Reliability</a>', self.env.href.reliability())

	# IRequestHandler methods
	def match_request(self, req):
		return req.path_info == '/reliability'

	def EVENT_csv(self, req):
		if "selected_database" in req.args and \
			req.args['selected_database_name'] != \
			req.args['selected_database']:
				return True

		return False

	def EVENT_fresh(self, req):
		if len(req.args) == 0 or self.EVENT_csv(req):
			return True

		return False

	def WWW_csv(self, req):
		# jak chce wgrac do bazy dane z pliku csv 
		if self.EVENT_csv(req):
				# wrzuc nowe wartosci
				db.dataFromCsv(self.env.get_db_cnx(), \
								req.args['selected_database'])

		# Wypelnienie formularza wyboru projektu
		basePath = "/home/marcin/tracReliabilityPlugin/csv"
		req.hdf['selected_database_name'] = basePath + "/" + \
										os.listdir(basePath)[0]

		ad = []
		for x in os.listdir(basePath):
			csv = basePath + "/" + x
			selected = ""
			if "selected_database" in req.args:
				if req.args['selected_database'] == csv:
					selected = "selected"
					# ustaw obecna nazwe 
					req.hdf['selected_database_name'] = csv

			ad.append((csv, selected))

		req.hdf['available_databases'] = ad

	def WWW_granulation(self, req):
		# Wypelnienie formularza wyboru granulacji czasu
		if not 'granulation' in req.args:
			granulation = DEFAULT_GRANULATION
		else:
			granulation = req.args['granulation'] 

		req.hdf[granulation + '_gr_checked'] = "checked"

		gr = {}
		gr['month'] = int(60*60*24*(30.5))
		gr['week'] = 60*60*24*7
		gr['gran10'] = (self.black2 - self.black1)/11
		gr['gran20'] = (self.black2 - self.black1)/21
		gr['gran30'] = (self.black2 - self.black1)/31
		gr['gran40'] = (self.black2 - self.black1)/41
		gr['gran50'] = (self.black2 - self.black1)/51

		try:
			return int(gr[granulation])
		except:
			raise Exception, "incorrect granulation"

	def WWW_scale(self, req):
		# Ustawia przedzialy [black1, black2], [red1, red2]
		if self.EVENT_fresh(req):
			black1 = self.white1
			black2 = self.white1 + \
					(self.white2 - self.white1)/2

			red1 = black2 + ONEMONTH
			red2 = self.white2

			req.hdf['scale_beg_year'], \
			req.hdf['scale_beg_month'] = \
				yearMonthFromTs(self.white1)

			req.hdf['scale_end_year'], \
			req.hdf['scale_end_month'] = \
				yearMonthFromTs(self.white2 - ONEYEAR)

			req.hdf['scale_black_beg_year'], \
			req.hdf['scale_black_beg_month'] = \
				yearMonthFromTs(black1)

			req.hdf['scale_black_end_year'], \
			req.hdf['scale_black_end_month'] = \
				yearMonthFromTs(black2)

			req.hdf['scale_red_beg_year'], \
			req.hdf['scale_red_beg_month'] = \
				yearMonthFromTs(red1)

			req.hdf['scale_red_end_year'], \
			req.hdf['scale_red_end_month'] = \
				yearMonthFromTs(red2)

			req.hdf['black1'] = black1
			req.hdf['black2'] = black2
			req.hdf['red1'] = red1
			req.hdf['red2'] = red2
		else:
			req.hdf['scale_beg_year'] =	req.args['scale_beg_year']
			req.hdf['scale_beg_month'] = req.args['scale_beg_month'] 

			req.hdf['scale_end_year'] = req.args['scale_end_year']
			req.hdf['scale_end_month'] = req.args['scale_end_month']

			req.hdf['scale_black_beg_year'] = req.args['scale_black_beg_year']
			req.hdf['scale_black_beg_month'] =  req.args['scale_black_beg_month']

			req.hdf['scale_black_end_year'] = req.args['scale_black_end_year']
			req.hdf['scale_black_end_month'] = req.args['scale_black_end_month']

			req.hdf['scale_red_beg_year'] = req.args['scale_red_beg_year']
			req.hdf['scale_red_beg_month'] = req.args['scale_red_beg_month']

			req.hdf['scale_red_end_year'] = req.args['scale_red_end_year']
			req.hdf['scale_red_end_month'] =  req.args['scale_red_end_month']

			black1 = yearMonthToTs01( \
				req.args['scale_black_beg_year'], \
				req.args['scale_black_beg_month']);

			black2 = yearMonthToTs31( \
				req.args['scale_black_end_year'], \
				req.args['scale_black_end_month']);

			red1 = yearMonthToTs01( \
				req.args['scale_red_beg_year'], \
				req.args['scale_red_beg_month']);

			red2 = yearMonthToTs31( \
				req.args['scale_red_end_year'], \
				req.args['scale_red_end_month']);

			req.hdf['black1'] = req.args['black1']
			req.hdf['black2'] = req.args['black2']

			req.hdf['red1'] = req.args['red1']
			req.hdf['red2'] = req.args['red2']

		return int(black1), int(black2), int(red1), int(red2)

	def computeDistribution(self, req):
		"""
		Zwraca 2 listy: distY, distTs
		"""
		if not self.EVENT_fresh(req):
			print 'TAK filtruje dane po wersji...'
			temp_data = []
			for x in self.white_data:
				ver = x[1]
				if ver+"_vr_checked" in req.args:
					temp_data.append(x)
			print 'PO filtrze wersji', len(temp_data)

		else:
			print 'NIE filtruje danych po wersji...'
			temp_data = self.white_data

		Y = {}
		for x in temp_data:
			X = int((x[0] - self.black1) / self.granSec) # go to the bucket
			if Y.has_key(X):
				Y[X] += 1
			else:
				Y[X] = 1

		# w slowniku Y moze nie byc wszystkich wartosci -
		# tam gdzie nie ma wpisujemy zera
		distY = []
		distTs = []
		for i in range(0, max(Y) + 1):
			distTs.append(self.black1 + i*self.granSec)

			if Y.has_key(i):
				distY.append(Y[i])
			else:
				distY.append(0)

		return distY, distTs

	def selectDistribution(self, beg, end):
		rets = 0
		ret = []
		for x in range(0, len(self.distribution)):
			try:
				if self.distTs[x] >= beg and self.distTs[x] <= end:
					ret.append(self.distribution[x])
					rets += 1
				else:
					ret.append(-1)
			except:
				ret.append(-1)

		return ret, rets

	def computeModel(self, name, data):
		"""
		Estymuje model po nazwie.
		Zwraca liste: (wyniki, alfa, beta, chi, nazwa, nazwa po polsku)
		"""
		if name == "Weibull":
			model = Weibull(data)
			namePL = "Weibull"

		elif name == "Exponential":
			model = Exponential(data)
#			namePL = "Wykładniczy (Goel-Okumoto)"
			namePL = "Wykładniczy"

		elif name == "Gamma":
			model = Gamma(data)
#			namePL = "Gamma (S-kształtny)"
			namePL = "Gamma"

		elif name == "Logarithmic":
			model = Logarithmic(data)
#			namePL = "Logarytmiczny (Musa-Okumoto)"
			namePL = "Logarytmiczny"

		elif name == "Power":
			model = Power(data)
#			namePL = "Potęgowy (Duane)"
			namePL = "Potęgowy"

		else:
			raise Exception, "Nieznany model '%s'" % name

		print "\n---\n", name, "estimating...",

		try:
			param, chi, ret, akaike = model.fit()
		except Exception, e:
			print "Wyjatek!", e
			return [None, "brak", "brak", INF, name, namePL, INF]

		# oblicza pozostale wartosci wykresu
		beg = len(ret) + 1
		end = beg + int((self.white2 - self.black2)/self.granSec) + 1
		cont = model.calculate(param, range(beg, end))
		ret.extend(cont)

		print " alfa,beta=", param,
		print " chi=", chi
		print " akaike=", akaike
		print ret

		# formatowanie
		alfa = round(param[0], 4)
		if len(param) == 2: 
			beta = round(param[1], 4) 
		else: 
			beta = ' ';		# nie ma beta w expotencjalnym
		chi = int(chi)
		akaike = round(akaike, 2)

		return [ret, alfa, beta, chi, name, namePL, akaike]

	def prepareModels(self, req):
		# estymuje modele na podstawie danych black
		details = []
		for m in ["Weibull", "Exponential", "Gamma", "Logarithmic", "Power"]:
			mod = self.computeModel(m, self.blackDistribution[:self.blackC])
			if m+"_md_checked" in req.args or self.EVENT_fresh(req):
				mod.append('checked')
				req.hdf[m] = mod
			else:
				mod.append('')
				req.hdf[m] = None	# tak robie aby nie miec wykresu

			details.append(mod)

		# Lista modeli posortowana po kryterium akaike
		details.sort(cmp=akaike_compare)
		return details

	def createAxis(self):
		LABELS = 7	# how many labels are shown on X axis
	
		ret = []
		delta = int((self.white2 - self.black1)/self.granSec)
		i = 0
		k = self.distTs[0]
		while k < self.white2:
			if not i % (delta/(LABELS-1)):
				ret.append(niceDate(k))
			else:
				ret.append("")

			k += self.granSec
			i += 1
		return ret
	
	def prepareVersions(self, req):
		vers = {}	# zliczam ilosc defektow w wersji
		vmin = {}	# zliczam minimalny czas defektu w wersji
		vmax = {}	# zliczam maksymalny czas defektu w wersji
		for x in self.white_data:
			ti = x[0]
			ver = x[1]
			if not vers.has_key(ver):
				vers[ver] = 1
				vmax[ver] = ti
				vmin[ver] = ti
			else:
				vers[ver] += 1
				if ti > vmax[ver]:
					vmax[ver] = ti
				if ti < vmin[ver]:
					vmin[ver] = ti

		ret = []
		for x in vers:
			beg = datetime.datetime.fromtimestamp(vmin[x])
			end = datetime.datetime.fromtimestamp(vmax[x])

			if x+"_vr_checked" in req.args or self.EVENT_fresh(req):
				ret.append((x, vers[x], "checked", 
							beg.year, beg.month, end.year, end.month))
			else:
				ret.append((x, vers[x], "", 
							beg.year, beg.month, end.year, end.month))

		ret.sort(reverse=True)

		return ret

	def filterBlackRed(self, req):
		# jedyne filtrowanie na razie to usuwanie ticketow z zadanych wersji.
		if not self.EVENT_fresh(req):
			# 'TAK filtruje dane po wersji...'
			temp_data = []
			for x in self.white_data:
				ver = x[1]
				if ver+"_vr_checked" in req.args:
					temp_data.append(x)

		else:
			# 'NIE filtruje danych po wersji...'
			temp_data = self.white_data

		black = []
		red = []
		for x in temp_data:
			ti = x[0]
			if ti >= self.black1 and ti <= self.black2:
				black.append(x)

			if ti >= self.red1 and ti <= self.red2:
				red.append(x)

		return black, red


	def process_request(self, req):
		print "\n\n"
		print "ZAPYTANIE:",
		for x in req.args:
			print "\t", x, "\t", req.args[x]

		# Czy wgrac do bazy tickety nowego projektu?
		self.WWW_csv(req)

		# Pobierz dane z bazy (WSZYSTKICH) - nie zmienne do konca
		self.white_data = db.get_ticket_data(self.env.get_db_cnx())

		if not self.white_data or len(self.white_data) == 0:
			return 'reliability.cs', None

		# ZAWSZE poczatek i koniec WSZYSTKICH ticketow
		y,m = yearMonthFromTs(min(self.white_data)[0])
		self.white1 = yearMonthToTs01(y, m)

		y,m = yearMonthFromTs(max(self.white_data)[0])
		self.white2 = yearMonthToTs31(y, m) + ONEYEAR

		print "BIALYCH ", len(self.white_data), "-", \
			niceDate(self.white1), self.white1, \
			"do", niceDate(self.white2), self.white2

		# Przedzialy czarnych i czerwonych punktow
		self.black1, \
		self.black2, \
		self.red1, \
		self.red2 = \
				self.WWW_scale(req)

		print "CZARNE od", \
			niceDate(self.black1), self.black1, "do", \
			niceDate(self.black2), self.black2

		print "CZERWONE od", \
			niceDate(self.red1), self.red1, "do", \
			niceDate(self.red2), self.red2

		# Pobierz zadane granulacje.
		# Granulacja bazowa to ta od punktow czerwonych.
		self.granSec = self.WWW_granulation(req)
		print "GRANULACJA ", self.granSec

		# Oblicza rozklad w [black1, white2]
		self.distribution, self.distTs = self.computeDistribution(req)

		# Oblicza rozklad w [black1, black2]
		self.blackDistribution, self.blackC \
				= self.selectDistribution(self.black1, self.black2)

		# obliczam rozklad w przedziale [red1, red2]
		self.redDistribution, self.redC = \
				 self.selectDistribution(self.red1, self.red2)

		print "WHITE DISTRIBUTION", \
				sum(self.distribution),	\
				len(self.distribution), \
				self.distribution

		print "BLACK DISTRIBUTION", \
				sum(self.blackDistribution),	\
				len(self.blackDistribution),	\
				self.blackDistribution

		print 'RED DISTRIBUTION ', \
				sum(self.redDistribution),	\
				len(self.redDistribution),	\
				self.redDistribution

		req.hdf['black_distribution'] = self.blackDistribution
		req.hdf['red_distribution'] = self.redDistribution

		# oblicz modele
		req.hdf['model_details'] = self.prepareModels(req)

		# Wersje produktu
		req.hdf['versions_data'] = self.prepareVersions(req)

		# Dane statystyczne projektu
		req.hdf['project_defect_count'] = str(sum(self.distribution))

		# Labelki na osi OX
		req.hdf['axis_data'] = self.createAxis()

		# dla ajaxa musze podac nazwe skryptu ktory ma zawolac
		# inaczej niz req.base_path + req.path_info nie umiem
		req.hdf['script_path'] = req.base_path + req.path_info 

#		print dir(self)
#		print dir(self.env)
#		print dir(req)
		
		return 'reliability.cs', None

	# ITemplateProvider methods
	def get_templates_dirs(self):
		"""
		Return a list of directories containing the provided ClearSilvertemplates.
		"""
		from pkg_resources import resource_filename
		return [resource_filename(__name__, 'templates')]

	def get_htdocs_dirs(self):
		"""Return a list of directories with static resources (such as style
		sheets, images, etc.)

		Each item in the list must be a `(prefix, abspath)` tuple. The
		`prefix` part defines the path in the URL that requests to these
		resources are prefixed with.

		The `abspath` is the absolute path to the directory containing the
		resources on the local file system.
		"""
		from pkg_resources import resource_filename
		return [('hw', resource_filename(__name__, 'htdocs'))]
