# Wspólne zasoby Pan Stolarz

## Logotypy

Przeniesiono 19 oryginalnych WebP z `SrebrnyAndrzej/mussi-plyta`, commit `ea25327a62a7eb3351ba2295fbeb05b145b50f9d`, folder `public/logotypy`. Kopie w `web/public/brand/manufacturers`, manifest z sumami SHA-256 w `manufacturers.json`. Bez logo samej hurtowni Mussi, bez hotlinkowania i przerysowywania znaków. Dostępne przez statyczny hosting również po przeniesieniu na OVH.

Ten zbiór jest biblioteką zasobów; obecność pliku nie oznacza, że Pan Stolarz oferuje każdą markę ani jest jej autoryzowanym partnerem. Do sekcji publicznej dobierać marki zgodne z potwierdzoną ofertą. W pozyskanym folderze nie ma logo Egger ani Blum — nie zastępować ich innymi znakami.

## Dekory

Repozytorium `Stolarnia-web` już zawiera 644 zdjęcia: 408 Egger i 236 Kronospan. Katalog `docs/materialy/katalog-dekorow-PL.json`, zdjęcia `docs/materialy/obrazy`, dane artykułów Egger obok. Nie tworzono drugiej kopii katalogu ani nie zmieniano identyfikatorów silnika. Ograniczenia danych i tekstur: `docs/materialy/README.md`.

Standardowy build kopiuje zdjęcia dekorów i okuć do `dist/web/api/...`, również poza Vercel. Własny serwer Express ma istniejące endpointy statyczne. Nie traktować zdjęć dekorów jako zatwierdzonych tekstur PBR ani kompletu formatów/grubości.
