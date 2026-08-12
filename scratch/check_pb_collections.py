import urllib.request
import json

base_url = 'http://172.18.6.98:8090'
auth_req = urllib.request.Request(
    f'{base_url}/api/admins/auth-with-password',
    data=json.dumps({'identity': 'ardila.firdaus@sig.id', 'password': 'makassar@270989'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(auth_req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        token = res.get('token')
        print("Admin Auth Success!\n")
        
        req_col = urllib.request.Request(
            f'{base_url}/api/collections?perPage=500',
            headers={'Authorization': token}
        )
        with urllib.request.urlopen(req_col) as c_resp:
            cols = json.loads(c_resp.read().decode('utf-8'))
            items = cols.get('items', [])
            print(f"Total Collections: {len(items)}\n")
            
            collections_summary = []
            for col in items:
                col_name = col['name']
                col_type = col['type']
                fields = [f['name'] for f in col.get('schema', [])]
                
                # Try getting record count
                cnt = 0
                try:
                    r_req = urllib.request.Request(
                        f'{base_url}/api/collections/{col_name}/records?perPage=1',
                        headers={'Authorization': token}
                    )
                    with urllib.request.urlopen(r_req) as r_resp:
                        r_data = json.loads(r_resp.read().decode('utf-8'))
                        cnt = r_data.get('totalItems', 0)
                except Exception as ex:
                    cnt = 'Error'
                
                collections_summary.append({
                    'name': col_name,
                    'type': col_type,
                    'count': cnt,
                    'fields': fields
                })
                print(f"[{col_type.upper()}] {col_name} ({cnt} records): {', '.join(fields[:8])}{'...' if len(fields) > 8 else ''}")

            with open('scratch/pb_collections_summary.json', 'w') as f:
                json.dump(collections_summary, f, indent=2)

except Exception as e:
    print("Error:", e)
