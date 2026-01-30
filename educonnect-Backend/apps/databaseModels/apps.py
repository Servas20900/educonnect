from django.apps import AppConfig

class DatabasemodelsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.databaseModels'
    label = 'databaseModels' 

>>>>>>> 3daec9997c053b23e151a64b5c15781e53491c11
    def ready(self):
        import apps.databaseModels.signals