# WebMCP Demo Collection

**WebMCP (Web Model Context Protocol)** entegrasyonunu gosteren interaktif web uygulamalari. Her uygulama bagimsiz calisir — WebMCP, yapay zeka ajanlarina programatik kontrol ekler.

## Nasil Calistirilir

Yerel bir HTTP sunucusu gereklidir (`file://` URL'leri calismaz — WebMCP guvenli baglan gerektirir).

```bash
# Python 3
python3 -m http.server 8000

# veya Node.js
npx http-server .
```

Tarayicida `http://localhost:8000` adresine gidin.

## Demolar

### 01 — Kanban Panosu (`kanban.html`)

Surekle-birak gorev yonetim panosu. Koyu cyberpunk temasi, glassmorphism efektleri.

| Arac | Aciklama | Parametreler |
| :--- | :--- | :--- |
| `create_task` | Yeni gorev olustur | `title`, `description`, `priority` (low/medium/high) |
| `move_task` | Gorevi tasI | `id`, `column` (todo/in-progress/done) |
| `delete_task` | Gorevi sil | `id` |
| `get_board_state` | Pano durumunu al | — |

### 02 — Market Alisveris Listesi (`market.html`)

Super App mimarisine sahip coklu market alisveris listesi. Alt uygulamalar (`markets/market1-3.html`) iframe icinde calisir ve araclarini `postMessage` ile ana uygulamaya kaydeder.

| Arac | Aciklama | Parametreler |
| :--- | :--- | :--- |
| `add_item` | Urun ekle | `name`, `store` |
| `move_item` | Urunu baska markete tasi | `name`, `store` |
| `remove_item` | Urunu sil | `name` |
| `update_item` | Urun adini guncelle | `name`, `new_name` |
| `get_market_state` | Tum listeyi al | — |

### 03 — Urun Arama (`search.html`)

Deklaratif WebMCP demosu. Duz bir HTML form, `toolname` ozelligi sayesinde otomatik olarak yapay zekanin cagirabildigi bir araca donusur. Arac kaydi icin sifir JavaScript gerektirir.

### 04 — Kat Plani Editoru (`floorplan/`)

Canvas tabanli mekansal oda duzeni editoru. En guclu WebMCP ornegi — canvas yapay zekaya tamamen opak (DOM yok, screenshot parse edilemez), ancak araclar metre cinsinden tam mekansal kontrol saglar. Oda boyutu: 8m × 6m.

| Arac | Aciklama | Parametreler |
| :--- | :--- | :--- |
| `add_furniture` | Mobilya ekle | `type`, `x`, `y`, `rotation` |
| `move_furniture` | Mobilya tasi | `id`, `x`, `y` |
| `rotate_furniture` | Mobilya dondur | `id`, `angle` |
| `remove_furniture` | Mobilya sil | `id` |
| `get_floor_state` | Kat planini al | — |
| `clear_floor` | Tum mobilyalari sil | — |

**Mobilya turleri:** sofa, bed, table, chair, desk, wardrobe, bookshelf, plant, tv, rug

## Mimari

- **Polyfill:** Uygulamalar `@mcp-b/global` polyfill'i yukler. Chrome native WebMCP destegi varsa polyfill'siz de calisir.
- **Arac Kaydi:** `navigator.modelContext.registerTool()` ile yapilir.
- **Super App:** `market.html` alt uygulama araclarini `postMessage` uzerinden toplar (`WEBMCP_REGISTER_TOOL` → `WEBMCP_EXECUTE_TOOL` → `WEBMCP_TOOL_RESULT`).
- **Deklaratif API:** `declarative-polyfill.js`, `toolname` ozellikli `<form>` elemanlarini otomatik olarak WebMCP araclarina cevirir.
- **State:** Tum uygulamalar bellekte basit bir `state` nesnesi kullanir, kalici depolama yoktur.
