
from setuptools import setup

PACKAGE = 'TracReliabilityPlugin'
VERSION = '0.1'

setup(name=PACKAGE,
	version=VERSION,
	packages=['reliability'],
	entry_points={'trac.plugins': '%s = reliability' % PACKAGE},
	package_data={'reliability': ['templates/*',
				'*.py',
				'htdocs/images/*',
				'htdocs/css/*',
				'htdocs/js/*.js']},
)

