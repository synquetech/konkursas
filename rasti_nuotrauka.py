import json
import urllib.parse
import urllib.request

PAGE_ACCESS_TOKEN = "EAAQIpRTVlX4BS9aljdLKpt6ZCakjMmjCt6Xwrmffyq5LLRZBK5my0PCKlgoUaQu6S4jLnO2xbKDOdF5CZAFDfMx4z9QFITNWTE3OpTWvZCzmVsOjRRxcU7wLn0aOvQkZCwVp5fRf6zjalvqDgsqIDdQHKVkIZCMR7P2j5DuOkjWDr2clxj75ZBZCJpn0LavANKcRF5glDqElB8iS6DrwhzwFdevD9x4JwplarbyZB5hYZD"

# Gauname puslapio įkeltas nuotraukas kartu su komentarų skaičiumi
params = urllib.parse.urlencode({
    'access_token': PAGE_ACCESS_TOKEN,
    'fields': 'id,name,created_time,comments.summary(true)',
    'limit': '10'
})
url = f"https://graph.facebook.com/v26.0/me/photos/uploaded?{params}"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        photos = res.get('data', [])
        print(f"\nRasta nuotraukų: {len(photos)}\n" + "="*50)
        for p in photos:
            photo_id = p.get('id')
            aprasymas = (p.get('name') or '(be prierašo)').replace('\n', ' ')[:60]
            komentaru_skaicius = p.get('comments', {}).get('summary', {}).get('total_count', 0)
            print(f"Nuotraukos ID: {photo_id}")
            print(f"Komentarų skaičius: {komentaru_skaicius}")
            print(f"Prierašas: {aprasymas}...")
            print("="*50)
except Exception as e:
    print("Klaida gaunant nuotraukas:", e)
