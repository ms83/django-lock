from django.db import connection
from django.db import models
    
class Lock(models.Model): 
    key = models.CharField(primary_key=True, max_length=25, unique=True)
                
    def __enter__(self):
        self.cursor = connection.cursor()
                    
        self.cursor.execute("SELECT count(*) FROM {} where `key`='{}'".format(self._meta.db_table, self.key))
        if not self.cursor.fetchone()[0]: 
            self.cursor.execute("REPLACE INTO {} (`key`) values('{}')".format(self._meta.db_table, self.key))
            self.cursor.execute("COMMIT")
            
        self.cursor.execute("BEGIN")
        self.cursor.execute("SELECT * FROM {} WHERE `key`='{}' FOR UPDATE".format(self._meta.db_table, self.key))
        
    def __exit__(self, type, value, traceback):
        self.cursor.execute("COMMIT")


"""
Usage:

with Lock(key=key):
    # do stuff

"""

