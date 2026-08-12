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

    r_mat = urllib.request.Request(f'{base_url}/api/collections/ccr_material_usage/records?perPage=100&sort=-date', headers=headers)
    with urllib.request.urlopen(r_mat) as res:
        records = json.loads(res.read().decode('utf-8')).get('items', [])

    by_date = {}
    for r in records:
        d = r.get('date')
        if not d: continue
        if d not in by_date:
            by_date[d] = {'clinker': 0, 'gypsum': 0, 'limestone': 0, 'trass': 0, 'total': 0}
        by_date[d]['clinker'] += float(r.get('clinker') or 0)
        by_date[d]['gypsum'] += float(r.get('gypsum') or 0)
        by_date[d]['limestone'] += float(r.get('limestone') or 0)
        by_date[d]['trass'] += float(r.get('trass') or 0) + float(r.get('fine_trass') or 0)
        by_date[d]['total'] += float(r.get('total_production') or 0)

    print("=== Material Usage Daily Aggregated (Recent 7 days) ===")
    dates = sorted(by_date.keys(), reverse=True)[:7]
    for d in dates:
        st = by_date[d]
        print(f"Date: {d} | Total: {st['total']:.1f} Ton | Clinker: {st['clinker']:.1f}, Gypsum: {st['gypsum']:.1f}, Limestone: {st['limestone']:.1f}, Trass: {st['trass']:.1f}")
