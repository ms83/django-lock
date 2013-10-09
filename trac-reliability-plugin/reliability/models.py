import math
from Numeric import exp, power
from Scientific.Functions.LeastSquares import leastSquaresFit

class Model:
	"""
	Abstract class for models.
	"""
	def __init__(self, data):
		"""
		@data - dane wejsciowe lista wartosci [10, 20, 15, 25, ..]
		"""
		# przeksztalcam wartosci y na tablice punktow [(1, y), (2, y), ...]
		if not data or len(data) == 0:
			raise Exception, "no input data"

		self.data = []
		for x in range(len(data)):
			self.data.append((x + 1, data[x]))	# +1 coz we don't want 0
		# ilosc bledow to suma wszystkich y
		self.N = sum(data)

	def akaike(self, param):
		"""
		@param - params for model
		@return - (list of values, akaike)
		"""
		RSS = 0
		ret = []
		# obliczam punkty dla ktorych szacowalem model.
		# licze RSS (residual sum of squares)
		for (x,y) in self.data:
			fx = self.func(param, x)
			ret.append(fx)
			RSS += (y - fx)**2
			
		n = len(self.data)
		akaike = 2*len(param) + n*(math.log((2*math.pi*RSS)/n) + 1)

		return ret, akaike

	def calculate(self, param, X):
		"""
		@param - params for model
		@X - list of x-es to compute models y-es
		@return - list of values
		"""
		ret = []
		for x in X:
			try:
				fx = self.func(param, x)
			except Exception, e:
				print "Wyjatek w func() ", x, e
				ret.append(0)
				continue

			ret.append(fx)

		return ret


	def fit(self):
		self.setStartParam()
		fitParam, chi = leastSquaresFit(self.func, self.startParam, self.data)
		fitData, akaike = self.akaike(fitParam)

		# wszystkie model oczekuja parametrow >= 0
		if fitParam[0] <= 0:
			raise Exception, "alfa %f mniejsza od 0! " % fitParam[0]

		if len(fitParam) > 1 and fitParam[1] <= 0:
			raise Exception, "beta %f mniejsza od 0! " % fitParam[1]

		return (fitParam, chi, fitData, akaike)


class Weibull(Model):
	def setStartParam(self):
		self.startParam = (2, 0.1)

	def func(self, param, t):
		return self.N*param[0]*param[1]*power(param[1]*t, param[0]-1)*\
		(1/exp(power(param[1]*t, param[0])))

class Exponential(Model):
	"""
	Handbook of software reliability - chapter 3 page 83
	"""
	def setStartParam(self):
		self.startParam = (0.1,)

	def func(self, param, t):
		return self.N*param[0]*(1/exp(param[0]*t))

class Gamma(Model):
	"""
	Handbook of software reliability - chapter 3 page 96
	"""
	def setStartParam(self):
		self.startParam = (2, 0.1)

	def func(self, param, t):
		return param[0]*param[1]*param[1]*t*(1/exp(param[1]*t))

class Power(Model):
	"""
	Handbook of software reliability - chapter 3 page 99
	"""
	def setStartParam(self):
		self.startParam = (2, 1.1)

	def func(self, param, t):
		return param[0]*param[1]*power(t, param[1]-1)

class Logarithmic(Model):
	"""
	Handbook of software reliability - chapter 3 page 102
	"""
	def setStartParam(self):
		self.startParam = (2, 0.1)

	def func(self, param, t):
		return param[0]/(t*param[0]*param[1] + 1)


