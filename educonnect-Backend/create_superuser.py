from apps.databaseModels.models import AuthUsuario

if not AuthUsuario.objects.filter(username='admin').exists():
    user = AuthUsuario.objects.create_superuser('admin', 'admin@test.com', 'admin123')
    print('✓ Superuser created successfully!')
    print(f'  Username: admin')
    print(f'  Email: admin@test.com')
    print(f'  Password: admin123')
else:
    print('✓ Superuser already exists')
