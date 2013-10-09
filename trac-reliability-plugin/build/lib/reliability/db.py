import time
import random
import datetime

def get_ticket_data(db):
	"""
	Zwraca czas i wersje ticketow
	"""
	cursor = db.cursor()

	type = ['defect', 'bugs', 'bug report', 'bug']
	typeSql = ""
	for x in type:
		typeSql += "type='%s' or " % x

	resolution = ['wontfix', 'worksforme', 'invalid', 'duplicate', \
				'wont fix', 'works for me', 'rejected']
	resolutionSql = ""
	for x in resolution:
		resolutionSql += "resolution!='%s' and " % x

	SQL = "select time, version from ticket where (%s) and (%s)" % \
			(typeSql[0:len(typeSql) - 4], \
			resolutionSql[0:len(resolutionSql) - 5])


	print SQL
			
	try:
		cursor.execute(SQL)
		return cursor.fetchall()
	except:
		return None


def csvColumns(fileName):
	"""
	Parsowanie pierwszej linii 
	__color__,__group__,__style__,ticket,summary,component,status,resolution,version,type,priority,owner,modified,_time,_reporter

	Zwraca slownik. Klucz to label, wartosc to numer kolumny.
	"""
	f = open(fileName)
	line = f.readline()
	f.close()

	cols = line.replace("\r", "")
	cols = cols.replace("\n", "")
	cols = cols.split(",")
	keys = {}
	for i in range(0, len(cols)):
		a = cols[i]
		if a in ["__group__", "__color__", "__style__"]:
			continue

		a = a.replace('_', '')

		if a in ["created"]:
			a = "time"

		if a == "modified":
			a = "changetime"

		if a == "ticket":
			a = "id"

		keys[a] = i

	print keys
	return keys


def csvEscape(_value):
	value = _value
	value = value.replace("'", "X")
	value = value.replace("\r", "")
	value = value.replace("\n", "")
	value = value.replace("{", "a")
	value = value.replace("}", "b")
	value = value.replace("|", "c")
	value = value.replace("\\", "d")
	value = value.replace("/", "e")
	value = value.replace("..", "f")
	value = value.lower()
	return value


def dataFromCsv(db, fileName):
	print 'opening %s ...' % fileName

	# usuwa wszystko z bazy danych
	cursor = db.cursor()
	q = "delete from ticket"	 
	cursor.execute(q)

	# nazwy kolumn
	columns = csvColumns(fileName)

	# slownik list gdzie zapisuje unikalne wartosci
	distinct = {}
	for x in columns:
		distinct[x] = []

	flag = 1
	for x in open(fileName):
		if flag == 1:
			flag = 0
			continue

		items = x.split(",")

		for i in range(0, len(items)):
			items[i] = csvEscape(items[i])

		q = """insert into ticket ("""
		w = ""
		for a in columns:
			w += a + ", "

			if items[columns[a]] not in distinct[a]:
				distinct[a].append(items[columns[a]])

		#skasuj ostatni przecinek
		q += w[0:len(w)-2]

		q += ") values ("
		w = ""
		for a in columns:
			val = items[columns[a]]
			if a in ["id", "time", "changetime"]:
				w += val
			else:
				w += "'" + val + "'"

			w += ", "

		#skasuj ostatni przecinek
		q += w[0:len(w)-2]
		q += ")"

		#print q
		cursor.execute(q)

	print '\nDISTINCT VALUES:'
	debug = ['status', 'resolution', 'version', 'type']
	for x in debug:
		print x, distinct[x], '\n'

	# bez commit nie robi insert. mimo ze jest wyjatek to dziala
	try:
		cursor.execute("commit")
	except:
		pass


