import json
import urllib.parse
import urllib.request

PAGE_ACCESS_TOKEN = "EAAQIpRTVlX4BS9aljdLKpt6ZCakjMmjCt6Xwrmffyq5LLRZBK5my0PCKlgoUaQu6S4jLnO2xbKDOdF5CZAFDfMx4z9QFITNWTE3OpTWvZCzmVsOjRRxcU7wLn0aOvQkZCwVp5fRf6zjalvqDgsqIDdQHKVkIZCMR7P2j5DuOkjWDr2clxj75ZBZCJpn0LavANKcRF5glDqElB8iS6DrwhzwFdevD9x4JwplarbyZB5hYZD"
POST_ID = "931951470000304_122138258163163355"

visi_komentarai = []

# Prašome komentaro ID, autoriaus (jei yra), teksto, nuorodos ir prisegtų failų (GIF/foto)
params = urllib.parse.urlencode({
    'access_token': PAGE_ACCESS_TOKEN,
    'fields': 'id,from{name,id},message,attachment,permalink_url',
    'limit': '100'
})
url = f"https://graph.facebook.com/v26.0/{POST_ID}/comments?{params}"

print("Pradedamas VISŲ komentarų siuntimas iš Facebook...")
puslapis = 1

while url:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print("Užklausos klaida:", e)
        break

    if 'error' in res:
        print("Facebook API klaida:", res['error']['message'])
        break

    data = res.get('data', [])
    if not data:
        break

    for k in data:
        cid = k.get('id')
        from_data = k.get('from', {})
        vardas = from_data.get('name') if from_data else None
        
        # Jei API negrąžina vardo dėl privatumo, nurodome ID
        autoriaus_etikete = vardas or f"Dalyvis #{cid.split('_')[-1]}"
        tekstas = k.get('message', '').strip()
        link = k.get('permalink_url') or f"https://www.facebook.com/{cid}"

        # Tikriname GIF arba nuotrauką
        medija_url = None
        attachment = k.get('attachment', {})
        if attachment:
            media_info = attachment.get('media', {}).get('image', {})
            medija_url = media_info.get('src') or attachment.get('url')

        visi_komentarai.append({
            'autorius': autoriaus_etikete,
            'tekstas': tekstas or '(tik GIF / medija)',
            'medija': medija_url,
            'nuoroda': link
        })

    print(f"Puslapis {puslapis}: surinkta jau {len(visi_komentarai)} komentarų...")
    
    # Meta pagination
    paging = res.get('paging', {})
    url = paging.get('next')
    puslapis += 1

with open("komentarai.json", "w", encoding="utf-8") as f:
    json.dump(visi_komentarai, f, ensure_ascii=False, indent=2)

print(f"\nBaigta! Sėkmingai išsaugota {len(visi_komentarai)} komentarų į 'komentarai.json'.")
