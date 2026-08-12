import urllib.request
import json

base_url = 'http://172.18.6.98:8090'
auth_req = urllib.request.Request(
    f'{base_url}/api/admins/auth-with-password',
    data=json.dumps({'identity': 'ardila.firdaus@sig.id', 'password': 'makassar@270989'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

with urllib.request.urlopen(auth_req) as resp:
    token = json.loads(resp.read().decode('utf-8')).get('token')
    headers = {'Authorization': token}

    for col in ['ccr_material_usage', 'ccr_downtime_data', 'silo_capacities', 'ccr_silo_data']:
        r = urllib.request.Request(f'{base_url}/api/collections/{col}/records?perPage=1&sort=-created', headers=headers)
        with urllib.request.urlopen(r) as res:
            data = json.loads(res.read().decode('utf-8'))
            print(f"=== {col} (total {data.get('totalItems')}) ===")
            if data.get('items'):
                print(json.dumps(data['items'][0], indent=2))
