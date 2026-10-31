# Eksport materiałów marki z geometrii projektów

Skrypt czyta trzy uprzednio pobrane odpowiedzi analizy projektu oraz listę materiałów, przepuszcza dane przez istniejący `technicalView` i uruchamia lokalny renderer Three.js. Niczego nie zapisuje do bazy ani nie zmienia zasad konstrukcji.

```sh
npm run build
node scripts/brand-media/render.mjs /tmp/projekt-1.json /tmp/projekt-2.json /tmp/projekt-3.json /tmp/materialy.json
```

Wymagane: Chromium (lub PLAYWRIGHT_CHROMIUM_EXECUTABLE), ffmpeg i zainstalowane zależności projektu. Pliki wejściowe są prywatne i nie należą do repozytorium. Materiały wejściowe powinny mieć tylko id/nazwę/kod/producenta/kolor/grubość, bez cen. Trzeci projekt jest fotografowany kamerą dopasowaną do układu z wyspą.

Wyjście: trzy JPG 1920×1200 w web/public/renders oraz MP4 1280×720, 25 kl./s, 8 sekund i poster w web/public/animations. Animacja wykorzystuje istniejącą szafkę dolną 600 mm z drugiego projektu; transformuje wyłącznie pozycje widocznych części. To pokaz poglądowy, nie zatwierdzona kolejność montażu. Nie generuje wierceń ani okuć.

Mapowanie części korzysta z tych samych współrzędnych i funkcji geometrii co istniejący Widok3D. Podłoga i oświetlenie są studyjne; kolory wynikają z poglądowych HEX materiałów. Nie ma tekstur producentów ani modeli urządzeń AGD. Brakujące urządzenia nie są dopowiadane generatywnie. Wynik jest renderem technicznej geometrii, nie fotografią ani deklaracją pełnej wizualizacji wnętrza.

Serwer działa tylko na 127.0.0.1 podczas eksportu i jest zamykany po nim. Cenniki, dane kontaktowe, notatki i odpowiedzi API nie trafiają do publicznego katalogu. Publikowane są same obrazy i film. `RENDER_STILLS_ONLY=1` pomija kosztowniejszy eksport animacji.
