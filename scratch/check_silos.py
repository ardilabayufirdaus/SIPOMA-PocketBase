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

    r_silo = urllib.request.Request(f'{base_url}/api/collections/silo_capacities/records?perPage=50', headers=headers)
    with urllib.request.urlopen(r_silo) as res:
        silos = json.loads(res.read().decode('utf-8')).get('items', [])
    
    r_data = urllib.request.Request(f'{base_url}/api/collections/ccr_silo_data/records?perPage=200&sort=-date,-created', headers=headers)
    with urllib.request.urlopen(r_data) as res:
        records = json.loads(res.read().decode('utf-8')).get('items', [])

    silo_latest = {}
    for rec in records:
        sid = rec.get('silo_id')
        if sid and sid not in silo_latest:
            # find latest content
            c3 = rec.get('shift3_content')
            c2 = rec.get('shift2_content')
            c1 = rec.get('shift1_content')
            content = c3 if (c3 is not None and c3 > 0) else (c2 if (c2 is not None and c2 > 0) else (c1 if c1 is not None else 0))
            silo_latest[sid] = content

    print("=== Silo Occupancy Summary ===")
    total_cap = 0
    total_content = 0
    for s in silos:
        cap = s.get('capacity', 0)
        curr = silo_latest.get(s['id'], 0)
        total_cap += cap
        total_content += curr
        pct = (curr / cap * 100) if cap > 0 else 0
        print(f"- {s.get('silo_name')} ({s.get('unit')}): {curr:.1f} / {cap} Ton ({pct:.1f}%)")
    
    overall_pct = (total_content / total_cap * 100) if total_cap > 0 else 0
    print(f"\nOverall Occupancy: {overall_pct:.1f}% ({total_content:.1f} / {total_cap} Ton)")
