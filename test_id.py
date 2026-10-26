import json
import urllib.parse
import urllib.request

PAGE_ACCESS_TOKEN = "EAAQIpRTVlX4BS9aljdLKpt6ZCakjMmjCt6Xwrmffyq5LLRZBK5my0PCKlgoUaQu6S4jLnO2xbKDOdF5CZAFDfMx4z9QFITNWTE3OpTWvZCzmVsOjRRxcU7wLn0aOvQkZCwVp5fRf6zjalvqDgsqIDdQHKVkIZCMR7P2j5DuOkjWDr2clxj75ZBZCJpn0LavANKcRF5glDqElB8iS6DrwhzwFdevD9x4JwplarbyZB5hYZD"
POST_ID = "931951470000304_122138258163163355"

# Tikriname patį įrašą ir jo priedus (attachments / photos)
params = urllib.parse.urlencode({
    'access_token': PAGE_ACCESS_TOKEN,
    'fields': 'id,message,attachments{target,type,url},object_id'
})
url = f"https://graph.facebook.com/v26.0/{POST_ID}?{params}"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("Gauta įrašo informacija:")
        print(json.dumps(res, indent=2, ensure_ascii=False))
except Exception as e:
    print("Klaida:", e)
