#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, './educonnect-Backend')
django.setup()

from django.test import Client
import json

client = Client()

# 1. Login
print("=" * 60)
print("VALIDACIÓN: SISTEMA EDUCONNECT DE-HARDCODING")
print("=" * 60)

print("\n1️⃣ Testing Login...")
response = client.post('/api/auth/login/', 
    data=json.dumps({'username': 'admin', 'password': 'admin123'}),
    content_type='application/json')

if response.status_code == 200:
    data = json.loads(response.content)
    token = data.get('token')
    print(f"✅ Login exitoso")
    print(f"   Token: {token[:30]}...")
    
    # 2. Bootstrap endpoint
    print("\n2️⃣ Testing Bootstrap Endpoint...")
    headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
    bootstrap_response = client.get('/api/v1/permisos/modulos/bootstrap/', **headers)
    
    if bootstrap_response.status_code == 200:
        bootstrap_data = json.loads(bootstrap_response.content)
        print(f"✅ Bootstrap endpoint funciona!")
        print(f"   Campos retornados: {list(bootstrap_data.keys())}")
        print(f"   Roles: {bootstrap_data.get('roles', [])}")
        print(f"   Num Catalogs: {len(bootstrap_data.get('catalogs', {}))}")
        print(f"   Catalogs keys: {list(bootstrap_data.get('catalogs', {}).keys())}")
        print(f"   Branding APP: {bootstrap_data.get('branding', {}).get('app_name', 'N/A')}")
        print(f"   Has Navigation: {'navigation' in bootstrap_data}")
        print(f"   Has Route Permissions: {'route_permissions' in bootstrap_data}")
        
        print("\n" + "=" * 60)
        print("✅ VALIDACIÓN EXITOSA - TODO FUNCIONA")
        print("=" * 60)
    else:
        print(f"❌ Bootstrap error: {bootstrap_response.status_code}")
        print(f"Response: {bootstrap_response.content}")
else:
    print(f"❌ Login failed: {response.status_code}")
    print(f"Response: {response.content}")
