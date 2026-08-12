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

    r_dt = urllib.request.Request(f'{base_url}/api/collections/ccr_downtime_data/records?perPage=200&sort=-date', headers=headers)
    with urllib.request.urlopen(r_dt) as res:
        downtimes = json.loads(res.read().decode('utf-8')).get('items', [])

    print("=== Downtime Sample Summary ===")
    groups = {}
    for d in downtimes:
        prob = d.get('problem') or d.get('category') or 'Uncategorized'
        dur = d.get('duration_minutes') or 0
        if not dur and d.get('start_time') and d.get('end_time'):
            try:
                sh, sm = map(int, d['start_time'].split(':'))
                eh, em = map(int, d['end_time'].split(':'))
                dur = (eh*60 + em) - (sh*60 + sm)
                if dur < 0: dur += 1440
            except:
                dur = 0
        groups[prob] = groups.get(prob, 0) + dur
    
    sorted_g = sorted(groups.items(), key=lambda x: x[1], reverse=True)[:10]
    for p, dur in sorted_g:
        print(f"- {p}: {dur} min ({dur/60:.1f} hours)")
